/**
 * @fileoverview This file contains classes for detecting hand gestures based on MediaPipe landmark data.
 */

/**
 * Base class for gesture detectors, providing common functionality for calculating distances and hand areas.
 */
export class GestureDetectorBase {
  /**
   * Creates a new `GestureDetectorBase` instance.
   * @param {number} threshold - The threshold value used for gesture detection (e.g., distance between fingers).
   */
  constructor(threshold) {
    /**
     * The threshold value for gesture detection.
     * @type {number}
     */
    this.threshold = threshold;

    /**
     * Indicates if the gesture is currently being detected.
     * @type {boolean}
     */
    this.isActive = false;

    /**
     * The x-coordinate of the gesture's point of interest (e.g., center of a pinch).
     * @type {number}
     */
    this.x = 0;

    /**
     * The y-coordinate of the gesture's point of interest.
     * @type {number}
     */
    this.y = 0;
  }

  /**
   * Calculates the Euclidean distance between two 2D or 3D points.
   * @param {Object} point1 - The first point with 'x', 'y', and optional 'z' properties.
   * @param {Object} point2 - The second point with 'x', 'y', and optional 'z' properties.
   * @returns {number} The distance between the two points.
   */
  calculateDistance(point1, point2) {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    const dz = point1.z - point2.z; // Calculate z-difference if z-coordinates are provided
    return Math.sqrt(dx * dx + dy * dy + (dz ? dz * dz : 0)); // Use z-difference only if available
  }

  /**
   * Calculates the approximate area of the hand based on landmark positions.
   * The area is calculated as the bounding rectangle of the hand landmarks.
   * @param {Array<Object>} landmarks - An array of landmark objects with 'x' and 'y' properties.
   * @param {HTMLCanvasElement} canvasElement - The canvas element used for scaling the coordinates.
   * @returns {number} The approximate area of the hand in pixels.
   */
  calculateHandArea(landmarks, canvasElement) {
    const xl = []; // Array to store x-coordinates of landmarks
    const yl = []; // Array to store y-coordinates of landmarks

    // Iterate over each landmark and extract its scaled x and y coordinates
    landmarks.forEach((landmark) => {
      const xc = parseInt(landmark.x * canvasElement.width); // Scale x-coordinate to canvas width
      const yc = parseInt(landmark.y * canvasElement.height); // Scale y-coordinate to canvas height
      xl.push(xc); // Add scaled x-coordinate to the array
      yl.push(yc); // Add scaled y-coordinate to the array
    });

    // Find the minimum and maximum x and y coordinates to define the bounding rectangle
    const xmin = Math.min(...xl); // Minimum x-coordinate
    const xmax = Math.max(...xl); // Maximum x-coordinate
    const ymin = Math.min(...yl); // Minimum y-coordinate
    const ymax = Math.max(...yl); // Maximum y-coordinate

    return ((xmax - xmin) * (ymax - ymin)) / 100; // Calculate the area and adjust for scaling
  }
}

/**
 * Detects a pinch gesture, which is typically recognized when the tips of the index finger and thumb are close together.
 * @extends GestureDetectorBase
 */
export class PinchGestureDetector extends GestureDetectorBase {
  /**
   * Creates a new `PinchGestureDetector` instance.
   * @param {number} [threshold=0.1] - The threshold distance between the index finger and thumb tips to trigger a pinch gesture.
   */
  constructor(threshold = 0.1) {
    super(threshold); // Call the constructor of the base class
  }

  /**
   * Updates the gesture detector with new landmark data to check for the pinch gesture.
   * @param {Array<Object>} landmarks - An array of hand landmark objects from MediaPipe.
   * @param {HTMLCanvasElement} canvasElement - The canvas element used for scaling landmark coordinates.
   */
  update(landmarks, canvasElement) {
    // If no landmarks are provided, deactivate the gesture and return
    if (!landmarks || landmarks.length === 0) {
      this.isActive = false;
      return;
    }

    // Get specific landmark points for the wrist, index finger tip, and thumb tip
    const wrist = landmarks[0];        // Landmark representing the wrist
    const indexTip = landmarks[8];     // Landmark representing the tip of the index finger
    const thumbTip = landmarks[4];      // Landmark representing the tip of the thumb

    // Calculate the distance between the wrist and thumb tip as an approximate hand size reference
    const handLength = this.calculateDistance(wrist, thumbTip); 

    // Calculate the dynamic threshold for pinch detection based on hand size
    const distanceThreshold = handLength * this.threshold; 

    // Calculate the distance between the index finger tip and the thumb tip
    const distance = this.calculateDistance(indexTip, thumbTip);

    // Check if the distance between finger tips is less than the threshold to determine if a pinch is happening
    this.isActive = distance < distanceThreshold; 

    // If a pinch is detected, calculate the average x and y coordinates of the index finger tip and thumb tip
    if (this.isActive) {
      this.x = parseInt((thumbTip.x + indexTip.x) / 2 * canvasElement.width); 
      this.y = parseInt((thumbTip.y + indexTip.y) / 2 * canvasElement.height);
    }
  }
}

/**
 * Detects a "scissors" gesture, which is typically formed by extending the index and middle fingers apart.
 * This gesture detector assumes that the hand is in an open palm orientation.
 * @extends GestureDetectorBase
 */
export class ScissorsGestureDetector extends GestureDetectorBase {
  /**
   * Creates a new `ScissorsGestureDetector` instance.
   * @param {number} [threshold=0.1] - The threshold distance between the index and middle finger tips to trigger the gesture. 
   */
  constructor(threshold = 0.1) {
    super(threshold); // Call the constructor of the base class to initialize properties
  }

