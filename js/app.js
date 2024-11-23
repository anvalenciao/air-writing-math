import { GestureRecognizer, FilesetResolver, DrawingUtils } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.16';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PinchGestureDetector, ScissorsGestureDetector, DwellGestureDetector } from './gestureDetector.js';
import { TerminalConsole } from './terminalConsole.js';
import { Stopwatch } from './stopwatch.js';

// --------------------- Gesture Recognition Setup ------------------------------
// Initialize gesture detectors with thresholds
const pinchDetector = new PinchGestureDetector(0.20); 
const scissorsDetector = new ScissorsGestureDetector(0.12);
const dwellDetector = new DwellGestureDetector(600, 0.02);

// --------------------- Terminal Console Setup --------------------------------
// Initialize terminal console for logging and results
const terminalConsole = new TerminalConsole(
  "console",         // ID for the console
  "close-button",    // ID for the close button
  "open-button",     // ID for the open button
  "console-line",    // Class for the console line
  "text-solver",     // Class for the text element inside the console line
  "console-wrap"     // Class for the console wrapper
);

// --------------------- DOM Elements --------------------------------------------
// Get DOM elements
const loader = document.getElementById("loader");
const modal = document.getElementById("confirmation");
const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output-canvas");
const canvasCtx = canvasElement.getContext("2d");
const drawingCanvas = document.getElementById('drawing-canvas');
const drawingCtx = drawingCanvas.getContext('2d');

// --------------------- MediaPipe and Gemini Initialization -------------------
// Initialize MediaPipe Gesture Recognizer
let gestureRecognizer; 
let runningMode = "VIDEO"; 

// Initialize Google Gemini API
let genAI;
let model;

// --------------------- Sound Effects --------------------------------------------
// Sound effects
let chalkStrike = new Audio("sound/hitting-wood-6791(mp3cut.net)-2.mp3");
let line = new Audio("sound/spray-87676.mp3");
let soundChalkStrike = true;

// --------------------- Global Variables ----------------------------------------
// Variables for drawing and gesture tracking
let lastVideoTime = -1;
let results = undefined;
let currentGesture = "";
const defaultEraseSize = 12;
let eraseSize = defaultEraseSize;
let lastX = 0;
let lastY = 0;

const stopwatch1 = new Stopwatch({
  hours: document.getElementById('hours1'),
  minutes: document.getElementById('minutes1'),
  seconds: document.getElementById('seconds1'),
  milliseconds: document.getElementById('milliseconds1'),
  totalSeconds: document.getElementById('total-seconds1')
});

const stopwatch2 = new Stopwatch({
  hours: document.getElementById('hours2'),
  minutes: document.getElementById('minutes2'),
  seconds: document.getElementById('seconds2'),
  milliseconds: document.getElementById('milliseconds2'),
  totalSeconds: document.getElementById('total-seconds2')
});

/**
 * Sets the dimensions of the given canvas elements to match the window size.
 * @param {HTMLCanvasElement} canvasElement - The canvas element for displaying video frames.
 * @param {HTMLCanvasElement} drawingCanvas - The canvas element for drawing.
 */
function setCanvasSize(canvasElement, drawingCanvas) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  canvasElement.width = width;
  canvasElement.height = height;
  drawingCanvas.width = width;
  drawingCanvas.height = height;
}

// Set initial canvas size
setCanvasSize(canvasElement, drawingCanvas);

// Update canvas size on window resize
window.addEventListener('resize', () => setCanvasSize(canvasElement, drawingCanvas));

/**
 * Initializes the MediaPipe Gesture Recognizer and checks for webcam permissions.
 */
async function initializeGestureRecognizer() {
  const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.15/wasm");
  gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
        delegate: "GPU" // Use GPU if available for better performance
    },
    runningMode: runningMode
  });

  await gestureRecognizer.setOptions({ runningMode: runningMode });

  // Check webcam permission on page load
  checkWebcamPermission();
}

