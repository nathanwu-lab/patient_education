const state = {
  meds: [],
  selected: null,
  treatmentPlan: [],
  selectedEye: null,
  medicationData: {}, // Will store CSV data: {medicationName: {type, directions, sideEffects}}
  translations: {}, // Will store translation data
  selectedLanguage: 'english',
  numericHeadingLanguage: 'english', // Language for headings when Numeric is selected
  selectedProtocol: null // Currently selected protocol
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
  
  // Find the first medication that starts with the search text
  for (let i = 0; i < medButtons.length; i++) {
    const button = medButtons[i];
    const medName = button.textContent.toLowerCase();
    
    if (medName.startsWith(searchLower)) {
      // Scroll the medication list container to show this button
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
      break;
    }
  }
}

function findMedByName(name) {
  if (!name) return null;
  const needle = name.trim().toLowerCase();
  return (
    state.meds.find(
      (m) =>
        m.name.toLowerCase() === needle ||
        (m.aliases || []).some((a) => a.toLowerCase() === needle)
    ) || null
  );
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
      
      // Get default directions from CSV or use a default
      let directions = '';
      const contentLang = getContentLanguage(state.selectedLanguage);
      if (medData && medData.defaultDirections) {
        // Translate the abbreviation to full text in the selected language
        const abbreviation = medData.defaultDirections.trim();
        directions = translateDirections(abbreviation, contentLang);
        // Ensure we got a translated value, not the abbreviation back
        if (!directions || directions === abbreviation) {
          // If translation failed, try again with uppercase
          directions = translateDirections(abbreviation.toUpperCase(), contentLang);
        }
      } else {
        // Use a default direction based on medication type
        if (medData && (medData.type === 'eye_drop' || medData.type === 'eye_ointment')) {
          directions = translateDirections('QID', contentLang);
        }
      }
      
      // Ensure directions are not empty - if still empty, use a default
      if (!directions && medData && (medData.type === 'eye_drop' || medData.type === 'eye_ointment')) {
        directions = translateDirections('QID', contentLang);
      }
      
      // Final check - if directions is still empty or just the abbreviation, use a fallback
      if (!directions || (medData && medData.defaultDirections && directions.toUpperCase() === medData.defaultDirections.toUpperCase())) {
        directions = translateDirections(medData?.defaultDirections || 'QID', contentLang);
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
        originalFrequency: medData && medData.defaultDirections ? medData.defaultDirections : null,
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

function updateTreatmentPlanList() {
  const container = $('#treatmentPlanList');
  
  if (!container) return;
  
  const medicationsHTML = state.treatmentPlan.length === 0 
    ? '<div class="empty-state">No medications added yet.</div>'
    : state.treatmentPlan.map(med => {
        // Check if this is an eye medication
        const medData = state.medicationData[med.name];
        const isEyeMedication = medData && (medData.type === 'eye_drop' || medData.type === 'eye_ointment');
        
        return `
          <div class="treatment-plan-item">
            <div class="treatment-plan-name">${med.name}</div>
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
  
  const printView = `
    <div class="print-layout">
      <div class="print-left">
        <h2 class="print-eye-heading">${leftHeading}</h2>
        <div class="print-medications">
          ${leftDisplay}
        </div>
      </div>
      <div class="print-right">
        <h2 class="print-eye-heading">${rightHeading}</h2>
        <div class="print-medications">
          ${rightDisplay}
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

function bind() {
  const medSearchEl = $('#medSearch');
  if (medSearchEl) {
    medSearchEl.addEventListener('change', (e) => {
      const med = findMedByName(e.target.value);
      updateSelection(med);
    });
    
    medSearchEl.addEventListener('input', (e) => {
      const med = findMedByName(e.target.value);
      updateSelection(med);
      
      // Auto-scroll to matching medication in the list
      scrollToMatchingMedication(e.target.value);
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


