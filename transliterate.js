// Lisan ud-Dawat Transliteration Engine

// Digraph mapping (checked first)
const DIGRAPHS = [
  { roman: "kh", arabic: "خ" },
  { roman: "gh", arabic: "غ" },
  { roman: "sh", arabic: "ش" },
  { roman: "th", arabic: "ث" },
  { roman: "dh", arabic: "ذ" },
  { roman: "ch", arabic: "چ" },
  { roman: "bh", arabic: "بھ" },
  { roman: "ph", arabic: "پھ" },
  { roman: "th", arabic: "تھ" },
  { roman: "jh", arabic: "جھ" },
  { roman: "dh", arabic: "دھ" },
  { roman: "aa", arabic: "ا" },
  { roman: "ee", arabic: "ي" },
  { roman: "oo", arabic: "و" },
  { roman: "ai", arabic: "ي" },
  { roman: "ae", arabic: "ي" },
  { roman: "au", arabic: "و" },
  { roman: "ou", arabic: "و" }
];

// Single consonant mapping
const CONSONANTS = {
  "b": "ب",
  "p": "پ",
  "t": "ت",
  "j": "ج",
  "h": "ه",
  "d": "د",
  "r": "ر",
  "z": "ز",
  "s": "س",
  "f": "ف",
  "q": "ق",
  "k": "ك",
  "g": "گ",
  "l": "ل",
  "m": "م",
  "n": "ن",
  "w": "و",
  "v": "و",
  "y": "ي",
  "x": "خ",
  "c": "ك"
};

// Single vowel mapping rules
const VOWELS = ["a", "e", "i", "o", "u"];

/**
 * Transliterates a single Romanized word to Arabic script.
 * @param {string} word - The Romanized word.
 * @returns {string} The transliterated Arabic script.
 */
function transliterateWord(word) {
  // Normalize word
  let cleanWord = word.toLowerCase().trim();
  
  // Remove punctuation
  cleanWord = cleanWord.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
  
  if (!cleanWord) return "";
  
  // If it's a number, return as is (or map to Arabic numerals if wanted, but standard digits are fine)
  if (/^\d+$/.test(cleanWord)) return cleanWord;
  
  let result = "";
  let i = 0;
  const len = cleanWord.length;
  
  // Rule 1: Handle initial vowels
  let startsWithVowel = false;
  for (const vowel of VOWELS) {
    if (cleanWord.startsWith(vowel)) {
      startsWithVowel = true;
      break;
    }
  }
  
  if (startsWithVowel) {
    if (cleanWord.startsWith("aa")) {
      result += "آ";
      i += 2;
    } else if (cleanWord.startsWith("a")) {
      result += "ا";
      i += 1;
    } else if (cleanWord.startsWith("i") || cleanWord.startsWith("e")) {
      result += "إ";
      i += 1;
    } else if (cleanWord.startsWith("u") || cleanWord.startsWith("o")) {
      result += "أ";
      i += 1;
    }
  }
  
  // Rule 2: Process the rest of the characters
  while (i < len) {
    let matchedDigraph = false;
    
    // Try to match digraphs
    for (const dg of DIGRAPHS) {
      if (cleanWord.substring(i, i + dg.roman.length) === dg.roman) {
        result += dg.arabic;
        i += dg.roman.length;
        matchedDigraph = true;
        break;
      }
    }
    
    if (matchedDigraph) continue;
    
    const char = cleanWord[i];
    
    // Consonant match
    if (CONSONANTS[char]) {
      result += CONSONANTS[char];
      i++;
    } 
    // Vowel match
    else if (VOWELS.includes(char)) {
      // Check if it's the last character of the word
      if (i === len - 1) {
        if (char === "i" || char === "e") {
          result += "ي";
        } else if (char === "a") {
          result += "ا";
        } else if (char === "o" || char === "u") {
          result += "و";
        }
      } else {
        // Short vowel in the middle is skipped in Arabic script
        // (represented implicitly by fatha, kasra, or damma)
      }
      i++;
    } 
    // Fallback for unexpected characters
    else {
      result += char;
      i++;
    }
  }
  
  return result;
}

/**
 * Translates a full sentence by using the dictionary first, and transliterating fallbacks.
 * Keeps track of unknown words.
 * @param {string} text - The input text sentence.
 * @param {Object} dictionary - The loaded dictionary object.
 * @param {Function} onUnknownWord - Callback triggered when an unknown word is encountered.
 * @returns {string} The translated sentence in Arabic script.
 */
function translateText(text, dictionary, onUnknownWord) {
  if (!text) return "";
  
  // Split input by spaces, keeping track of punctuation
  const tokens = text.split(/(\s+)/);
  
  return tokens.map(token => {
    // If it's whitespace, return as is
    if (/^\s+$/.test(token)) return token;
    
    // Extract actual word and punctuation
    const wordMatch = token.match(/^([.,\/#!$%\^&\*;:{}=\-_`~()?]*)(.*?)([.,\/#!$%\^&\*;:{}=\-_`~()?]*)$/);
    if (!wordMatch) return token;
    
    const leadingPunc = wordMatch[1] || "";
    const cleanWord = wordMatch[2] || "";
    const trailingPunc = wordMatch[3] || "";
    
    if (!cleanWord) return token;
    
    // Look up in dictionary
    const dictMatch = lookupWord(cleanWord, dictionary);
    if (dictMatch) {
      return leadingPunc + dictMatch + trailingPunc;
    }
    
    // If not in dictionary, it's an unknown word
    if (onUnknownWord) {
      onUnknownWord(cleanWord);
    }
    
    // Transliterate as fallback
    const transliterated = transliterateWord(cleanWord);
    return leadingPunc + transliterated + trailingPunc;
  }).join("");
}