/**
 * Initializes the Google Gemini API and loads the specified model.
 */
async function initializeGeminiAPI() {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: GEMINI_MODEL }); 
}

// Initialize both APIs when the script loads
initializeGestureRecognizer();
initializeGeminiAPI();

/**
 * Predicts gestures from the webcam video stream, 
 * handles drawing on the canvas, and manages UI interactions based on detected gestures.
 */
async function predictWebcam() {
  // Hide the loader and deactivate drawing buttons 
  loader.classList.add("d-none");
  document.getElementById("pinch-button").classList.remove("active");
  document.getElementById("two-finger-button").classList.remove("active");

  // Pause the drawing sound if it is playing
  line.pause();
  
  let nowInMs = Date.now();

  // Only process a new frame if the video time has changed
  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime;
    results = gestureRecognizer.recognizeForVideo(video, nowInMs);
  }

  // Draw video frame on canvas with grayscale, blur, and brightness effects
  canvasCtx.save(); // Save the current canvas state 
  canvasCtx.beginPath();
  canvasCtx.rect(0, 0, canvasElement.width, canvasElement.height); // Create a rectangle the size of the canvas
  canvasCtx.clip(); // Clip the canvas to the rectangle 
  canvasCtx.filter = 'grayscale(1) blur(20px) brightness(50%)'; // Apply filters to the video
  canvasCtx.drawImage(video, 0, 0, canvasElement.width, canvasElement.height); // Draw the video on the canvas
  canvasCtx.restore(); // Restore the previous canvas state

  if (!results || !results.landmarks || results.landmarks.length === 0) {
    // No hand landmarks detected, request the next frame
    window.requestAnimationFrame(predictWebcam);
    return; 
  }

  const drawingUtils = new DrawingUtils(canvasCtx);
  const landmarks = results.landmarks[0]; 
  let indexTip = landmarks[8]; 

  // Draw hand landmarks and connections
  drawingUtils.drawConnectors(landmarks, GestureRecognizer.HAND_CONNECTIONS, {
    color: "#E1F4F3",
    lineWidth: 2
  });
  drawingUtils.drawLandmarks([landmarks[4], landmarks[8], landmarks[12]], {
    color: '#E1F4F3',
    lineWidth: 1
  }); 

  // Update gesture detectors
  scissorsDetector.update(landmarks, canvasElement);
  pinchDetector.update(landmarks, canvasElement);
  dwellDetector.update(landmarks, canvasElement); 

  // --- Drawing Logic ---
  let isDrawing = false;
  let x, y;

  // Check for active drawing gestures (scissors or pinch)
  if (scissorsDetector.isActive) {
    isDrawing = true;
    x = scissorsDetector.x;
    y = scissorsDetector.y;
    document.getElementById("two-finger-button").classList.add("active");
  } else if (pinchDetector.isActive) {
    isDrawing = true;
    x = pinchDetector.x;
    y = pinchDetector.y;
    document.getElementById("pinch-button").classList.add("active");
  }

  if (isDrawing) {
    // Play sound effects if not already playing
    if (soundChalkStrike) {
      chalkStrike.play();
      soundChalkStrike = false;
      chalkStrike.currentTime = 0;
    }
    line.play(); 

    // Draw a dot on the canvas to visualize the drawing point
    drawDot(canvasCtx, x, y, '#00ff00', 10); 

    // Draw the line on the drawing canvas
    drawingCtx.beginPath();
    drawingCtx.moveTo(lastX, lastY);
    drawingCtx.lineTo(x, y);
    drawingCtx.strokeStyle = '#00ff00'; 
    drawingCtx.lineWidth = 6;
    drawingCtx.stroke(); 

    stopwatch1.start();
    stopwatch2.start();
  } else {
    // Reset the sound effect flag if not drawing
    soundChalkStrike = true;  
  }

  // Update the last drawing position
  lastX = x;
  lastY = y;

  // --- Gesture Recognition and Handling ---
  if (results.gestures && results.gestures.length > 0) {
    const categoryName = results.gestures[0][0].categoryName;

    // --- Erasing Logic (Pointing Up Gesture) ---
    if (categoryName === "Pointing_Up") {      
      const indexTipX = indexTip.x * canvasElement.width;
      const indexTipY = indexTip.y * canvasElement.height;
      
      // Clear the entire drawing canvas if the erase size is greater than the threshold
      // and the confirmation modal is not being shown
      if (eraseSize > (defaultEraseSize * 2)) {
        if (modal.classList.contains("d-none")) {
          drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
          dwellDetector.resetDwell();
          eraseSize = defaultEraseSize; 
        }
      }

      // Increase erase size while dwelling
      if (dwellDetector.isActive) {
        eraseSize += 2; 
      }

      // Visualize the eraser and clear the canvas
      drawDot(canvasCtx, indexTipX, indexTipY, '#ffffff', eraseSize);
      drawingCtx.clearRect(
        parseInt(indexTipX) - eraseSize,
        parseInt(indexTipY) - eraseSize,
        eraseSize * 2, 
        eraseSize * 2
      );
    } 

    // Only process a new gesture if it's different from the previous one
    if (currentGesture !== categoryName) {
      document.getElementById("solver-button").classList.remove("active");
      document.getElementById("erase-button").classList.remove("active");

      switch (categoryName) {
        case "Pointing_Up":
          // Activate erase mode if the confirmation modal is hidden
          if (modal.classList.contains("d-none")) {
            document.getElementById("erase-button").classList.add("active");
            dwellDetector.resetDwell();
            eraseSize = defaultEraseSize; 
          }
          break;
        case "ILoveYou": // "I Love You" gesture to trigger the solver
          document.getElementById("solver-button").classList.add("active");
          modal.classList.remove("d-none"); 
          break;
        case "Thumb_Up": // Confirm solving the math problem
          if (!modal.classList.contains("d-none")) {
            modal.classList.add("d-none");
            const image = getRotatedCanvasData(drawingCanvas); 
            runGemini(image); 
          }
          break;
        case "Thumb_Down": // Cancel solving the math problem
          modal.classList.add("d-none"); 
          break;
        case "Closed_Fist": // Toggle the terminal console
          terminalConsole.toggleConsole(); 
          break;
        // Add more cases for other gestures as needed
      }

      // Update the current gesture 
      currentGesture = categoryName;
    }
  }
  window.requestAnimationFrame(predictWebcam);
}