  /**
   * Updates the gesture detector's state based on the provided landmarks data.
   * @param {Array<Object>} landmarks - An array of hand landmark objects, each containing 'x', 'y', and 'z' properties.
   * @param {HTMLCanvasElement} canvasElement - The HTML canvas element used to scale landmark coordinates to canvas dimensions.
   */
  update(landmarks, canvasElement) {
    // If no landmarks are provided or the array is empty, set the gesture as inactive and return
    if (!landmarks || landmarks.length === 0) {
      this.isActive = false;
      return; 
    }

    // Extract the landmark points for the wrist, index finger tip, and middle finger tip
    const wrist = landmarks[0];       // Wrist landmark
    const indexTip = landmarks[8];    // Index finger tip landmark
    const middleTip = landmarks[12];   // Middle finger tip landmark

    // Calculate the distance between the wrist and middle fingertip, used as a reference for hand size
    const handLength = this.calculateDistance(wrist, middleTip);

    // Calculate a dynamic threshold distance based on hand size to determine the gesture
    const distanceThreshold = handLength * this.threshold; 

    // Calculate the distance between the index finger tip and the middle finger tip
    const distance = this.calculateDistance(indexTip, middleTip); 

    // Set 'isActive' to true if the calculated distance is less than the threshold, indicating the "scissors" gesture
    this.isActive = distance < distanceThreshold;

    // If the gesture is active, update the x and y properties to the average position of the index and middle fingertips
    if (this.isActive) {
      this.x = parseInt((indexTip.x + middleTip.x) / 2 * canvasElement.width);
      this.y = parseInt((indexTip.y + middleTip.y) / 2 * canvasElement.height);
    }
  }
}

/**
 * Detects a "dwell" gesture, which is triggered when a specific landmark remains within a certain radius for a defined duration. 
 * @export
 */
export class DwellGestureDetector {
  /**
   * Creates a new DwellGestureDetector instance.
   * @param {number} [dwellTime=800] - The minimum duration (in milliseconds) for a dwell to be recognized.
   * @param {number} [dwellRadius=0.05] - The radius around the initial landmark position within which the dwell is considered valid.
   */
  constructor(dwellTime = 800, dwellRadius = 0.05) { 
    /**
     * The required dwell time in milliseconds.
     * @type {number}
     */
    this.dwellTime = dwellTime; 

    /**
     * The dwell radius as a proportion of the screen size.
     * @type {number}
     */
    this.dwellRadius = dwellRadius; 

    /**
     * The timestamp when the dwell started.
     * @type {number|null}
     */
    this.dwellStart = null;

    /**
     * Flag indicating whether a dwell is currently in progress.
     * @type {boolean}
     */
    this.isDwelling = false;

    /**
     * The initial x-coordinate of the landmark when the dwell started.
     * @type {number|null}
     */
    this.initialX = null;

    /**
     * The initial y-coordinate of the landmark when the dwell started.
     * @type {number|null}
     */
    this.initialY = null;

    /**
     * Flag indicating whether the dwell gesture is currently active.
     * @type {boolean}
     */
    this.isActive = false; 

    /**
     * Optional callback function to be executed when a dwell gesture is detected.
     * @type {Function|null}
     */
    this.onDwellCallback = null;
  }

  /**
   * Updates the dwell gesture detector with the current landmark data.
   * @param {Array<Object>} landmarks - The array of landmarks to check for a dwell gesture.
   */
  update(landmarks) {
    if (!landmarks || landmarks.length === 0) {
      // Reset the dwell if no landmarks are provided
      this.resetDwell();
      this.isActive = false;
      return; 
    }

    const indexTipX = landmarks[8].x; // Get the x-coordinate of the landmark (index finger tip)
    const indexTipY = landmarks[8].y; // Get the y-coordinate of the landmark

    if (!this.isDwelling) {
      // If not currently dwelling, start tracking a new potential dwell
      this.initialX = indexTipX; 
      this.initialY = indexTipY; 
      this.dwellStart = performance.now(); // Record the start time of the dwell
      this.isDwelling = true; // Set the dwelling flag to true
    } else {
      // If currently dwelling, check if the dwell conditions are still met
      const distance = this.calculateDistance(this.initialX, this.initialY, indexTipX, indexTipY);
      if (distance > this.dwellRadius) {
        // Landmark moved outside the dwell radius, reset the dwell
        this.resetDwell(); 
      } else {
        // Landmark still within the dwell radius, check if enough time has passed
        const currentTime = performance.now();
        if (currentTime - this.dwellStart >= this.dwellTime) {
          // Dwell time reached, trigger the dwell action
          this.resetDwell(); 
          this.isActive = true; 
          // If a callback function is set, execute it with the initial dwell coordinates
          if (this.onDwellCallback) {
            this.onDwellCallback(this.initialX, this.initialY); 
          }
        } else {
          // Dwell time not yet reached, keep dwelling
          this.isActive = false;
        }
      }
    } 
  }

  /**
   * Sets the callback function to be executed when a dwell gesture is detected.
   * @param {Function} callback - The callback function to be set.
   */
  setOnDwellCallback(callback) {
    this.onDwellCallback = callback;
  }

  /**
   * Resets the dwell gesture detector to its initial state.
   */
  resetDwell() {
    this.dwellStart = null;
    this.isDwelling = false;
  }

  /**
   * Calculates the Euclidean distance between two points.
   * @param {number} x1 - The x-coordinate of the first point.
   * @param {number} y1 - The y-coordinate of the first point.
   * @param {number} x2 - The x-coordinate of the second point.
   * @param {number} y2 - The y-coordinate of the second point.
   * @returns {number} The distance between the two points.
   */
  calculateDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }
}