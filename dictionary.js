// Default dictionary of Lisan ud-Dawat words and their Arabic-script equivalents
const DEFAULT_DICTIONARY = {
  "salaam": "سلام",
  "bhai": "بھائی",
  "mubarak": "مبارك",
  "dua": "دعا",
  "khuda": "خدا",
  "aqa": "آقا",
  "moula": "مولى",
  "syedna": "سيدنا",
  "mumineen": "مؤمنين",
  "shukran": "شكرا",
  "khidmat": "خدمت",
  "jaman": "جمن",
  "majlis": "مجلس",
  "hazrat": "حضرت",
  "wazifa": "وظيفة",
  "nawazish": "نوازش",
  "barakat": "بركات",
  "daawat": "دعوت",
  "masjid": "مسجد",
  "ziarat": "زيارت",
  "khushi": "خوشي",
  "ohbat": "أهبة",
  "amal": "عمل",
  "amar": "أمر",
  "tabassum": "تبسم",
  "akhlaaq": "أخلاق",
  "ibteda": "ابتداء",
  "haajat": "حاجة",
  "aaftab": "آفتاب",
  "shajar": "شجر",
  "manaam": "منام",
  "sharaf": "شرف",
  "qadam": "قدم",
  "nazaafat": "نظافت",
  "imamat": "امامت",
  "huzurala": "حضور اعلى",
  "ashara": "عشرة",
  "tafsir": "تفسير",
  "bayan": "بيان",
  "sab": "سب",
  "khairiyat": "خيريت"
};

// Load dictionary from localStorage or initialize with default
function loadDictionary() {
  const stored = localStorage.getItem("lisan_dictionary");
  if (!stored) {
    // Initialize with DEFAULT_DICTIONARY tagged as 'default'
    const dict = {};
    for (const [key, val] of Object.entries(DEFAULT_DICTIONARY)) {
      dict[key] = { arabic: val, type: "default" };
    }
    saveDictionary(dict);
    return dict;
  }
  
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error("Error parsing stored dictionary, resetting to default", e);
    const dict = {};
    for (const [key, val] of Object.entries(DEFAULT_DICTIONARY)) {
      dict[key] = { arabic: val, type: "default" };
    }
    saveDictionary(dict);
    return dict;
  }
}

// Save dictionary to localStorage
function saveDictionary(dict) {
  localStorage.setItem("lisan_dictionary", JSON.stringify(dict));
}

// Translate word if it exists in the dictionary (case-insensitive check)
function lookupWord(word, dict) {
  const cleanWord = word.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
  if (dict[cleanWord]) {
    return dict[cleanWord].arabic;
  }
  return null;
}

// Add/Update a word pair
function addWordPair(roman, arabic, type = "user") {
  const dict = loadDictionary();
  const cleanRoman = roman.toLowerCase().trim();
  const cleanArabic = arabic.trim();
  
  if (!cleanRoman || !cleanArabic) return false;
  
  dict[cleanRoman] = {
    arabic: cleanArabic,
    type: type
  };
  saveDictionary(dict);
  return true;
}

// Delete a word pair
function deleteWordPair(roman) {
  const dict = loadDictionary();
  const cleanRoman = roman.toLowerCase().trim();
  if (dict[cleanRoman]) {
    delete dict[cleanRoman];
    saveDictionary(dict);
    return true;
  }
  return false;
}

// Convert dictionary to CSV format
function dictionaryToCSV() {
  const dict = loadDictionary();
  let csv = "Romanized,Arabic Script,Type\r\n";
  for (const [roman, data] of Object.entries(dict)) {
    // Escape quotes if any
    const escapedRoman = roman.replace(/"/g, '""');
    const escapedArabic = data.arabic.replace(/"/g, '""');
    csv += `"${escapedRoman}","${escapedArabic}","${data.type}"\r\n`;
  }
  return csv;
}

// Import CSV string and merge with current dictionary
function importCSV(csvText) {
  const lines = csvText.split(/\r?\n/);
  if (lines.length <= 1) return 0;
  
  let importCount = 0;
  // Simple CSV parser
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Split by comma, respecting quotes
    const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
    if (!matches || matches.length < 2) {
      // Fallback simple split if regex fails to match standard CSV
      const parts = line.split(",");
      if (parts.length >= 2) {
        const roman = parts[0].replace(/^["']|["']$/g, "").trim();
        const arabic = parts[1].replace(/^["']|["']$/g, "").trim();
        const type = parts[2] ? parts[2].replace(/^["']|["']$/g, "").trim() : "user";
        if (roman && arabic) {
          addWordPair(roman, arabic, type);
          importCount++;
        }
      }
      continue;
    }
    
    const roman = matches[0].replace(/^"|"$/g, '').replace(/""/g, '"').trim();
    const arabic = matches[1].replace(/^"|"$/g, '').replace(/""/g, '"').trim();
    const type = matches[2] ? matches[2].replace(/^"|"$/g, '').trim() : "user";
    
    if (roman && arabic) {
      addWordPair(roman, arabic, type);
      importCount++;
    }
  }
  return importCount;
}

// LocalStorage helpers for the Review Queue (Unknown words)
function getReviewQueue() {
  const queue = localStorage.getItem("lisan_review_queue");
  if (!queue) return {};
  try {
    return JSON.parse(queue);
  } catch (e) {
    return {};
  }
}

function saveReviewQueue(queue) {
  localStorage.setItem("lisan_review_queue", JSON.stringify(queue));
}

function addToReviewQueue(word) {
  const cleanWord = word.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
  if (!cleanWord || /^[0-9]+$/.test(cleanWord)) return; // Don't queue empty strings or plain numbers
  
  const queue = getReviewQueue();
  if (queue[cleanWord]) {
    queue[cleanWord].count += 1;
  } else {
    queue[cleanWord] = { count: 1 };
  }
  saveReviewQueue(queue);
}

function removeFromReviewQueue(word) {
  const cleanWord = word.toLowerCase().trim();
  const queue = getReviewQueue();
  if (queue[cleanWord]) {
    delete queue[cleanWord];
    saveReviewQueue(queue);
    return true;
  }
  return false;
}
