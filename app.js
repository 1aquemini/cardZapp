/**
 * Card Library & Inventory Engine - Fully Integrated
 * Updated for Local JSON Caching, Tesseract OCR Normalization, and Fast Database Matching
 */

const CardApp = {
  stream: null,
  isScanning: false,
  scanInterval: null,
  inventory: [],
  filteredInventory: [],
  localCardDatabase: {}, // In-memory hash map for O(1) database lookups

  async init() {
    this.bindUI();
    this.sanitizeTerminology();
    this.loadSavedInventory();
    await this.loadLocalDataset(); // Load JSON dataset into memory on startup
    console.log("Card Library & Inventory Manager initialized successfully.");
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

  // 1. MEMORY CACHING: Load large JSON dataset once upon initialization
  async loadLocalDataset() {
    try {
      // Replace 'cards_dataset.json' with your local data file path or API endpoint
      const response = await fetch('cards_dataset.json'); 
      if (!response.ok) {
        console.warn("Local JSON dataset not found. Falling back to dynamic API calls.");
        return;
      }
      const data = await response.json();
      
      // Convert Array to Hash Map for O(1) lookups
      // Assuming your JSON has { "name": "...", "set": "...", "market_price": "..." }
      data.forEach(card => {
        if (card.name) {
          const normalizedKey = this.normalizeText(card.name);
          this.localCardDatabase[normalizedKey] = card;
        }
      });
      console.log(`Successfully cached ${Object.keys(this.localCardDatabase).length} cards in memory.`);
    } catch (error) {
      console.error("Error loading local dataset:", error);
    }
  },

  // 2. TEXT NORMALIZATION: Pre-process strings to match imperfect OCR scans
  normalizeText(text) {
    if (!text) return "";
    // Lowercase, strip punctuation and whitespace
    return text.toLowerCase().replace(/[^a-z0-9]/g, '');
  },

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

  exportCollectionCSV() {
    if (this.inventory.length === 0) {
      alert("No inventory data available to export.");
      return;
    }
    let csvContent = "Card Name,Set,Condition,Quantity,Price\n";
    this.inventory.forEach(item => {
      csvContent += `"${item.name}","${item.set}","${item.condition}","${item.quantity}","${item.price}"\n`;
    });
    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "my_card_collection_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  handleCSVImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.parseCSV(e.target.result);
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
          name: cols[0]?.replace(/"/g, '').trim() || 'Unknown',
          set: cols[1]?.replace(/"/g, '').trim() || 'N/A',
          condition: cols[2]?.replace(/"/g, '').trim() || 'Near Mint',
          quantity: cols[3]?.replace(/"/g, '').trim() || '1',
          price: cols[4]?.replace(/"/g, '').trim() || '$0.00'
        });
      }
    }
    this.filteredInventory = [...this.inventory];
    this.saveInventoryToStorage();
    this.renderInventoryTable();
  },

  saveInventoryToStorage() {
    localStorage.setItem('card_app_inventory', JSON.stringify(this.inventory));
  },

  loadSavedInventory() {
    const saved = localStorage.getItem('card_app_inventory');
    if (saved) {
      try {
        this.inventory = JSON.parse(saved);
        this.filteredInventory = [...this.inventory];
        this.renderInventoryTable();
      } catch (e) {
        console.error("Failed to load local inventory storage", e);
      }
    }
  },

  filterInventory() {
    const searchInput = document.getElementById('inventory-search-input');
    if (!searchInput) return;
    const query = searchInput.value.toLowerCase();
    this.filteredInventory = this.inventory.filter(item => 
      item.name.toLowerCase().includes(query) || item.set.toLowerCase().includes(query)
    );
    this.renderInventoryTable();
  },

  renderInventoryTable() {
    const tbody = document.getElementById('inventory-table-body');
    if (!tbody) return;

    if (this.filteredInventory.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="padding: 15px; text-align: center; color: #7f8c8d;">No matching inventory records found.</td></tr>`;
      return;
    }

    tbody.innerHTML = '';
    this.filteredInventory.forEach(item => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid #eee';
      tr.innerHTML = `
        <td style="padding: 10px;">${item.name}</td>
        <td style="padding: 10px;">${item.set}</td>
        <td style="padding: 10px;">${item.condition}</td>
        <td style="padding: 10px;">${item.price}</td>
        <td style="padding: 10px;"><button onclick="alert('Viewing details for ${item.name}')" style="padding: 4px 8px; cursor: pointer;">View</button></td>
      `;
      tbody.appendChild(tr);
    });
  },

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
        
        // Scan at a reasonable interval to prevent crashing the client
        this.scanInterval = setInterval(() => this.processLiveFrame(videoElement), 1000);
      }
    } catch (err) {
      console.error("Camera access error:", err);
      alert("Unable to access camera feed.");
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

    // Spatial Top-Banner Crop (Prioritizes title area, ignoring footers/rules text)
    const titleHeaderHeight = canvas.height * 0.22;
    const titleCanvas = document.createElement('canvas');
    titleCanvas.width = canvas.width;
    titleCanvas.height = titleHeaderHeight;
    const titleCtx = titleCanvas.getContext('2d');
    titleCtx.drawImage(canvas, 0, 0, canvas.width, titleHeaderHeight, 0, 0, canvas.width, titleHeaderHeight);

    // Client-Side Image Preprocessing (Grayscale + Contrast Boost)
    const imgData = titleCtx.getImageData(0, 0, titleCanvas.width, titleCanvas.height);
    const data = imgData.data;
    const contrastFactor = 1.5;
    
    for (let i = 0; i < data.length; i += 4) {
      let avg = (data[i] * 0.3) + (data[i + 1] * 0.59) + (data[i + 2] * 0.11);
      let adjusted = data[i];
      if (avg > 0) {
        adjusted = Math.min(255, Math.max(0, contrastFactor * (avg - 128) + 128));
      }
      data[i] = adjusted;
      data[i + 1] = adjusted;
      data[i + 2] = adjusted;
    }
    titleCtx.putImageData(imgData, 0, 0);

    titleCanvas.toBlob(async (blob) => {
      if (!blob) return;
      await this.executeOCRAndFetchCard(blob);
    }, 'image/jpeg', 0.90);
  },

  // 3. OCR EXECUTION & MATCHING BEHAVIOR
  async executeOCRAndFetchCard(imageBlob) {
    if (!window.Tesseract) {
      console.error("Tesseract.js is missing from index.html.");
      return;
    }

    try {
      // Execute OCR scan using Tesseract Worker
      const { data: { text } } = await Tesseract.recognize(imageBlob, 'eng');
      
      const normalizedScanText = this.normalizeText(text);
      if (normalizedScanText.length < 3) return; // Ignore visual noise and blank scans

      // Attempt exact Hash Map lookup
      if (this.localCardDatabase[normalizedScanText]) {
        const matchedCard = this.localCardDatabase[normalizedScanText];
        this.fetchCardPrintingsAcrossAllSets(matchedCard.name);
        return;
      }

      // Fuzzy String Match Fallback
      let bestMatch = null;
      for (const key in this.localCardDatabase) {
        // Simple containment check. For higher accuracy, you can implement Levenshtein distance here.
        if (key.includes(normalizedScanText) || normalizedScanText.includes(key)) {
          bestMatch = this.localCardDatabase[key];
          break;
        }
      }

      if (bestMatch) {
        this.fetchCardPrintingsAcrossAllSets(bestMatch.name);
      } else {
        // Final fallback: execute exact API call if local database matching fails
        // This handles cases where the card name is correct but not in the cached JSON
        const rawCleanedName = text.replace(/[^a-zA-Z\s]/g, '').trim();
        if (rawCleanedName.length > 3) {
           this.fetchCardPrintingsAcrossAllSets(rawCleanedName);
        }
      }

    } catch (err) {
      console.error("OCR or Matching Failure:", err);
    }
  },

  async fetchCardPrintingsAcrossAllSets(cardName) {
    const cacheKey = `card_cache_${cardName.toLowerCase()}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
      try {
        const sortedSets = JSON.parse(cachedData);
        this.renderCardSetOptions(sortedSets);
        return;
      } catch (e) {
        localStorage.removeItem(cacheKey);
      }
    }

    try {
      const encodedName = encodeURIComponent(cardName);
      const response = await fetch(`https://api.scryfall.com/cards/search?q=${encodedName}&unique=prints`);
      const data = await response.json();

      if (data && data.data) {
        const sortedSets = data.data.sort((a, b) => new Date(b.released_at) - new Date(a.released_at));
        localStorage.setItem(cacheKey, JSON.stringify(sortedSets));
        this.renderCardSetOptions(sortedSets);
      }
    } catch (err) {
      console.error("Failed to fetch card printings from database:", err);
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
