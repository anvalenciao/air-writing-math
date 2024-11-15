export class Stopwatch {
  constructor(displayElements) {
    this._totalMilliseconds = 0; // Use a private property convention
    this.isRunning = false;
    this.timer = null;
    this.displayElements = displayElements; // Store display elements for this stopwatch
  }

  // Getter for totalMilliseconds
  get totalMilliseconds() {
      return this._totalMilliseconds;
  }

  start() {
      if (!this.isRunning) {
          this.isRunning = true;
          this.timer = setInterval(() => {
              this._totalMilliseconds += 10; // Increment by 10 milliseconds
              this.updateDisplay();
          }, 10);
      }
  }

  stop() {
      if (this.isRunning) {
          clearInterval(this.timer);
          this.isRunning = false;
      }
  }

  reset() {
      clearInterval(this.timer);
      this.isRunning = false;
      this._totalMilliseconds = 0;
      this.updateDisplay();
  }

  updateDisplay() {
      const hours = Math.floor(this._totalMilliseconds / 3600000);
      const minutes = Math.floor((this._totalMilliseconds % 3600000) / 60000);
      const seconds = Math.floor((this._totalMilliseconds % 60000) / 1000);
      const milliseconds = Math.floor((this._totalMilliseconds % 1000) / 10); // Get milliseconds in tenths

      this.displayElements.hours.textContent = String(hours).padStart(2, '0');
      this.displayElements.minutes.textContent = String(minutes).padStart(2, '0');
      this.displayElements.seconds.textContent = String(seconds).padStart(2, '0');
      this.displayElements.milliseconds.textContent = String(milliseconds).padStart(2, '0');
      this.displayElements.totalSeconds.textContent = `Total Segundos: ${Math.floor(this._totalMilliseconds / 1000)}`;
  }
}