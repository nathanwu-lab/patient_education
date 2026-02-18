const state = {
  meds: [],
  selected: null,
  treatmentPlan: [],
  selectedEye: null,
  medicationData: {}, // Will store CSV data: {medicationName: {type, directions, sideEffects}}
  translations: {}, // Will store translation data
  selectedLanguage: 'english',
  numericHeadingLanguage: 'english', // Language for headings when Numeric is selected
  selectedProtocol: null, // Currently selected protocol
  autocompleteSelectedIndex: -1 // Currently selected index in autocomplete dropdown
};

// Define saved protocols
const protocols = {
  'dry-eye': {
    name: 'Dry Eye',
    medications: [
      'Preservative Free Refresh Tears',
      'Restasis',
      'Vevye',
      'Meibo',
      'Refresh PM'
    ]
  }
};

const $ = (sel) => document.querySelector(sel);

// Function to parse CSV data
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    data.push(row);
  }
  
  return data;
}

// Medication name mapping from CSV to website names
const medicationNameMapping = {
  // Eye drops
  'Brimonidine 0.2%/0.15%': 'Brimonidine',
  'Brimonidine-Timolol (Combigan)': 'Brimonidine Timolol (combigan)',
  'Timolol-dorzolamide (Cosopt)': 'Timolol Dorzolamide (cosopt)',
  'Brinzolamide-Brimonidine (Simbrinza)': 'Brinzolamide Brimonidine (simbrinza)',
  'Netarsudil-latanoprost (Rocklatan)': 'Netarsudil Latanoprost (rocklatan)',
  'Ganciclovir (Zirgan) gel': 'Ganciclovir (zirgan)',
  'Moxifloxacin (Vigamox)': 'Moxifloxacin (vigamox)',
  'Ofloxacin (Ocuflox)': 'Ofloxacin (ocuflox)',
  'Cequa (cyclosporine 0.09%)': 'Cequa',
  'Vevye (cyclosporine 0.1%)': 'Vevye',
  'Restasis (cyclosporine 0.05%)': 'Restasis',
  'Miebo (perfluorohexyloctane)': 'Meibo',
  'Xiidra (lifitegrast)': 'Xiidra',
  'Oxervate (cenegermin)': 'Oxervate',
  'Pataday (olopatadine 0.2-0.7%)': 'Ketotifen',
  'Prolensa (bromfenac)': 'Prolensa',
  'Timolol 0.25-0.5%': 'Timolol',
  'Atropine 1%': 'Atropine',
  'Latanoprost 0.005%': 'Latanoprost',
  'Netarsudil (Rhopressa)': 'Netarsudil (rhopressa)',
  'Vyzulta (latanoprostene bunod)': 'Vyzulta',
  'Ketorolac 0.5%': 'Ketorolac',
  'Pilocarpine (ophthalmic 1%)': 'Pilocarpine',
  'Polymyxin-trimethoprim (Polytrim)': 'Polymyxin Trimethoprim (polytrim)',
  'Prednisolone acetate (Pred forte)': 'Prednisolone Acetate (pred Forte)',
  'Difluprednate (Durezol)': 'Difluprednate (durezol)',
  'Loteprednol (Lotemax)': 'Loteprednol (lotemax)',
  'Fluoromethalone (Flarex)': 'Fluoromethalone (flarex)',
  'Cyclopentolate 1% (Cyclogyl)': 'Cyclopentolate 1% (cyclogyl)',
  'Neomycin-polymyxin-dexamethasone drops (Maxitrol)': 'Neomycin Polymyxin Dexamethasone Drops (maxitrol)',
  'Tobramycin-dexamethasone drops': 'Tobramycin Dexamethasone Drops',
  'Sodium chloride 5% drop (Muro)': 'Sodium Chloride 5% Drop (muro)',
  
  // Eye ointments
  'Tobramycin-dexamethasone ointment': 'Tobramycin Dexamethasone Ointment',
  'Neomycin-polymyxin-dexamethasone ointment (Maxitrol)': 'Neomycin Polymyxin Dexamethasone Ointment (maxitrol)',
  'Sodium chloride 5% ointment (Muro 128)': 'Sodium Chloride 5% Ointment (muro)',
  'Erythromycin ophthalmic ointment': 'Erythromycin Ointment',
  'Systane ointment': 'Systane Ointment',
  'Dexamethasone (ophthalmic)': 'Dexamethasone',
  'Dorzolamide 2%': 'Dorzolamide',
  'Fluorometholone (Flarex/FML)': 'Fluoromethalone (flarex)',
  'Prednisolone acetate (Pred Forte)': 'Prednisolone Acetate (pred Forte)',
  'Sodium chloride 5% drop (Muro 128)': 'Sodium Chloride 5% Drop (muro)',
  'Tobramycin (ophthalmic)': 'Tobramycin',
  
  // Pills
  'Valacyclovir (Valtrex)': 'Valacyclovir (valtrex)',
  
  // Topical
  'Ocusoft lid wipes': 'Ocusoft Lid Wipes',
  'Warm compresses': 'Warm Compresses',
  'Warm compresses (towel)': 'Warm Compresses (towel)'
};

// Load medication data from CSV
async function loadMedicationData() {
  try {
    const res = await fetch('data/medication_data.csv?_=' + Date.now());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const csvText = await res.text();
    const data = parseCSV(csvText);
    
    // Convert to lookup object
    state.medicationData = {};
    data.forEach(row => {
      // Handle different column header formats
      const medicationName = row.Medication || row.medication_name || row.name;
      const type = row.Type || row.type || '';
      const directions = row['Default Directions'] || row.default_directions || row.directions || '';
      const sideEffects = row['Common side effects (not exhaustive)'] || row.side_effects || row.sideEffects || '';
      
      if (medicationName) {
        // Map CSV name to website name
        const websiteName = medicationNameMapping[medicationName] || medicationName;
        
        // Map CSV type to website type
        let mappedType = type.toLowerCase();
        if (mappedType === 'eye drop') {
          mappedType = 'eye_drop';
        } else if (mappedType === 'ointment') {
          mappedType = 'eye_ointment';
        }
        
        state.medicationData[websiteName] = {
          type: mappedType,
          directions: directions,
          sideEffects: sideEffects
        };
        
      }
    });
    
  } catch (err) {
    state.medicationData = {};
  }
}

async function loadTranslations() {
  try {
    const res = await fetch('data/translations.csv?_=' + Date.now());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const csvText = await res.text();
    const data = parseCSV(csvText);
    
    // Convert to lookup object
    state.translations = {};
    data.forEach(row => {
      const english = row.English || row.english || '';
      const spanish = row.Spanish || row.spanish || '';
      const chinese = row.Chinese || row.chinese || '';
      const simple = row.Simple || row.simple || '';
      
      if (english) {
        const key = english.toLowerCase().trim();
        state.translations[key] = {
          english: english.trim(),
          spanish: spanish.trim(),
          chinese: chinese.trim(),
          simple: simple.trim()
        };
      }
    });
    
  } catch (err) {
    state.translations = {};
  }
}

function setToday() {
  const todayEl = $('#today');
  if (todayEl) {
    const d = new Date();
    todayEl.textContent = d.toLocaleDateString();
  }
}

async function loadMedications() {
  try {
    const res = await fetch('data/medications.json?_=' + Date.now());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const list = await res.json();
    applyMedications(list);
  } catch (err) {
    // Failed to load medications
  }
}

function applyMedications(list) {
  state.meds = Array.isArray(list) ? list : [];
  
  // Populate medication buttons
  const medButtonsContainer = $('#medicationButtons');
  if (medButtonsContainer) {
    medButtonsContainer.innerHTML = '';
    state.meds.forEach((m) => {
      const button = document.createElement('button');
      button.className = 'med-button';
      button.textContent = m.name;
      button.dataset.medicationName = m.name;
      button.addEventListener('click', () => {
        selectMedicationFromList(m);
      });
      medButtonsContainer.appendChild(button);
    });
  }
}

