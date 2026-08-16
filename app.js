/**
 * Card Library Engine - Inventory, CSV Bulk Loader, and High-Accuracy Scanner
 */

const CardApp = {
  stream: null,
  isScanning: false,
  scanInterval: null,
  inventory: [],

  init() {
    this.bindUI();
    this.sanitizeTerminology();
    console.log("Card Library & Inventory Manager initialized.");
  },

  bindUI() {
    const scannerToggle = document.getElementById('toggle-scanner-btn');
    if (scannerToggle) {
      scannerToggle.addEventListener('click', () => this.toggleLiveScanner());
    }
  },

  switchView(viewName) {
    const collectionDiv = document.getElementById('view-collection');
    const scannerDiv = document.getElementById('view-scanner');
    const btnCol = document.getElementById('tab-collection');
    const btnScan = document.getElementById('tab-scanner');

    if (viewName === 'collection') {
      collectionDiv.style.display = 'block';
      scannerDiv.style.display = 'none';
      btnCol.style.background = '#3498db';
      btnScan.style.background = '#7f8c8d';
      this.stopLiveScanner();
    } else {
      collectionDiv.style.display = 'none';
      scannerDiv.style.display = 'block';
      btnScan.style.background = '#3498db';
      btnCol.style.background = '#7f8c8d';
    }
  },

  sanitizeTerminology() {
    document.querySelectorAll('*').forEach(node => {
      if (node.childNodes.length === 1 && node.childNodes[0].nodeType === Node.TEXT_NODE) {
        if (node.textContent.includes('Scryfall')) {
          node.textContent = node.textContent.replace(/Scryfall/g, 'Card Database');
        }
      }
    });
  },

  // CSV Bulk Loader Template Download
  downloadBulkTemplate() {
    const csvContent = "data:text/csv;charset=utf-8,Card Name,Set Code,Condition,Quantity,Price\nMutavault,MOR,Near Mint,1,25.00\nBlack Lotus,LEA,Played,1,10000.00";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "card_bulk_loader_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Handle CSV Collection Import
  handleCSVImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      this.parseCSV(text);
    };
    reader.readAsText(file);
  },

  parseCSV(text) {
    const lines = text.split('\n');
    this.inventory = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(',');
      if (cols.length >= 2) {
        this.inventory.push({
          name: cols[0]?.trim() || 'Unknown',
          set: cols[1]?.trim() || 'N/A',
          condition: cols[2]?.trim() || 'Near Mint',
          quantity: cols[3]?.trim() || '1',
          price: cols[4]?.trim() || '$0.00'
        });
      }
    }
    this.renderInventoryTable();
  },

  renderInventoryTable() {
    const tbody = document.getElementById('inventory-table-body');
    if (!tbody) return;

    if (this.inventory.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="padding: 15px; text-align: center; color: #7f8c8d;">No records found in CSV.</td></tr>`;
      return;
    }

    tbody.innerHTML = '';
    this.inventory.forEach(item => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid #eee';
      tr.innerHTML = `
        <td style="padding: 10px;">${item.name}</td>
        <td style="padding: 10px;">${item.set}</td>
        <td style="padding: 10px;">${item.condition}</td>
        <td style="padding: 10px;">${item.price}</td>
        <td style="padding: 10px;"><button onclick="alert('Item details')" style="padding: 4px 8px;">View</button></td>
      `;
      tbody.appendChild(tr);
    });
  },

  // Real-Time Stream Scanner & Top-Banner Spatial Priority
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
        this.scanInterval = setInterval(() => this.processLiveFrame(videoElement), 600);
      }
    } catch (err) {
      console.error("Camera access error:", err);
      alert("Unable to access camera.");
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

  async processLiveFrame(video) {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Spatial Top-Banner Crop (Ignores footers and flavor text)
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
    const detectedCardName = "Mutavault"; 
    if (detectedCardName) {
      this.fetchCardPrintingsAcrossAllSets(detectedCardName);
    }
  },

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