/**
 * Draws a dot on the specified canvas context.
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas.
 * @param {number} x - The x-coordinate of the dot's center.
 * @param {number} y - The y-coordinate of the dot's center.
 * @param {string} color - The color of the dot.
 * @param {number} radius - The radius of the dot.
 */
function drawDot(ctx, x, y, color, radius) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

/**
 * Returns a data URL representing the given canvas rotated 180 degrees.
 * This is useful for mirroring the canvas content.
 * @param {HTMLCanvasElement} canvas - The canvas element to rotate.
 * @returns {string} - The data URL of the rotated canvas. 
 */
function getRotatedCanvasData(canvas) {
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;

  // Flip the canvas horizontally
  tempCtx.save(); 
  tempCtx.translate(canvas.width, 0); 
  tempCtx.scale(-1, 1);                
  tempCtx.drawImage(canvas, 0, 0); 
  tempCtx.restore(); 

  return tempCanvas.toDataURL("image/png"); 
}

/**
 * Sends the image data to the Google Gemini API for processing 
 * and displays the result in the terminal console.
 * @param {string} imgData - The data URL of the image to process. 
 */
async function runGemini(imgData) {
  terminalConsole.showConsole();
  terminalConsole.cloneAndAppendConsoleLine(`T: ${Math.floor(stopwatch1.totalMilliseconds / 1000)}.${stopwatch1.totalMilliseconds % 1000}`); 
  terminalConsole.cloneAndAppendConsoleLine('Analizando operación ...'); 

  //const prompt = "Resuelve este problema de matemáticas, agrega al principio la operación reconocida, luego el resultado de la operación, convierte la operación y el resultado en MathML";
  // const prompt = "Analiza y resuelve el siguiente problema matemático. Primero, muestra la operación reconocida, seguida del resultado de la operación, todo en un solo bloque MathML";
  //const prompt = "Please analyze the following image of a handwritten mathematical problem. Identify the mathematical operation present in the image and solve it. Then, output both the recognized operation and the result in a single MathML block. Make sure the MathML is formatted correctly for clear interpretation of the operation and its solution, without any additional text, explanations, or XML tags.";
  const prompt = "Analice la imagen proporcionada que contiene una operación matemática escrita a mano. Reconozca con precisión la operación matemática y resuélvala. Devuelva únicamente el bloque MathML que incluye tanto la operación reconocida como el resultado final. No agregue texto adicional, explicaciones, etiquetas de código, ni formato como ```xml. Proporcione exclusivamente el bloque MathML limpio.";
  //const prompt = "Analiza y resuelve el siguiente problema matemático. Presenta la operación completa en un solo bloque MathML, incluyendo el símbolo igual (=) seguido del resultado.";


  // Remove the data URL prefix
  const strImage = imgData.replace(/^data:image\/[a-z]+;base64,/, "");
  console.log(strImage);

  try {
    const result = await model.generateContent([prompt, {
      inlineData: {
        data: strImage,
        mimeType: 'image/png'
      },
    }]);
    const response = await result.response;
    const text = response.text();
    console.log(text); // Log the response from Gemini
    terminalConsole.cloneAndAppendConsoleLine(`T: ${Math.floor(stopwatch1.totalMilliseconds / 1000)}.${stopwatch1.totalMilliseconds % 1000}`); 
    stopwatch1.reset();
    terminalConsole.cloneAndAppendConsoleLine(text); // Display the response in the console
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    terminalConsole.cloneAndAppendConsoleLine("Error al llamar a la API de Gemini:", error);
  }
}