function selectMedicationFromList(med) {
  // Update the search input
  const medSearchEl = $('#medSearch');
  if (medSearchEl) {
    medSearchEl.value = med.name;
    // Keep focus on search input so Enter key works
    medSearchEl.focus();
  }
  
  // Update visual selection
  const medButtons = document.querySelectorAll('.med-button');
  medButtons.forEach(btn => {
    btn.classList.remove('selected');
    if (btn.dataset.medicationName === med.name) {
      btn.classList.add('selected');
    }
  });
  
  // Update selection
  updateSelection(med);
}

function scrollToMatchingMedication(searchText) {
  if (!searchText || searchText.trim() === '') {
    return;
  }
  
  const medButtons = document.querySelectorAll('.med-button');
  const searchLower = searchText.toLowerCase().trim();
  
  // Check if it's an abbreviation first
  let targetName = null;
  if (medicationAbbreviations[searchLower]) {
    targetName = medicationAbbreviations[searchLower].toLowerCase();
  }
  
  // Find the first matching medication
  for (let i = 0; i < medButtons.length; i++) {
    const button = medButtons[i];
    const medName = button.textContent.toLowerCase();
    
    // Check exact match with abbreviation
    if (targetName && medName === targetName) {
      scrollToButton(button);
      return;
    }
    
    // Check if name starts with search text
    if (medName.startsWith(searchLower)) {
      scrollToButton(button);
      return;
    }
    
    // Check if name contains search text
    if (medName.includes(searchLower)) {
      scrollToButton(button);
      return;
    }
  }
}

function scrollToButton(button) {
  const medicationScroll = document.querySelector('.medication-scroll');
  if (medicationScroll) {
    const buttonRect = button.getBoundingClientRect();
    const containerRect = medicationScroll.getBoundingClientRect();
    
    // Calculate if the button is visible
    const isVisible = buttonRect.top >= containerRect.top && 
                     buttonRect.bottom <= containerRect.bottom;
    
    if (!isVisible) {
      // Scroll to center the button in the container
      const scrollTop = button.offsetTop - (medicationScroll.clientHeight / 2) + (button.clientHeight / 2);
      medicationScroll.scrollTo({
        top: Math.max(0, scrollTop),
        behavior: 'smooth'
      });
    }
  }
}

// Medication abbreviation mapping for quick search
// Medication abbreviations organized by medication name
const medicationAbbreviationMap = {
  'Preservative Free Refresh Tears': ['pfat', 'pfrt', 'pfr', 'pf refresh', 'pf refresh tears'],
  'Refresh Tears': ['at', 'artificial tears', 'rt', 'refresh', 'refresh tears'],
  'Restasis': ['restasis'],
  'Vevye': ['vevye'],
  'Meibo': ['miebo', 'meibo'],
  'Refresh PM': ['refresh pm', 'rpm'],
  'Cequa': ['cequa'],
  'Xiidra': ['xiidra'],
  'Brimonidine Timolol (combigan)': ['combigan'],
  'Brinzolamide Brimonidine (simbrinza)': ['simbrinza'],
  'Neomycin-polymyxin-dexamethasone drops (Maxitrol)': ['maxitrol'],
  'Timolol-dorzolamide (Cosopt)': ['cosopt'],
  'Moxifloxacin (Vigamox)': ['vigamox'],
  'Ofloxacin (Ocuflox)': ['ocuflox'],
  'Prednisolone acetate (Pred Forte)': ['pred forte', 'pred'],
  'Loteprednol (Lotemax)': ['lotemax'],
  'Fluorometholone (Flarex/FML)': ['fml', 'flarex'],
  'Difluprednate (Durezol)': ['durezol'],
  'Ganciclovir (Zirgan) gel': ['zirgan'],
  'Cyclopentolate 1% (cyclogyl)': ['cyclogyl'],
  'Sodium chloride 5% drop (Muro 128)': ['muro', 'muro 128'],
  'Pataday (olopatadine 0.2-0.7%)': ['pataday'],
  'Prolensa (bromfenac)': ['prolensa'],
  'Netarsudil-latanoprost (Rocklatan)': ['rocklatan'],
  'Netarsudil (Rhopressa)': ['rhopressa'],
  'Vyzulta (latanoprostene bunod)': ['vyzulta'],
  'Oxervate (cenegermin)': ['oxervate'],
  'Polymyxin-trimethoprim (Polytrim)': ['polytrim'],
  'Ketotifen': ['ketotifen'],
  'Tobramycin (ophthalmic)': ['tobramycin'],
  'Erythromycin ophthalmic ointment': ['erythromycin'],
  'Systane ointment': ['systane'],
  'Warm Compresses': ['warm compress', 'warm compresses'],
  'Ocusoft lid wipes': ['ocusoft'],
  'Valacyclovir (Valtrex)': ['valtrex'],
  'Bactrim DS': ['bactrim'],
  'Diamox': ['diamox'],
  'Doxycycline': ['doxycycline', 'doxy'],
  'Omeprazole': ['omeprazole'],
  'Naproxen (OTC 220 mg)': ['naproxen'],
  'AREDSII': ['areds', 'areds ii'],
  'Tacrolimus (topical 0.03-0.1%)': ['tacrolimus']
};

// Create reverse lookup map: abbreviation -> medication name
const medicationAbbreviations = {};
Object.entries(medicationAbbreviationMap).forEach(([medicationName, abbreviations]) => {
  abbreviations.forEach(abbr => {
    medicationAbbreviations[abbr] = medicationName;
  });
});

function findMedByName(name) {
  if (!name) return null;
  const needle = name.trim().toLowerCase();
  
  // First, check if it's an abbreviation
  if (medicationAbbreviations[needle]) {
    const fullName = medicationAbbreviations[needle];
    const exactMatch = state.meds.find(m => m.name.toLowerCase() === fullName.toLowerCase());
    if (exactMatch) return exactMatch;
  }
  
  // Then try exact match
  const exactMatch = state.meds.find(
    (m) =>
      m.name.toLowerCase() === needle ||
      (m.aliases || []).some((a) => a.toLowerCase() === needle)
  );
  if (exactMatch) return exactMatch;
  
  // Then try partial/fuzzy matching - find medications that contain the search text
  // Prioritize matches that start with the search text
  const startsWithMatch = state.meds.find((m) => 
    m.name.toLowerCase().startsWith(needle) ||
    (m.aliases || []).some((a) => a.toLowerCase().startsWith(needle))
  );
  if (startsWithMatch) return startsWithMatch;
  
  // For very short searches (1-2 chars), be more strict - only match if it's a word boundary or abbreviation
  if (needle.length <= 2) {
    // Check if it matches as a word (not just a substring)
    const wordMatch = state.meds.find((m) => {
      const nameLower = m.name.toLowerCase();
      // Check if it's a standalone word or abbreviation
      return nameLower === needle ||
             nameLower.startsWith(needle + ' ') ||
             nameLower.includes(' ' + needle + ' ') ||
             nameLower.endsWith(' ' + needle) ||
             (m.aliases || []).some((a) => {
               const aliasLower = a.toLowerCase();
               return aliasLower === needle ||
                      aliasLower.startsWith(needle + ' ') ||
                      aliasLower.includes(' ' + needle + ' ') ||
                      aliasLower.endsWith(' ' + needle);
             });
    });
    if (wordMatch) return wordMatch;
  }
  
  // Then find any medication that contains the search text
  const containsMatch = state.meds.find((m) => 
    m.name.toLowerCase().includes(needle) ||
    (m.aliases || []).some((a) => a.toLowerCase().includes(needle))
  );
  if (containsMatch) return containsMatch;
  
  return null;
}

