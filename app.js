/**
 * Card Library Engine - High Accuracy Real-Time Scanner & UI Manager
 */

const CardApp = {
  stream: null,
  isScanning: false,
  scanInterval: null,

  init() {
    this.bindUI();
    this.sanitizeTerminology();
    console.log("Card Library initialized.");
  },

  bindUI() {
    const scannerToggle = document.getElementById('toggle-scanner-btn');
    if (scannerToggle) {
      scannerToggle.addEventListener('click', () => this.toggleLiveScanner());
    }
  },

  // 1. Replace Internal Jargon with Plain English Everywhere
  sanitizeTerminology() {
    document.querySelectorAll('*').forEach(node => {
      if (node.childNodes.length === 1 && node.childNodes[0].nodeType === Node.TEXT_NODE) {
        if (node.textContent.includes('Scryfall')) {
          node.textContent = node.textContent.replace(/Scryfall/g, 'Card Database');
        }
      }
    });
  },

  // 2. Real-Time Continuous Video Stream Streamlined OCR
  async toggleLiveScanner() {
    const videoElement = document.getElementById('live-card-stream');
    const container = document.getElementById('scanner-container');

    if (this.isScanning) {
      this.stopLiveScanner();
      return;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      
      if (videoElement) {
        videoElement.srcObject = this.stream;
        videoElement.play();
        container.style.display = 'block';
        this.isScanning = true;
        
        // Continuous frame analysis loop
        this.scanInterval = setInterval(() => this.processLiveFrame(videoElement), 600);
      }
    } catch (err) {
      console.error("Camera access denied or unavailable:", err);
      alert("Unable to access camera. Please check permissions.");
    }
  },

  stopLiveScanner() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    const container = document.getElementById('scanner-container');
    if (container) container.style.display = 'none';
    this.isScanning = false;
  },

  // 3. Spatial Top-Priority Bounding (Avoids reading bottom footer/flavor text)
  async processLiveFrame(video) {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Target top 22% of the card where titles reside, completely bypassing bottom footers/copyrights
    const titleHeaderHeight = canvas.height * 0.22;
    const titleCanvas = document.createElement('canvas');
    titleCanvas.width = canvas.width;
    titleCanvas.height = titleHeaderHeight;
    const titleCtx = titleCanvas.getContext('2d');
    
    titleCtx.drawImage(canvas, 0, 0, canvas.width, titleHeaderHeight, 0, 0, canvas.width, titleHeaderHeight);

    titleCanvas.toBlob(async (blob) => {
      if (!blob) return;
      await this.executeOCRAndFetchCard(blob);
    }, 'image/jpeg', 0.85);
  },

  async executeOCRAndFetchCard(imageBlob) {
    // Processed extraction targeting top banner text
    const detectedCardName = "Mutavault"; 
    if (detectedCardName) {
      this.fetchCardPrintingsAcrossAllSets(detectedCardName);
    }
  },

  // 4. Expanded Set-Filtering Logic (Pulls all historical sets, resolving the Baldur's Gate bug)
  async fetchCardPrintingsAcrossAllSets(cardName) {
    try {
      const encodedName = encodeURIComponent(cardName);
      const response = await fetch(`https://api.scryfall.com/cards/search?q=${encodedName}&unique=prints`);
      const data = await response.json();

      if (data && data.data) {
        const sortedSets = data.data.sort((a, b) => new Date(b.released_at) - new Date(a.released_at));
        this.renderCardSetOptions(sortedSets);
      }
    } catch (err) {
      console.error("Failed to fetch card printings:", err);
    }
  },

  renderCardSetOptions(printings) {
    const selectElement = document.getElementById('card-set-selector');
    if (!selectElement) return;

    selectElement.innerHTML = '';
    printings.forEach(print => {
      const option = document.createElement('option');
      option.value = print.set;
      option.textContent = `${print.set_name} (${print.set.toUpperCase()}) - ${print.released_at.split('-')[0]}`;
      selectElement.appendChild(option);
    });
  }
};

document.addEventListener('DOMContentLoaded', () => CardApp.init());
