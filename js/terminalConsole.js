/**
 * @fileoverview This file contains the `TerminalConsole` class, 
 * which manages a simulated terminal console for displaying messages and logs. 
 */

export class TerminalConsole {
  /**
   * Creates a new `TerminalConsole` instance.
   * @param {string} consoleId - The ID of the HTML element representing the console container.
   * @param {string} closeButtonId - The ID of the HTML element representing the close button.
   * @param {string} openButtonId - The ID of the HTML element representing the open button.
   * @param {string} lineClass - The class name used for console lines.
   * @param {string} textClass - The class name used for the text content within console lines.
   * @param {string} wrapperClass - The class name used for the console content wrapper.
   */
  constructor(consoleId, closeButtonId, openButtonId, lineClass, textClass, wrapperClass) {
    this.console = document.getElementById(consoleId);
    this.closeButton = document.getElementById(closeButtonId);
    this.openButton = document.getElementById(openButtonId);
    this.lineClass = lineClass;
    this.textClass = textClass;
    this.wrapperClass = wrapperClass;

    if (!this.console || !this.openButton || !this.closeButton) {
      console.error("Console elements not found. Check IDs.");
      return; // Prevent errors if elements are missing
    }
  }

  /**
   * Clones the original console line element, sets the new text, and appends it to the console.
   * @param {string} newText - The new text content to be displayed in the cloned console line.
   */
  cloneAndAppendConsoleLine(newText) {
    const originalConsoleLine = document.querySelector(`.${this.lineClass}`);

    if (!originalConsoleLine) {
      console.error(`Element with class "${this.lineClass}" not found.`);
      return;
    }

    const clonedConsoleLine = originalConsoleLine.cloneNode(true);
    const textElement = clonedConsoleLine.querySelector(`.${this.textClass}`);

    if (!textElement) {
      console.error(`Element with class "${this.textClass}" not found.`);
      return; 
    }

    textElement.innerHTML = newText;

    const consoleResult = document.querySelector(`.${this.wrapperClass}`);
    if (consoleResult) {
      consoleResult.appendChild(clonedConsoleLine);
      consoleResult.scrollTop = consoleResult.scrollHeight; 
    } else {
      console.error(`Element with class "${this.wrapperClass}" not found.`);
    }
  }

  /**
   * Toggles the visibility of the console.
   */
  toggleConsole() {
    this.console.classList.toggle("open");
    this.closeButton.classList.toggle("d-none");
    this.openButton.classList.toggle("d-none");
  }

  /**
   * Shows the console.
   */
  showConsole() {
    this.console.classList.add("open");
    this.closeButton.classList.add("d-none");
    this.openButton.classList.remove("d-none");
  }
}