function parseMedicalAbbreviation(directions) {
  const directionsLower = directions.toLowerCase().trim();
  
  // Map medical abbreviations to frequency values
  const abbreviationMap = {
    'qd': 'QD',
    'q.d.': 'QD',
    'once daily': 'QD',
    'once a day': 'QD',
    'daily': 'QD',
    
    'bid': 'BID',
    'b.i.d.': 'BID',
    'twice daily': 'BID',
    'twice a day': 'BID',
    '2x daily': 'BID',
    '2x/day': 'BID',
    
    'tid': 'TID',
    't.i.d.': 'TID',
    'three times daily': 'TID',
    'three times a day': 'TID',
    '3x daily': 'TID',
    '3x/day': 'TID',
    
    'qid': 'QID',
    'q.i.d.': 'QID',
    'four times daily': 'QID',
    'four times a day': 'QID',
    '4x daily': 'QID',
    '4x/day': 'QID',
    
    'qhs': 'QHS',
    'q.h.s.': 'QHS',
    'at bedtime': 'QHS',
    'bedtime': 'QHS',
    'hs': 'QHS',
    'h.s.': 'QHS'
  };
  
  // Check for exact matches first
  if (abbreviationMap[directionsLower]) {
    return {
      frequency: abbreviationMap[directionsLower],
      customText: ''
    };
  }
  
  // Check for "every X hours" pattern
  const everyHoursMatch = directionsLower.match(/every\s+(\d+)\s*hours?/);
  if (everyHoursMatch) {
    return {
      frequency: 'custom',
      customHours: everyHoursMatch[1],
      customText: ''
    };
  }
  
  // Check for "qXh" pattern (q6h, q8h, etc.)
  const qxhMatch = directionsLower.match(/q(\d+)h/);
  if (qxhMatch) {
    return {
      frequency: 'custom',
      customHours: qxhMatch[1],
      customText: ''
    };
  }
  
  // If no abbreviation found, treat as custom text
  return {
    frequency: 'other',
    customText: directions
  };
}

function translateText(text, language) {
  if (!text || language === 'english') return text;
  
  const translation = state.translations[text.toLowerCase()];
  
  if (translation) {
    // Map language values to translation keys
    const langMap = {
      'spanish': 'spanish',
      'chinese': 'chinese',
      'numeric': 'simple'
    };
    const langKey = langMap[language];
    
    if (langKey && translation[langKey]) {
      return translation[langKey];
    }
  }
  
  return text;
}

function translateDirections(directions, language) {
  if (!directions) return directions;
  
  // First, convert medical abbreviations to full text if needed
  const abbreviationMap = {
    'QD': 'once daily',
    'BID': 'twice daily',
    'TID': 'three times daily',
    'QID': 'four times daily',
    'QHS': 'at bedtime',
    'Q2h': 'every 2 hours',
    'Q3h': 'every 3 hours',
    'Q4h': 'every 4 hours',
    'Q8h': 'every 8 hours',
    'Q2H': 'every 2 hours',
    'Q3H': 'every 3 hours',
    'Q4H': 'every 4 hours',
    'Q8H': 'every 8 hours'
  };
  
  // Check if the entire directions string is just an abbreviation
  const upperDirections = directions.toUpperCase().trim();
  if (abbreviationMap[upperDirections]) {
    directions = abbreviationMap[upperDirections];
  }
  
  // If language is English, return the full text
  if (language === 'english') return directions;
  
  // First try to translate the entire phrase
  const fullTranslation = state.translations[directions.toLowerCase()];
  if (fullTranslation) {
    const langMap = {
      'spanish': 'spanish',
      'chinese': 'chinese',
      'simple': 'simple',
      'numeric': 'simple'
    };
    const langKey = langMap[language];
    if (langKey && fullTranslation[langKey]) {
      return fullTranslation[langKey];
    }
  }
  
  // If no full phrase translation, try word by word
  const parts = directions.split(/\s+/);
  const translatedParts = parts.map(part => translateText(part, language));
  
  return translatedParts.join(' ');
}