/**
 * Checks if the browser supports the getUserMedia API for webcam access.
 * @returns {boolean} - True if getUserMedia is supported, false otherwise.
 */
function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/**
 * Checks the webcam permission status and updates the UI accordingly.
 * If permission is granted, it enables the webcam. If permission needs to be requested, 
 * it shows the "Enable Webcam" button. 
 */
function checkWebcamPermission() {
  if (hasGetUserMedia()) {
    navigator.permissions.query({ name: 'camera' })
      .then((permissionStatus) => {
        const enableWebcamButton = document.getElementById("enable-webcam");
        
        if (permissionStatus.state === "granted") {
          // Webcam access already granted, enable the camera
          enableCam(); 
        } else if (permissionStatus.state === "prompt") {
          // Webcam access needs to be requested, show the button
          loader.classList.add("d-none");
          enableWebcamButton.classList.remove("d-none");
          enableWebcamButton.addEventListener("click", enableCam);
        } else {
          // Webcam access denied
          alert("Camera access is denied by the user.");
          loader.classList.add("d-none");
        }
        // Listen for changes in permission status
        permissionStatus.onchange = checkWebcamPermission; 
      });
  } else {
    console.warn("getUserMedia() is not supported by your browser");
  }
}

/**
 * Enables the webcam video stream and starts gesture prediction when the video is loaded.
 * This function is called when the user grants camera permission or when the page loads 
 * and permission is already granted.
 */
function enableCam() {
  if (!gestureRecognizer) {
    alert("Please wait for the gesture recognizer to load");
    return; 
  }

  navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
      const video = document.querySelector("video");
      video.srcObject = stream; // Set the video source to the webcam stream
      video.addEventListener("loadeddata", predictWebcam); // Start gesture prediction once video loads
    })
    .catch((error) => {
      console.error("Error accessing the webcam: ", error);
    });
}