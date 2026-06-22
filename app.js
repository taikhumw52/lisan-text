// Lisan ud-Dawat Transliteration App Logic
document.addEventListener("DOMContentLoaded", () => {
  // --- State Initialization ---
  let dictionary = loadDictionary();
  let reviewQueue = getReviewQueue();
  let currentTab = "translator";

  // --- DOM Elements ---
  // Tabs
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  
  // Translator Tab
  const inputTextbox = document.getElementById("input-textbox");
  const outputTextbox = document.getElementById("output-textbox");
  const convertBtn = document.getElementById("convert-btn");
  const clearInputBtn = document.getElementById("clear-input-btn");
  const copyOutputBtn = document.getElementById("copy-output-btn");
  const autoTranslateToggle = document.getElementById("auto-translate-toggle");
  const wordCountSpan = document.getElementById("word-count");
  const charCountSpan = document.getElementById("char-count");
  
  // Dictionary Tab
  const dictSearch = document.getElementById("dict-search");
  const dictTableBody = document.getElementById("dict-table-body");
  const addWordBtn = document.getElementById("add-word-btn");
  const exportCsvBtn = document.getElementById("export-csv-btn");
  const importCsvBtn = document.getElementById("import-csv-btn");
  const importFileInput = document.getElementById("import-file-input");
  
  // Add Word Modal
  const modalOverlay = document.getElementById("add-word-modal");
  const closeModalBtn = document.getElementById("close-modal");
  const addWordForm = document.getElementById("add-word-form");
  const cancelModalBtn = document.getElementById("cancel-modal");
  
  // Review Queue Tab
  const reviewQueueGrid = document.getElementById("review-queue-grid");
  const reviewCountBadge = document.getElementById("review-count-badge");
  const dictCountBadge = document.getElementById("dict-count-badge");
  const clearQueueBtn = document.getElementById("clear-queue-btn");

  // --- Initial Renders & Counts ---
  updateBadgeCounts();
  renderDictionaryTable();
  renderReviewQueue();

  // --- Event Listeners: Navigation Tabs ---
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const tabId = btn.getAttribute("data-tab");
      switchTab(tabId);
    });
  });

  function switchTab(tabId) {
    currentTab = tabId;
    tabBtns.forEach(btn => {
      if (btn.getAttribute("data-tab") === tabId) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    tabContents.forEach(content => {
      if (content.id === `${tabId}-tab`) {
        content.classList.add("active");
      } else {
        content.classList.remove("active");
      }
    });

    // Refresh contents if switching to lists
    if (tabId === "dictionary") {
      renderDictionaryTable(dictSearch.value);
    } else if (tabId === "review") {
      renderReviewQueue();
    }
  }

  // --- Event Listeners: Translator ---
  
  // Perform Translation
  function performTranslation() {
    const inputText = inputTextbox.value;
    
    // Perform translation with callback to log unknown words
    const translatedText = translateText(inputText, dictionary, (unknownWord) => {
      // Add unknown word to queue
      addToReviewQueue(unknownWord);
    });
    
    outputTextbox.value = translatedText;
    
    // Update count labels
    const words = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
    wordCountSpan.textContent = words;
    charCountSpan.textContent = inputText.length;
    
    // Refresh review queue badge since new unknown words might have been logged
    reviewQueue = getReviewQueue();
    updateBadgeCounts();
  }

  // Live translation
  inputTextbox.addEventListener("input", () => {
    if (autoTranslateToggle.checked) {
      performTranslation();
    } else {
      // Just update counts
      const inputText = inputTextbox.value;
      const words = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
      wordCountSpan.textContent = words;
      charCountSpan.textContent = inputText.length;
    }
  });

  // Convert button click
  convertBtn.addEventListener("click", () => {
    // Visual click effect rotation
    convertBtn.style.transform = "scale(0.95)";
    setTimeout(() => {
      convertBtn.style.transform = "";
    }, 150);
    
    performTranslation();
  });

  // Clear Input Button
  clearInputBtn.addEventListener("click", () => {
    inputTextbox.value = "";
    outputTextbox.value = "";
    wordCountSpan.textContent = "0";
    charCountSpan.textContent = "0";
    inputTextbox.focus();
  });

  // Copy Output Button
  copyOutputBtn.addEventListener("click", () => {
    if (!outputTextbox.value) return;
    
    navigator.clipboard.writeText(outputTextbox.value).then(() => {
      const originalText = copyOutputBtn.textContent;
      copyOutputBtn.textContent = "Copied!";
      copyOutputBtn.style.background = "rgba(0, 230, 118, 0.2)";
      copyOutputBtn.style.borderColor = "var(--success)";
      
      setTimeout(() => {
        copyOutputBtn.textContent = originalText;
        copyOutputBtn.style.background = "";
        copyOutputBtn.style.borderColor = "";
      }, 1500);
    }).catch(err => {
      console.error("Could not copy text: ", err);
    });
  });

  // --- Event Listeners: Dictionary Manager ---
  
  // Search filter
  dictSearch.addEventListener("input", (e) => {
    renderDictionaryTable(e.target.value);
  });

  // Open modal
  addWordBtn.addEventListener("click", () => {
    modalOverlay.style.display = "flex";
    document.getElementById("modal-title").textContent = "Add New Word Pair";
    document.getElementById("roman-input").value = "";
    document.getElementById("arabic-input").value = "";
    document.getElementById("roman-input").disabled = false;
    document.getElementById("roman-input").focus();
  });

  // Close modal
  const hideModal = () => {
    modalOverlay.style.display = "none";
  };
  closeModalBtn.addEventListener("click", hideModal);
  cancelModalBtn.addEventListener("click", hideModal);
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) hideModal();
  });

  // Add word submit
  addWordForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const roman = document.getElementById("roman-input").value;
    const arabic = document.getElementById("arabic-input").value;
    
    if (addWordPair(roman, arabic, "user")) {
      dictionary = loadDictionary(); // Refresh dictionary
      renderDictionaryTable(dictSearch.value);
      updateBadgeCounts();
      hideModal();
      
      // If the word was in the review queue, remove it
      if (reviewQueue[roman.toLowerCase().trim()]) {
        removeFromReviewQueue(roman);
        reviewQueue = getReviewQueue();
        renderReviewQueue();
      }
    }
  });

  // Edit / Delete handler (delegated)
  dictTableBody.addEventListener("click", (e) => {
    const target = e.target.closest("button");
    if (!target) return;
    
    const romanKey = target.getAttribute("data-word");
    
    if (target.classList.contains("edit-btn")) {
      // Edit mode in modal
      const data = dictionary[romanKey];
      if (data) {
        modalOverlay.style.display = "flex";
        document.getElementById("modal-title").textContent = "Edit Word Pair";
        document.getElementById("roman-input").value = romanKey;
        document.getElementById("roman-input").disabled = true; // Key cannot be edited
        document.getElementById("arabic-input").value = data.arabic;
        document.getElementById("arabic-input").focus();
      }
    } else if (target.classList.contains("delete-btn")) {
      if (confirm(`Are you sure you want to delete the mapping for "${romanKey}"?`)) {
        deleteWordPair(romanKey);
        dictionary = loadDictionary();
        renderDictionaryTable(dictSearch.value);
        updateBadgeCounts();
      }
    }
  });

  // Export CSV
  exportCsvBtn.addEventListener("click", () => {
    const csvContent = dictionaryToCSV();
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "lisan_ud_dawat_dictionary.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // Import CSV trigger
  importCsvBtn.addEventListener("click", () => {
    importFileInput.click();
  });

  // Import CSV execution
  importFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(evt) {
      const text = evt.target.result;
      const count = importCSV(text);
      if (count > 0) {
        alert(`Successfully imported/merged ${count} word pairs!`);
        dictionary = loadDictionary();
        renderDictionaryTable(dictSearch.value);
        updateBadgeCounts();
      } else {
        alert("Could not import dictionary. Please verify CSV format.");
      }
    };
    reader.readAsText(file);
    
    // Clear value to allow re-uploading same file
    importFileInput.value = "";
  });

  // --- Event Listeners: Review Queue ---
  
  // Clear entire queue
  clearQueueBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to clear the entire Review Queue of unknown words?")) {
      saveReviewQueue({});
      reviewQueue = {};
      renderReviewQueue();
      updateBadgeCounts();
    }
  });

  // Submit/Delete on review queue cards
  reviewQueueGrid.addEventListener("click", (e) => {
    const button = e.target.closest("button");
    if (!button) return;
    
    const word = button.getAttribute("data-word");
    
    if (button.classList.contains("approve-btn")) {
      const input = document.getElementById(`review-input-${word}`);
      const arabicVal = input.value.trim();
      
      if (!arabicVal) {
        alert("Please enter the Arabic mapping first.");
        input.focus();
        return;
      }
      
      // Add to dictionary
      addWordPair(word, arabicVal, "user");
      // Remove from review queue
      removeFromReviewQueue(word);
      
      // Refresh state
      dictionary = loadDictionary();
      reviewQueue = getReviewQueue();
      
      // Render
      renderReviewQueue();
      updateBadgeCounts();
      
      // Notify
      const card = button.closest(".queue-card");
      card.style.borderColor = "var(--success)";
      card.style.transform = "scale(0.95)";
      card.style.opacity = "0";
      setTimeout(() => {
        renderReviewQueue();
      }, 300);
      
    } else if (button.classList.contains("ignore-btn")) {
      removeFromReviewQueue(word);
      reviewQueue = getReviewQueue();
      
      const card = button.closest(".queue-card");
      card.style.borderColor = "var(--danger)";
      card.style.transform = "scale(0.95)";
      card.style.opacity = "0";
      setTimeout(() => {
        renderReviewQueue();
        updateBadgeCounts();
      }, 300);
    }
  });

  // Enter key press in review queue input
  reviewQueueGrid.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && e.target.classList.contains("queue-input")) {
      const word = e.target.getAttribute("data-word");
      const approveBtn = document.querySelector(`.approve-btn[data-word="${word}"]`);
      if (approveBtn) approveBtn.click();
    }
  });

  // --- Render Helpers ---

  // Update navbar count badges
  function updateBadgeCounts() {
    const dictCount = Object.keys(dictionary).length;
    const reviewCount = Object.keys(reviewQueue).length;
    
    dictCountBadge.textContent = dictCount;
    reviewCountBadge.textContent = reviewCount;
    
    if (reviewCount > 0) {
      reviewCountBadge.style.display = "inline-block";
    } else {
      reviewCountBadge.style.display = "none";
    }
  }

  // Render Dictionary Table
  function renderDictionaryTable(filterText = "") {
    dictTableBody.innerHTML = "";
    const cleanFilter = filterText.toLowerCase().trim();
    
    // Sort keys alphabetically
    const sortedKeys = Object.keys(dictionary).sort();
    let rowCount = 0;

    sortedKeys.forEach(roman => {
      const data = dictionary[roman];
      
      // Apply search filter (match either romanized or arabic script)
      if (cleanFilter && !roman.includes(cleanFilter) && !data.arabic.includes(cleanFilter)) {
        return;
      }
      
      rowCount++;
      const tr = document.createElement("tr");
      
      // Determine badge class
      const badgeClass = data.type === "default" ? "badge-default" : "badge-user";
      const badgeText = data.type === "default" ? "System" : "User Added";
      
      tr.innerHTML = `
        <td><strong>${roman}</strong></td>
        <td class="arabic-cell">${data.arabic}</td>
        <td><span class="badge ${badgeClass}">${badgeText}</span></td>
        <td>
          <div class="row-actions">
            <button class="action-icon-btn edit-btn" data-word="${roman}" title="Edit translation">
              ✏️
            </button>
            <button class="action-icon-btn delete-btn" data-word="${roman}" title="Delete word">
              🗑️
            </button>
          </div>
        </td>
      `;
      dictTableBody.appendChild(tr);
    });

    if (rowCount === 0) {
      dictTableBody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 3rem;">
            No dictionary matches found.
          </td>
        </tr>
      `;
    }
  }

  // Render Review Queue
  function renderReviewQueue() {
    reviewQueueGrid.innerHTML = "";
    
    const words = Object.keys(reviewQueue);
    
    if (words.length === 0) {
      reviewQueueGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">✨</div>
          <h3>Queue is clear!</h3>
          <p style="margin-top: 0.5rem; color: var(--text-muted);">
            When you type Romanized words not in the dictionary, they will appear here for manual review.
          </p>
        </div>
      `;
      return;
    }
    
    // Sort by count descending (most common unknown words first)
    words.sort((a, b) => reviewQueue[b].count - reviewQueue[a].count);
    
    words.forEach(word => {
      const data = reviewQueue[word];
      const div = document.createElement("div");
      div.className = "queue-card";
      
      // Try to generate a pre-filled guess based on transliteration engine
      const guessedArabic = transliterateWord(word);
      
      div.innerHTML = `
        <div class="queue-card-header">
          <span class="queue-word">${word}</span>
          <span class="queue-freq">Seen: ${data.count}x</span>
        </div>
        <div class="queue-form">
          <input type="text" 
                 id="review-input-${word}" 
                 class="queue-input" 
                 data-word="${word}"
                 value="${guessedArabic}" 
                 placeholder="Arabic Script"
                 title="Modify guess if needed, then click checkmark to approve">
          <button class="queue-btn approve-btn" data-word="${word}" title="Save to Dictionary">
            ✓
          </button>
          <button class="queue-btn ignore ignore-btn" data-word="${word}" title="Dismiss">
            ✕
          </button>
        </div>
      `;
      reviewQueueGrid.appendChild(div);
    });
  }
});