async function translateNotesWithAI(notes, language) {
  if (!notes || language === 'english') return notes;
  
  try {
    // Map our language codes to Google Translate language codes
    // For simple modes, content stays in English (numbers), so no translation needed
    const languageMap = {
      'spanish': 'es',
      'chinese': 'zh',
      'numeric': 'en' // Numeric mode stays in English (no translation)
    };
    
    const targetLang = languageMap[language];
    if (!targetLang) return notes;
    
    // Use Google Translate API (free tier: 500k characters/month)
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(notes)}`);
    
    if (!response.ok) {
      return notes;
    }
    
    const data = await response.json();
    const translatedNotes = data[0][0][0];
    
    if (translatedNotes && translatedNotes !== notes) {
      return translatedNotes;
    }
    
    return notes;
    
  } catch (error) {
    return notes;
  }
}

function reconstructDirectionsFromOriginal(med, language) {
  const dose = med.originalDose || '';
  const frequency = med.originalFrequency || '';
  const customHours = med.originalCustomHours || '';
  const otherDirections = med.originalOtherDirections || '';
  
  if (!dose && !frequency && !otherDirections) {
    return '';
  }
  
  let directions = '';
  
  // Add dose if provided
  if (dose) {
    directions += dose;
  }
  
  // Add frequency
  if (frequency === 'custom' && customHours) {
    directions += ` every ${customHours} hours`;
  } else if (frequency === 'other' && otherDirections) {
    directions += ` ${otherDirections}`;
  } else if (frequency && frequency !== 'custom' && frequency !== 'other') {
    const frequencyText = {
      'QD': 'once daily',
      'BID': 'twice daily', 
      'TID': 'three times daily',
      'QID': 'four times daily',
      'QHS': 'at bedtime'
    };
    directions += ` ${frequencyText[frequency] || frequency}`;
  }
  
  // Translate the directions based on selected language
  return translateDirections(directions.trim(), language);
}

function updateSelection(med) {
  state.selected = med;
  updateAddButtonState();
  
  // Clear form first
  clearFormFields();
  
  if (!med) return;
  
  // Get medication data from CSV
  const medData = state.medicationData[med.name];
  
  if (medData) {
    // Auto-populate directions if available
    if (medData.directions) {
      const parsedDirections = parseMedicalAbbreviation(medData.directions);
      
      const frequencyEl = $('#frequency');
      if (frequencyEl) {
        frequencyEl.value = parsedDirections.frequency;
        handleFrequencyChange();
        
        // Fill in custom fields based on parsed result
        if (parsedDirections.frequency === 'custom' && parsedDirections.customHours) {
          const customHoursEl = $('#customHours');
          if (customHoursEl) {
            customHoursEl.value = parsedDirections.customHours;
          }
        } else if (parsedDirections.frequency === 'other' && parsedDirections.customText) {
          const otherDirectionsEl = $('#otherDirections');
          if (otherDirectionsEl) {
            otherDirectionsEl.value = parsedDirections.customText;
          }
        }
      }
    }
    
    // Show/hide eye selection based on medication type
    const eyeSelectionRow = $('#eyeSelectionRow');
    const eyeSelection = document.querySelector('.eye-selection');
    
    if (eyeSelectionRow) {
      if (medData.type === 'eye_drop' || medData.type === 'eye_ointment') {
        eyeSelectionRow.style.display = 'flex';
        // Default to "both" eyes for eye medications
        if (!state.selectedEye) {
          selectEye('both');
        }
      } else {
        eyeSelectionRow.style.display = 'none';
        // Clear eye selection for non-eye medications
        state.selectedEye = null;
        const eyeButtons = document.querySelectorAll('.eye-btn');
        eyeButtons.forEach(btn => btn.classList.remove('selected'));
      }
    }
  } else {
    // No CSV data found, hide eye selection by default
    const eyeSelectionRow = $('#eyeSelectionRow');
    if (eyeSelectionRow) {
      eyeSelectionRow.style.display = 'none';
    }
  }
}

function clearFormFields() {
  const doseEl = $('#dose');
  const frequencyEl = $('#frequency');
  const customHoursEl = $('#customHours');
  const otherDirectionsEl = $('#otherDirections');
  
  if (doseEl) doseEl.value = '';
  if (frequencyEl) frequencyEl.value = '';
  if (customHoursEl) customHoursEl.value = '';
  if (otherDirectionsEl) otherDirectionsEl.value = '';
  
  // Hide custom rows
  const customHoursRow = $('#customHoursRow');
  const otherRow = $('#otherRow');
  if (customHoursRow) customHoursRow.style.display = 'none';
  if (otherRow) otherRow.style.display = 'none';
  
  // Reset eye selection
  state.selectedEye = null;
  const eyeButtons = document.querySelectorAll('.eye-btn');
  eyeButtons.forEach(btn => {
    btn.classList.remove('selected');
  });
}

function handleFrequencyChange() {
  const frequencySelect = $('#frequency');
  const customHoursRow = $('#customHoursRow');
  const otherRow = $('#otherRow');
  
  if (!frequencySelect) return;
  
  const selectedValue = frequencySelect.value;
  
  // Hide both custom rows initially
  if (customHoursRow) customHoursRow.style.display = 'none';
  if (otherRow) otherRow.style.display = 'none';
  
  // Show appropriate row based on selection
  if (selectedValue === 'custom') {
    if (customHoursRow) customHoursRow.style.display = 'flex';
  } else if (selectedValue === 'other') {
    if (otherRow) otherRow.style.display = 'flex';
  }
}

function getDirectionsFromForm() {
  const dose = $('#dose')?.value?.trim();
  const frequency = $('#frequency')?.value?.trim();
  const customHours = $('#customHours')?.value?.trim();
  const otherDirections = $('#otherDirections')?.value?.trim();
  
  if (!dose && !frequency && !otherDirections) {
    return '';
  }
  
  let directions = '';
  
  // Add dose if provided
  if (dose) {
    directions += dose;
  }
  
  // Add frequency
  if (frequency === 'custom' && customHours) {
    directions += ` every ${customHours} hours`;
  } else if (frequency === 'other' && otherDirections) {
    directions += ` ${otherDirections}`;
  } else if (frequency && frequency !== 'custom' && frequency !== 'other') {
    const frequencyText = {
      'QD': 'once daily',
      'BID': 'twice daily', 
      'TID': 'three times daily',
      'QID': 'four times daily',
      'QHS': 'at bedtime'
    };
    directions += ` ${frequencyText[frequency] || frequency}`;
  }
  
  // Translate the directions based on selected language
  const contentLang = getContentLanguage(state.selectedLanguage);
  const translatedDirections = translateDirections(directions.trim(), contentLang);
  return translatedDirections;
}

function selectEye(eye) {
  // Only change selection if clicking a different option
  // If clicking the same button, do nothing (prevent unselecting)
  if (state.selectedEye !== eye) {
    state.selectedEye = eye;
  }
  
  // Update button visual states
  const eyeButtons = document.querySelectorAll('.eye-btn');
  eyeButtons.forEach(btn => {
    btn.classList.remove('selected');
    if (btn.dataset.eye === state.selectedEye) {
      btn.classList.add('selected');
    }
  });
}

function getEyeText(eye) {
  switch(eye) {
    case 'right': return 'right eye';
    case 'left': return 'left eye';
    case 'both': return 'both eyes';
    default: return '';
  }
}

function updateProtocolButtons() {
  const protocolButtons = document.querySelectorAll('.protocol-btn');
  protocolButtons.forEach(btn => {
    const protocolId = btn.dataset.protocol;
    if (state.selectedProtocol === protocolId) {
      btn.classList.add('selected');
    } else {
      btn.classList.remove('selected');
    }
  });
  updateAddButtonState();
}

function updateAddButtonState() {
  const addBtn = $('#addMedBtn');
  if (!addBtn) return;
  
  // Add primary class if medication or protocol is selected
  if (state.selected || state.selectedProtocol) {
    addBtn.classList.add('primary');
  } else {
    addBtn.classList.remove('primary');
  }
}



function addMedicationToPlan() {
  // If a protocol is selected, add all medications from the protocol
  if (state.selectedProtocol) {
    const protocol = protocols[state.selectedProtocol];
    if (!protocol) return;
    
    let addedCount = 0;
    protocol.medications.forEach(medName => {
      // Find the medication in the meds list
      const med = state.meds.find(m => m.name === medName);
      if (!med) {
        console.warn(`Medication "${medName}" not found in medications list`);
        return;
      }
      
      // Get medication data from CSV
      const medData = state.medicationData[medName];
      const sideEffects = medData ? medData.sideEffects : '';
      
      // Get default directions from CSV - use the saved directions for each medication
      let directions = '';
      const contentLang = getContentLanguage(state.selectedLanguage);
      
      if (medData && medData.directions && medData.directions.trim()) {
        // Use the medication's saved default directions and translate them
        const abbreviation = medData.directions.trim();
        directions = translateDirections(abbreviation, contentLang);
      } else {
        // Only use QID as fallback if no default directions exist AND it's an eye medication
        if (medData && (medData.type === 'eye_drop' || medData.type === 'eye_ointment')) {
          directions = translateDirections('QID', contentLang);
        }
      }
      
      // Determine eye selection for eye medications
      let selectedEye = null;
      if (medData && (medData.type === 'eye_drop' || medData.type === 'eye_ointment')) {
        selectedEye = 'both'; // Default to both eyes for protocol medications
      }
      
      const medication = {
        id: Date.now() + addedCount, // Unique ID with offset
        name: med.name,
        image: med.image,
        directions: directions,
        selectedEye: selectedEye,
        sideEffects: sideEffects,
        // Store original form data for re-translation
        originalDose: null,
        originalFrequency: medData && medData.directions ? medData.directions : null,
        originalCustomHours: null,
        originalOtherDirections: null
      };
      
      state.treatmentPlan.push(medication);
      addedCount++;
    });
    
    // Clear protocol selection after adding
    state.selectedProtocol = null;
    updateProtocolButtons();
    updateAddButtonState();
    updateTreatmentPlanList();
    updateHandoutDisplay();
    persist();
    return;
  }
  
  // Original single medication logic
  if (!state.selected) {
    alert('Please select a medication first.');
    return;
  }

  const directions = getDirectionsFromForm();

  if (!directions) {
    alert('Please add directions before adding the medication.');
    return;
  }

  // Get side effects from CSV data
  const medData = state.medicationData[state.selected.name];
  const sideEffects = medData ? medData.sideEffects : '';

  const medication = {
    id: Date.now(), // Simple unique ID
    name: state.selected.name,
    image: state.selected.image,
    directions: directions,
    selectedEye: state.selectedEye,
    sideEffects: sideEffects,
    // Store original form data for re-translation
    originalDose: $('#dose')?.value?.trim(),
    originalFrequency: $('#frequency')?.value?.trim(),
    originalCustomHours: $('#customHours')?.value?.trim(),
    originalOtherDirections: $('#otherDirections')?.value?.trim()
  };

  state.treatmentPlan.push(medication);
  updateTreatmentPlanList();
  updateHandoutDisplay(); // Still needed for print layout
  clearMedicationForm();
  updateAddButtonState();
  persist();
}

function removeMedicationFromPlan(id) {
  state.treatmentPlan = state.treatmentPlan.filter(med => med.id !== id);
  updateTreatmentPlanList();
  updateHandoutDisplay(); // Still needed for print layout
  persist();
}

function toggleEyeSelection(medicationId, eye) {
  // Find the medication in the treatment plan
  const medication = state.treatmentPlan.find(med => med.id === medicationId);
  if (!medication) {
    return;
  }
  
  // Get current eye selection
  const currentEye = medication.selectedEye;
  
  // Toggle logic
  let newEyeSelection;
  if (eye === 'right') {
    if (currentEye === 'right') {
      newEyeSelection = null; // Deselect right
    } else if (currentEye === 'left') {
      newEyeSelection = 'both'; // Add right to left = both
    } else if (currentEye === 'both') {
      newEyeSelection = 'left'; // Remove right from both = left
    } else {
      newEyeSelection = 'right'; // Select right
    }
  } else if (eye === 'left') {
    if (currentEye === 'left') {
      newEyeSelection = null; // Deselect left
    } else if (currentEye === 'right') {
      newEyeSelection = 'both'; // Add left to right = both
    } else if (currentEye === 'both') {
      newEyeSelection = 'right'; // Remove left from both = right
    } else {
      newEyeSelection = 'left'; // Select left
    }
  }
  
  // Update the medication
  medication.selectedEye = newEyeSelection;
  
  // Update the display and save
  updateTreatmentPlanList();
  updateHandoutDisplay(); // Still needed for print layout
  persist();
}

function updateTreatmentPlanDisplay() {
  const container = $('#medicationList');
  
  if (container) {
    if (state.treatmentPlan.length === 0) {
      container.innerHTML = '<div class="empty-state">No medications added yet. Select a medication above and click "Add Medication to Plan".</div>';
      return;
    }

    container.innerHTML = state.treatmentPlan.map(med => `
      <div class="med-card">
        <div class="med-card-header">
          <img src="${med.image}" alt="${med.name}" />
          <div class="med-card-name">${med.name}</div>
          <button class="remove-med" onclick="removeMedicationFromPlan(${med.id})" title="Remove">×</button>
        </div>
        <div class="med-card-content">
          ${med.directions ? `<div><strong>Directions:</strong> ${med.directions}</div>` : ''}
          ${med.instructions ? `<div><strong>Instructions:</strong> ${med.instructions}</div>` : ''}
        </div>
      </div>
    `).join('');
  }
}

// Helper function to get current frequency abbreviation from medication
function getCurrentFrequency(med) {
  // First check if originalFrequency is stored
  if (med.originalFrequency) {
    return med.originalFrequency;
  }
  
  // Try to parse from directions
  if (med.directions) {
    const parsed = parseMedicalAbbreviation(med.directions);
    if (parsed.frequency) {
      // If it's custom and we have customHours, make sure it's stored
      if (parsed.frequency === 'custom' && parsed.customHours && !med.originalCustomHours) {
        med.originalCustomHours = parsed.customHours;
        med.originalFrequency = 'custom';
      }
      return parsed.frequency;
    }
  }
  
  // Default to QD if nothing found
  return 'QD';
}

// Function to update medication frequency
function updateMedicationFrequency(medId, newFrequency) {
  const medication = state.treatmentPlan.find(med => med.id === medId);
  if (!medication) return;
  
  const contentLang = getContentLanguage(state.selectedLanguage);
  
  // Update originalFrequency
  medication.originalFrequency = newFrequency;
  
  // If switching to custom but no hours set yet, set default to 6
  if (newFrequency === 'custom' && !medication.originalCustomHours) {
    medication.originalCustomHours = '6';
  }
  
  // Reconstruct directions based on the new frequency
  let directions = '';
  const dose = medication.originalDose || '';
  
  if (dose) {
    directions += dose;
  }
  
  // Add frequency
  if (newFrequency === 'custom' && medication.originalCustomHours) {
    directions += ` every ${medication.originalCustomHours} hours`;
  } else if (newFrequency === 'other' && medication.originalOtherDirections) {
    directions += ` ${medication.originalOtherDirections}`;
  } else if (newFrequency && newFrequency !== 'custom' && newFrequency !== 'other') {
    const frequencyText = {
      'QD': 'once daily',
      'BID': 'twice daily', 
      'TID': 'three times daily',
      'QID': 'four times daily',
      'QHS': 'at bedtime'
    };
    directions += ` ${frequencyText[newFrequency] || newFrequency}`;
  }
  
  // Translate the directions
  medication.directions = translateDirections(directions.trim(), contentLang);
  
  // Update displays
  updateTreatmentPlanList();
  updateHandoutDisplay();
  persist();
}

// Function to update custom hours
function updateMedicationCustomHours(medId, hours) {
  const medication = state.treatmentPlan.find(med => med.id === medId);
  if (!medication) return;
  
  medication.originalCustomHours = hours;
  
  // Reconstruct directions
  const contentLang = getContentLanguage(state.selectedLanguage);
  let directions = '';
  const dose = medication.originalDose || '';
  
  if (dose) {
    directions += dose;
  }
  
  if (hours) {
    directions += ` every ${hours} hours`;
  }
  
  // Translate the directions
  medication.directions = translateDirections(directions.trim(), contentLang);
  
  // Update displays
  updateHandoutDisplay();
  persist();
}

function updateTreatmentPlanList() {
  const container = $('#treatmentPlanList');
  
  if (!container) return;
  
  const medicationsHTML = state.treatmentPlan.length === 0 
    ? '<div class="empty-state">No medications added yet.</div>'
    : state.treatmentPlan.map(med => {
        // Check if this is an eye medication
        const medData = state.medicationData[med.name];
        const isEyeMedication = medData && (medData.type === 'eye_drop' || medData.type === 'eye_ointment');
        
        // Get current frequency
        const currentFreq = getCurrentFrequency(med);
        const isCustom = currentFreq === 'custom';
        const customHours = med.originalCustomHours || '';
        
        return `
          <div class="treatment-plan-item">
            <div class="treatment-plan-name">${med.name}</div>
            <div class="treatment-plan-frequency">
              <select class="frequency-dropdown" onchange="updateMedicationFrequency(${med.id}, this.value)" data-med-id="${med.id}">
                <option value="QD" ${currentFreq === 'QD' ? 'selected' : ''}>QD</option>
                <option value="BID" ${currentFreq === 'BID' ? 'selected' : ''}>BID</option>
                <option value="TID" ${currentFreq === 'TID' ? 'selected' : ''}>TID</option>
                <option value="QID" ${currentFreq === 'QID' ? 'selected' : ''}>QID</option>
                <option value="QHS" ${currentFreq === 'QHS' ? 'selected' : ''}>QHS</option>
                <option value="custom" ${isCustom ? 'selected' : ''}>Qx hours</option>
              </select>
              ${isCustom ? `
                <input type="number" 
                       class="frequency-hours-input" 
                       value="${customHours}" 
                       min="1" 
                       max="24"
                       placeholder="hours"
                       onchange="updateMedicationCustomHours(${med.id}, this.value)"
                       oninput="updateMedicationCustomHours(${med.id}, this.value)"
                       data-med-id="${med.id}">
              ` : ''}
            </div>
            ${isEyeMedication ? `
            <div class="treatment-plan-eyes">
              <span class="eye-letter ${med.selectedEye === 'right' || med.selectedEye === 'both' ? 'circled' : ''}" 
                    onclick="toggleEyeSelection(${med.id}, 'right')" 
                    title="Right eye"
                    data-med-id="${med.id}"
                    data-eye="right">R</span>
              <span class="eye-letter ${med.selectedEye === 'left' || med.selectedEye === 'both' ? 'circled' : ''}" 
                    onclick="toggleEyeSelection(${med.id}, 'left')" 
                    title="Left eye"
                    data-med-id="${med.id}"
                    data-eye="left">L</span>
            </div>
            ` : ''}
            <button class="treatment-plan-remove" onclick="removeMedicationFromPlan(${med.id})" title="Remove">×</button>
          </div>
        `;
      }).join('');
  
  // Only include the buttons if there are medications
  const buttonsHTML = state.treatmentPlan.length > 0 ? `
    <div class="actions">
      <button id="clearBtn" type="button" onclick="clearAll()">Clear All</button>
      <button id="printBtn" type="button" class="primary" onclick="handlePrint()">Print Treatment Plan</button>
    </div>
  ` : '';
  
  container.innerHTML = medicationsHTML + buttonsHTML;
}

// Make functions globally accessible
window.updateMedicationFrequency = updateMedicationFrequency;
window.updateMedicationCustomHours = updateMedicationCustomHours;

// Helper function to get content language (for numeric mode, use 'simple' for content)
function getContentLanguage(language) {
  if (language === 'numeric') {
    return 'simple';
  }
  return language;
}

// Helper function to generate medication HTML
async function generateMedicationHTML(med) {
  // Get the content language (numeric modes use 'simple' for content)
  const contentLang = getContentLanguage(state.selectedLanguage);
  
  // Reconstruct directions from original form data and translate
  // For protocol medications (originalDose is null), we need to translate from originalFrequency
  // For manually added medications, reconstruct and translate
  let translatedDirections;
  if (med.originalDose !== undefined && med.originalDose !== null) {
    // Manually added medication - reconstruct from form data
    translatedDirections = reconstructDirectionsFromOriginal(med, contentLang);
  } else if (med.originalFrequency) {
    // Protocol medication - translate from the stored abbreviation
    translatedDirections = translateDirections(med.originalFrequency, contentLang);
  } else if (med.directions) {
    // Fallback: use stored directions if originalFrequency is missing
    // But check if it's still an abbreviation and translate it
    const upperDir = med.directions.toUpperCase().trim();
    const abbreviations = ['QD', 'BID', 'TID', 'QID', 'QHS', 'Q2H', 'Q3H', 'Q4H', 'Q8H'];
    if (abbreviations.includes(upperDir)) {
      translatedDirections = translateDirections(med.directions, contentLang);
    } else {
      translatedDirections = med.directions;
    }
  } else {
    translatedDirections = '';
  }
  
  return `
    <div class="handout-medication">
      <div class="handout-header">
        <img src="${med.image}" alt="${med.name}" />
        <div class="handout-content-right">
          <div class="handout-med">${med.name}</div>
          
          ${translatedDirections ? `
            <div class="handout-block">
              <div class="block-title directions-title">${translateText('directions', getContentLanguage(state.selectedLanguage))}:</div>
              <div class="block-body">${translatedDirections}</div>
            </div>
          ` : ''}
        </div>
        ${(() => {
          // Check if this is an eye medication
          const medData = state.medicationData[med.name];
          const isEyeMedication = medData && (medData.type === 'eye_drop' || medData.type === 'eye_ointment');
          return isEyeMedication ? `
        <div class="eye-indicators">
          <span class="eye-letter clickable ${med.selectedEye === 'right' || med.selectedEye === 'both' ? 'circled' : ''}" 
                onclick="toggleEyeSelection(${med.id}, 'right')" 
                title="Click to toggle right eye"
                data-med-id="${med.id}"
                data-eye="right">R</span>
          <span class="eye-letter clickable ${med.selectedEye === 'left' || med.selectedEye === 'both' ? 'circled' : ''}" 
                onclick="toggleEyeSelection(${med.id}, 'left')" 
                title="Click to toggle left eye"
                data-med-id="${med.id}"
                data-eye="left">L</span>
        </div>
          ` : '';
        })()}
        <button class="remove-med-handout" onclick="removeMedicationFromPlan(${med.id})" title="Remove" style="background: red; color: white; border: none; border-radius: 50%; width: 32px; height: 32px; position: absolute; top: 8px; right: 8px; cursor: pointer; font-size: 18px; font-weight: bold; z-index: 1000;">×</button>
      </div>
    </div>
    `;
}

async function updateHandoutDisplay() {
  const container = $('#handoutContent');
  
  if (state.treatmentPlan.length === 0) {
    container.innerHTML = '<div class="empty-handout"><p>Add medications to see your treatment plan here.</p></div>';
    return;
  }

  // Show loading indicator if translating
  if (state.selectedLanguage !== 'english') {
    container.innerHTML = '<div class="loading">Translating...</div>';
  }
  
  // Process each medication with async translation
  const medicationHTMLs = await Promise.all(state.treatmentPlan.map(med => generateMedicationHTML(med)));
  
  // Organize medications by eye for print layout
  // Default: all medications go to both sides unless they're eye medications with specific eye selection
  const leftMeds = [];
  const rightMeds = [];
  
  // Process each medication
  state.treatmentPlan.forEach((med, index) => {
    const html = medicationHTMLs[index];
    const medData = state.medicationData[med.name];
    const isEyeMedication = medData && (medData.type === 'eye_drop' || medData.type === 'eye_ointment');
    
    // If it's an eye medication with specific selection
    if (isEyeMedication && med.selectedEye) {
      if (med.selectedEye === 'left' || med.selectedEye === 'both') {
        leftMeds.push(html);
      }
      if (med.selectedEye === 'right' || med.selectedEye === 'both') {
        rightMeds.push(html);
      }
    } else {
      // For non-eye medications OR eye medications without selection, add to both sides
      leftMeds.push(html);
      rightMeds.push(html);
    }
  });
  
  // Build the HTML structure
  // Screen view: normal list
  // Print view: split left/right
  const screenView = medicationHTMLs.join('');
  
  // Build content for each side
  const leftContent = leftMeds.join('');
  const rightContent = rightMeds.join('');
  
  // Debug: Log to console with more details
  console.log('Print layout debug:', {
    totalMeds: state.treatmentPlan.length,
    leftMeds: leftMeds.length,
    rightMeds: rightMeds.length,
    leftContentLength: leftContent.length,
    rightContentLength: rightContent.length,
    leftContentPreview: leftContent.substring(0, 200),
    rightContentPreview: rightContent.substring(0, 200),
    medications: state.treatmentPlan.map(m => ({ name: m.name, selectedEye: m.selectedEye }))
  });
  
  // Ensure we have content - if empty, show a message
  const leftDisplay = leftContent.trim() || '<p style="color: #999; font-style: italic; padding: 20px;">No medications for left eye</p>';
  const rightDisplay = rightContent.trim() || '<p style="color: #999; font-style: italic; padding: 20px;">No medications for right eye</p>';
  
  // Translate the LEFT and RIGHT headings
  // For Numeric mode, use the separate numericHeadingLanguage for headings
  let headingLanguage = state.selectedLanguage;
  let contentLanguage = state.selectedLanguage;
  
  if (headingLanguage === 'numeric') {
    headingLanguage = state.numericHeadingLanguage || 'english'; // Use selected heading language
    contentLanguage = 'simple'; // Content uses simple (numbers)
  }
  
  let leftTranslated = translateText('left', headingLanguage);
  let rightTranslated = translateText('right', headingLanguage);
  
  // If translation didn't work, check if translations are loaded
  if (leftTranslated === 'left' && headingLanguage !== 'english') {
    // Fallback: use direct lookup
    const leftTrans = state.translations['left'];
    if (leftTrans) {
      leftTranslated = leftTrans[headingLanguage] || 'left';
    }
  }
  if (rightTranslated === 'right' && headingLanguage !== 'english') {
    // Fallback: use direct lookup
    const rightTrans = state.translations['right'];
    if (rightTrans) {
      rightTranslated = rightTrans[headingLanguage] || 'right';
    }
  }
  
  // For Chinese, don't uppercase. For others, uppercase.
  const leftHeading = (headingLanguage === 'chinese') 
    ? leftTranslated 
    : leftTranslated.toUpperCase();
  const rightHeading = (headingLanguage === 'chinese') 
    ? rightTranslated 
    : rightTranslated.toUpperCase();
  
  // Swapped: left side of paper shows right eye medications, right side shows left eye medications
  const printView = `
    <div class="print-layout">
      <div class="print-left">
        <h2 class="print-eye-heading">${rightHeading}</h2>
        <div class="print-medications">
          ${rightDisplay}
        </div>
      </div>
      <div class="print-right">
        <h2 class="print-eye-heading">${leftHeading}</h2>
        <div class="print-medications">
          ${leftDisplay}
        </div>
      </div>
    </div>
  `;
  
  // Combine screen and print views
  container.innerHTML = `
    <div class="screen-view">${screenView}</div>
    ${printView}
  `;
  
  // Additional debug: Check if print layout exists in DOM
  setTimeout(() => {
    const printLayout = document.querySelector('.print-layout');
    const printLeft = document.querySelector('.print-left .print-medications');
    const printRight = document.querySelector('.print-right .print-medications');
    console.log('DOM check:', {
      printLayoutExists: !!printLayout,
      printLeftExists: !!printLeft,
      printRightExists: !!printRight,
      printLeftInnerHTML: printLeft?.innerHTML?.substring(0, 200),
      printRightInnerHTML: printRight?.innerHTML?.substring(0, 200)
    });
  }, 100);
}

function clearMedicationForm() {
  const medSearchEl = $('#medSearch');

  if (medSearchEl) {
    medSearchEl.value = '';
  }
  
  // Clear visual selection in medication list
  const medButtons = document.querySelectorAll('.med-button');
  medButtons.forEach(btn => {
    btn.classList.remove('selected');
  });
  
  // Clear form fields and reset eye selection
  clearFormFields();
  
  // Hide eye selection by default
  const eyeSelectionRow = $('#eyeSelectionRow');
  if (eyeSelectionRow) {
    eyeSelectionRow.style.display = 'none';
  }
  
  updateSelection(null);
  updateAddButtonState();
}

function clearAll() {
  state.treatmentPlan = [];
  updateTreatmentPlanList();
  updateHandoutDisplay();
  clearMedicationForm();
  try {
    localStorage.removeItem('handoutDraft');
  } catch {}
}

// Make clearAll globally accessible for inline onclick handlers
window.clearAll = clearAll;

function persist() {
  const payload = {
    treatmentPlan: state.treatmentPlan
  };
  try {
    localStorage.setItem('handoutDraft', JSON.stringify(payload));
  } catch {}
}

function restore() {
  try {
    const raw = localStorage.getItem('handoutDraft');
    if (!raw) return;
    const d = JSON.parse(raw);
    if (d.treatmentPlan && Array.isArray(d.treatmentPlan)) {
      state.treatmentPlan = d.treatmentPlan;
      updateTreatmentPlanList();
      updateHandoutDisplay();
    }
  } catch {}
}

// Get search suggestions based on input
function getSearchSuggestions(searchText) {
  if (!searchText || searchText.trim() === '') {
    return [];
  }
  
  const needle = searchText.trim().toLowerCase();
  const suggestions = [];
  const seen = new Set();
  
  // Check abbreviations first (exact match only)
  if (medicationAbbreviations[needle]) {
    const fullName = medicationAbbreviations[needle];
    const med = state.meds.find(m => m.name.toLowerCase() === fullName.toLowerCase());
    if (med && !seen.has(med.name)) {
      suggestions.push(med);
      seen.add(med.name);
    }
  }
  
  // Find medications that START with the search text only
  state.meds.forEach(med => {
    const nameLower = med.name.toLowerCase();
    if (nameLower.startsWith(needle) && !seen.has(med.name)) {
      suggestions.push(med);
      seen.add(med.name);
    }
  });
  
  // Check aliases that START with the search text
  state.meds.forEach(med => {
    if (med.aliases && med.aliases.length > 0) {
      const hasMatchingAlias = med.aliases.some(alias => 
        alias.toLowerCase().startsWith(needle)
      );
      if (hasMatchingAlias && !seen.has(med.name)) {
        suggestions.push(med);
        seen.add(med.name);
      }
    }
  });
  
  // Limit to top 8 suggestions
  return suggestions.slice(0, 8);
}

// Render autocomplete dropdown
function renderAutocompleteDropdown(suggestions, searchInput) {
  // Remove existing dropdown if any
  const existingDropdown = document.querySelector('.autocomplete-dropdown');
  if (existingDropdown) {
    existingDropdown.remove();
  }
  
  // Create dropdown container
  const dropdown = document.createElement('div');
  dropdown.className = 'autocomplete-dropdown';
  
  if (suggestions.length === 0) {
    // Show "No results found" message
    const noResults = document.createElement('div');
    noResults.className = 'autocomplete-item autocomplete-no-results';
    noResults.textContent = 'No results found';
    noResults.style.cursor = 'default';
    noResults.style.color = 'var(--muted)';
    noResults.style.pointerEvents = 'none';
    dropdown.appendChild(noResults);
  } else {
    // Create suggestion items
    suggestions.forEach((med, index) => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      item.textContent = med.name;
      item.dataset.index = index;
      item.dataset.medName = med.name;
      
      item.addEventListener('click', () => {
        selectMedicationFromAutocomplete(med);
      });
      
      item.addEventListener('mouseenter', () => {
        // Remove highlight from all items
        dropdown.querySelectorAll('.autocomplete-item').forEach(i => {
          i.classList.remove('highlighted');
        });
        // Highlight this item
        item.classList.add('highlighted');
        state.autocompleteSelectedIndex = index;
      });
      
      dropdown.appendChild(item);
    });
  }
  
  // Position dropdown below search input
  const inputRect = searchInput.getBoundingClientRect();
  const scrollY = window.scrollY || window.pageYOffset;
  const scrollX = window.scrollX || window.pageXOffset;
  
  dropdown.style.position = 'fixed';
  dropdown.style.top = `${inputRect.bottom}px`;
  dropdown.style.left = `${inputRect.left}px`;
  dropdown.style.width = `${inputRect.width}px`;
  dropdown.style.maxWidth = `${inputRect.width}px`;
  
  // Append to body
  document.body.appendChild(dropdown);
  
  // Store selected index
  state.autocompleteSelectedIndex = -1;
}

// Select medication from autocomplete
function selectMedicationFromAutocomplete(med) {
  const medSearchEl = $('#medSearch');
  if (medSearchEl) {
    medSearchEl.value = med.name;
    // Keep focus on search input so Enter key works
    medSearchEl.focus();
  }
  
  // Hide dropdown
  const dropdown = document.querySelector('.autocomplete-dropdown');
  if (dropdown) {
    dropdown.remove();
  }
  
  // Update selection
  updateSelection(med);
  
  // Auto-scroll to medication in the list
  scrollToMatchingMedication(med.name);
}

// Handle keyboard navigation in autocomplete (arrow keys and escape only)
function handleAutocompleteKeyboard(e, searchInput) {
  // Don't handle Enter here - it's handled in the main keydown handler
  if (e.key === 'Enter') {
    return;
  }
  
  const dropdown = document.querySelector('.autocomplete-dropdown');
  if (!dropdown) return;
  
  const items = dropdown.querySelectorAll('.autocomplete-item:not(.autocomplete-no-results)');
  if (items.length === 0) return;
  
  let currentIndex = state.autocompleteSelectedIndex || -1;
  
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    currentIndex = (currentIndex + 1) % items.length;
    state.autocompleteSelectedIndex = currentIndex;
    
    // Update highlights
    items.forEach((item, index) => {
      item.classList.toggle('highlighted', index === currentIndex);
    });
    
    // Scroll into view if needed
    items[currentIndex].scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    currentIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
    state.autocompleteSelectedIndex = currentIndex;
    
    // Update highlights
    items.forEach((item, index) => {
      item.classList.toggle('highlighted', index === currentIndex);
    });
    
    // Scroll into view if needed
    items[currentIndex].scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'Escape') {
    if (dropdown) {
      dropdown.remove();
    }
    state.autocompleteSelectedIndex = -1;
  }
}

function bind() {
  const medSearchEl = $('#medSearch');
  if (medSearchEl) {
    // Initialize autocomplete selected index
    state.autocompleteSelectedIndex = -1;
    
    medSearchEl.addEventListener('input', (e) => {
      const searchText = e.target.value;
      
      // Show dropdown if search text is not empty
      if (searchText.trim() !== '') {
        // Get suggestions
        const suggestions = getSearchSuggestions(searchText);
        // Always show dropdown (will show "No results found" if empty)
        renderAutocompleteDropdown(suggestions, medSearchEl);
      } else {
        // Hide dropdown if search text is empty
        const dropdown = document.querySelector('.autocomplete-dropdown');
        if (dropdown) {
          dropdown.remove();
        }
        // Clear selection when search is cleared
        updateSelection(null);
      }
      
      // Don't auto-select on typing - only on explicit selection
      // Auto-scroll to matching medication in the list (for visual feedback only)
      scrollToMatchingMedication(searchText);
    });
    
    medSearchEl.addEventListener('keydown', (e) => {
      // Handle Enter key - two-step process:
      // 1. First Enter: Select the medication (if not already selected)
      // 2. Enter when medication is selected: Add selected medication to treatment plan
      //    (works regardless of how medication was selected - dropdown, left list, or previous Enter)
      if (e.key === 'Enter' || e.keyCode === 13) {
        e.preventDefault();
        e.stopPropagation();
        
        // Priority 1: If medication is already selected (by any means), add it to treatment plan
        if (state.selected) {
          addMedicationToPlan();
          return;
        }
        
        // Priority 2: Otherwise, try to select a medication from search/dropdown (first Enter)
        const dropdown = document.querySelector('.autocomplete-dropdown');
        const items = dropdown ? dropdown.querySelectorAll('.autocomplete-item:not(.autocomplete-no-results)') : [];
        
        if (items.length > 0 && state.autocompleteSelectedIndex >= 0) {
          // If dropdown is open and item is highlighted, select it
          const medName = items[state.autocompleteSelectedIndex].dataset.medName;
          const med = state.meds.find(m => m.name === medName);
          if (med) {
            selectMedicationFromAutocomplete(med);
            return;
          }
        } else if (dropdown && items.length > 0) {
          // If dropdown is open but nothing highlighted, select first item
          const medName = items[0].dataset.medName;
          const med = state.meds.find(m => m.name === medName);
          if (med) {
            selectMedicationFromAutocomplete(med);
            return;
          }
        } else {
          // If no dropdown, try to find exact match and select it
          const searchText = medSearchEl.value.trim();
          if (searchText) {
            const med = findMedByName(searchText);
            if (med) {
              updateSelection(med);
              // Clear the search input and show the selected medication name
              medSearchEl.value = med.name;
              // Hide dropdown if it exists
              if (dropdown) {
                dropdown.remove();
              }
              return;
            }
          }
        }
      }
      
      // Handle other keyboard navigation
      handleAutocompleteKeyboard(e, medSearchEl);
    });
    
    medSearchEl.addEventListener('blur', () => {
      // Delay hiding dropdown to allow clicks on items
      setTimeout(() => {
        const dropdown = document.querySelector('.autocomplete-dropdown');
        if (dropdown) {
          dropdown.remove();
        }
        state.autocompleteSelectedIndex = -1;
      }, 200);
    });
    
    medSearchEl.addEventListener('focus', (e) => {
      // Show suggestions when focused if there's text
      const searchText = e.target.value;
      if (searchText.trim() !== '') {
        const suggestions = getSearchSuggestions(searchText);
        // Always show dropdown (will show "No results found" if empty)
        renderAutocompleteDropdown(suggestions, medSearchEl);
      }
    });
  }
  
  const addBtn = $('#addMedBtn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      addMedicationToPlan();
    });
  }
  
  // Protocol buttons
  const protocolButtons = document.querySelectorAll('.protocol-btn');
  protocolButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const protocolId = btn.dataset.protocol;
      if (state.selectedProtocol === protocolId) {
        // Deselect if clicking the same protocol
        state.selectedProtocol = null;
      } else {
        state.selectedProtocol = protocolId;
        // Clear single medication selection when protocol is selected
        state.selected = null;
        updateSelection(null);
      }
      updateProtocolButtons();
      updateAddButtonState();
    });
  });
  
  // Initialize protocol buttons
  updateProtocolButtons();
  // Initialize add button state
  updateAddButtonState();
  
  const clearBtn = $('#clearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearAll);
  }

  const clearHandoutBtn = $('#clearHandoutBtn');
  if (clearHandoutBtn) {
    clearHandoutBtn.addEventListener('click', clearAll);
  }

  // Make handlePrint globally accessible for inline onclick
  window.handlePrint = function() {
    if (state.treatmentPlan.length === 0) {
      if (!confirm('No medications in treatment plan. Print anyway?')) return;
    }
    window.print();
  };
  
  const printBtn = $('#printBtn');
  if (printBtn) {
    printBtn.addEventListener('click', window.handlePrint);
  }
  
  // Add event listeners for eye selection buttons
  const eyeButtons = document.querySelectorAll('.eye-btn');
  eyeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      selectEye(btn.dataset.eye);
    });
  });
  
  // Add event listener for frequency dropdown
  const frequencySelect = $('#frequency');
  if (frequencySelect) {
    frequencySelect.addEventListener('change', handleFrequencyChange);
  }
  
  // Language selector
  const languageSelect = $('#languageSelect');
  const numericLanguageSelect = $('#numericLanguageSelect');
  const numericLanguageLabel = $('#numericLanguageLabel');
  
  // Initialize numeric language selector state
  const updateNumericSelectorState = () => {
    if (state.selectedLanguage === 'numeric') {
      if (numericLanguageSelect) {
        numericLanguageSelect.disabled = false;
        numericLanguageSelect.style.opacity = '1';
      }
      if (numericLanguageLabel) {
        numericLanguageLabel.style.opacity = '1';
        numericLanguageLabel.style.pointerEvents = 'auto';
      }
    } else {
      if (numericLanguageSelect) {
        numericLanguageSelect.disabled = true;
        numericLanguageSelect.style.opacity = '0.5';
      }
      if (numericLanguageLabel) {
        numericLanguageLabel.style.opacity = '0.5';
        numericLanguageLabel.style.pointerEvents = 'none';
      }
    }
  };
  
  // Set initial state
  updateNumericSelectorState();
  
  if (languageSelect) {
    languageSelect.addEventListener('change', async (e) => {
      state.selectedLanguage = e.target.value;
      
      // Enable/disable numeric language selector based on selection
      updateNumericSelectorState();
      
      // Update existing treatment plan with new language (including AI translation)
      await updateHandoutDisplay();
    });
  }
  
  // Numeric heading language selector
  if (numericLanguageSelect) {
    numericLanguageSelect.addEventListener('change', async (e) => {
      state.numericHeadingLanguage = e.target.value;
      // Update existing treatment plan with new heading language
      await updateHandoutDisplay();
    });
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  setToday();
  bind();
  const medSearchEl = $('#medSearch');
  if (medSearchEl) {
    medSearchEl.focus();
  }
  await Promise.all([
    loadMedications(),
    loadMedicationData(),
    loadTranslations()
  ]);
  restore();
  // Initialize treatment plan list display (to ensure buttons are hidden if empty)
  updateTreatmentPlanList();
});


