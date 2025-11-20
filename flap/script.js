const characters = generateCharacters();
const flapGrid = document.getElementById("flapGrid");
const delayBetweenCharacters = 10; // Adjust the delay between characters (in milliseconds)
const waveHeight = 1; // Adjust the wave height (number of rows) as needed
const charactersPerWave = 1; // Adjust the number of characters per wave

class FlappingElement {
  constructor() {
    this.element = document.createElement("div");
    this.characters = shuffleArray(characters); // Randomly shuffle the characters
    this.currentIndex = 0;
    this.setupFlapElement();
  }

  setupFlapElement() {
    this.element.classList.add("flap");
    this.updateText();
  }

  startFlapping() {
    this.flapInterval = setInterval(() => {
      this.flap();
      this.updateText();
    }, 0.01); // Decreased interval to 1 ms for faster flapping
  }

  flap() {
    this.currentIndex = (this.currentIndex + 1) % this.characters.length;

    // Introduce an additional delay after every 'charactersPerWave' characters
    if (this.currentIndex % charactersPerWave === 0) {
      clearInterval(this.flapInterval); // Pause the flapping
      setTimeout(() => {
        this.flapInterval = setInterval(() => {
          this.flap();
          this.updateText();
        }, 1); // Resume the flapping after the additional delay
      }, delayBetweenCharacters);
    }
  }

  updateText() {
    this.element.textContent = this.characters[this.currentIndex];
  }
}

function generateCharacters() {
  const characterSets = [
    // ASCII characters
    { start: 33, end: 126 },
    // Latin-1 Supplement
    { start: 161, end: 255 },
    // Greek and Coptic
    { start: 880, end: 1023 },
    // Cyrillic (Reduced range to include some characters)
    { start: 1040, end: 1103 },
    // Arabic (Reduced range to include some characters)
    { start: 1575, end: 1657 },
    // Devanagari
    { start: 2304, end: 2431 },
    // Hiragana (A subset of characters)
    { start: 12352, end: 12359 },
    // Katakana (A subset of characters)
    { start: 12448, end: 12455 },
    // Chinese (Simplified) - Common characters (A subset of characters)
    { start: 19968, end: 19975 },
  ];

  const characters = [];
  for (const charSet of characterSets) {
    const charSetCharacters = [];
    for (let i = charSet.start; i <= charSet.end; i++) {
      charSetCharacters.push(String.fromCharCode(i));
    }
    characters.push(...shuffleArray(charSetCharacters)); // Shuffle and concatenate
  }
  return characters;
}



function shuffleArray(array) {
  // Fisher-Yates shuffle algorithm
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function createFlapGrid(rows, cols) {
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const rowOffset = Math.floor(cols / 2) - Math.abs(j - Math.floor(cols / 2));
      const flapElement = new FlappingElement();
      flapGrid.appendChild(flapElement.element);
      flapElement.startFlapping();
      setTimeout(() => {
        clearInterval(flapElement.flapInterval);
      }, delayBetweenCharacters * flapElement.characters.length);
    }
    flapGrid.appendChild(document.createElement("br"));
    if (i >= waveHeight && i < rows - waveHeight) {
      flapGrid.appendChild(document.createElement("br")); // Add an extra line break to create the wave effect
    }
  }
}

createFlapGrid(50, 50);
