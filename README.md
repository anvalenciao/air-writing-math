# Air-Writing Math

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

This web application utilizes the power of Google's Gemini 1.5 Flash API and MediaPipe for a unique and intuitive approach to solving mathematical equations. It enables users to write mathematical expressions on their webcam feed using simple hand gestures, which are then interpreted and solved by the application. 

## Features

- **Air-Writing Recognition:**  Write mathematical expressions naturally using either a "pinch" gesture (index finger and thumb close together) or a "scissors" gesture (index and middle fingers spread apart).
- **Gesture-Based Controls:** Use intuitive hand gestures for control:
    - **Solve:** Make the "I love you" gesture (pinky, index, and thumb extended) to trigger the equation solver.
    - **Erase:**  Point your index finger to erase. Dwell (hold the gesture) to gradually increase the size of the eraser or until the entire drawing canvas is cleared.
    - **Toggle Console:** Make a fist to show/hide the console, which displays the recognized equation and the result. 
- **Gemini 1.5 Flash Integration:** Leverages the advanced capabilities of Gemini to accurately interpret handwritten math expressions.
- **Real-Time Feedback:**  See your writing appear on the screen in real-time, making it easy to form expressions.

## Demo

You can try out the live demo of the application here: [Add Link to Live Demo] 

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- **Web Browser:** A modern web browser such as Chrome, Firefox, or Edge that supports webcam access.
- **Webcam:** A working webcam connected to your computer.
- **Google Gemini API Key:** Obtain your API key from [https://developers.google.com/gemini/](https://developers.google.com/gemini/).

### Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/anvalenciao/air-writing-math.git
   cd air-writing-math