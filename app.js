const state = {
  meds: [],
  selected: null,
  treatmentPlan: [],
  selectedEye: null,
  medicationData: {}, // Will store CSV data: {medicationName: {type, directions, sideEffects}}
  translations: {}, // Will store translation data
  selectedLanguage: 'english'
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
        state.translations[english.toLowerCase()] = {
          english: english,
          spanish: spanish,
          chinese: chinese,
          simple: simple
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
  
  if (translation && translation[language]) {
    return translation[language];
  }
  
  return text;
}

function translateDirections(directions, language) {
  if (!directions || language === 'english') return directions;
  
  // First try to translate the entire phrase
  const fullTranslation = state.translations[directions.toLowerCase()];
  if (fullTranslation && fullTranslation[language]) {
    return fullTranslation[language];
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
    const languageMap = {
      'spanish': 'es',
      'chinese': 'zh',
      'simple': 'en' // Simple mode stays in English
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
    const eyeSelection = document.querySelector('.eye-selection');
    const eyeSelectionLabel = document.querySelector('label[for="eye-selection"], label:has(+ .eye-selection)');
    
    if (eyeSelection) {
      if (medData.type === 'eye_drop' || medData.type === 'eye_ointment') {
        eyeSelection.style.display = 'flex';
        // Show the label
        if (eyeSelectionLabel) {
          eyeSelectionLabel.style.display = 'block';
        }
      } else {
        eyeSelection.style.display = 'none';
        // Hide the label
        if (eyeSelectionLabel) {
          eyeSelectionLabel.style.display = 'none';
        }
      }
    }
  } else {
    // No CSV data found, hide eye selection by default
    const eyeSelection = document.querySelector('.eye-selection');
    const eyeSelectionLabel = document.querySelector('label[for="eye-selection"], label:has(+ .eye-selection)');
    
    if (eyeSelection) {
      eyeSelection.style.display = 'none';
    }
    // Hide the label
    if (eyeSelectionLabel) {
      eyeSelectionLabel.style.display = 'none';
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
  const translatedDirections = translateDirections(directions.trim(), state.selectedLanguage);
  return translatedDirections;
}

function selectEye(eye) {
  state.selectedEye = eye;
  
  // Update button visual states
  const eyeButtons = document.querySelectorAll('.eye-btn');
  eyeButtons.forEach(btn => {
    btn.classList.remove('selected');
    if (btn.dataset.eye === eye) {
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



function addMedicationToPlan() {
  if (!state.selected) {
    alert('Please select a medication first.');
    return;
  }

  const directions = getDirectionsFromForm();
  const notes = $('#notes').value.trim();

  if (!directions && !notes) {
    alert('Please add at least directions or notes before adding the medication.');
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
    notes: notes,
    selectedEye: state.selectedEye,
    sideEffects: sideEffects,
    // Store original form data for re-translation
    originalDose: $('#dose')?.value?.trim(),
    originalFrequency: $('#frequency')?.value?.trim(),
    originalCustomHours: $('#customHours')?.value?.trim(),
    originalOtherDirections: $('#otherDirections')?.value?.trim()
  };

  state.treatmentPlan.push(medication);
  updateHandoutDisplay();
  clearMedicationForm();
  persist();
}

function removeMedicationFromPlan(id) {
  state.treatmentPlan = state.treatmentPlan.filter(med => med.id !== id);
  updateHandoutDisplay();
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
  updateHandoutDisplay();
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
          ${med.notes ? `<div><strong>Notes:</strong> ${med.notes}</div>` : ''}
        </div>
      </div>
    `).join('');
  }
}

async function updateHandoutDisplay() {
  const container = $('#handoutContent');
  
  if (state.treatmentPlan.length === 0) {
    container.innerHTML = '<div class="empty-handout"><p>Add medications to see your treatment plan here.</p></div>';
    return;
  }

  // Show loading indicator if translating notes
  if (state.selectedLanguage !== 'english') {
    container.innerHTML = '<div class="loading">Translating...</div>';
  }
  
  // Process each medication with async translation
  const medicationHTMLs = await Promise.all(state.treatmentPlan.map(async med => {
    // Reconstruct directions from original form data and translate
    const translatedDirections = med.originalDose !== undefined ? 
      reconstructDirectionsFromOriginal(med, state.selectedLanguage) : 
      med.directions;
    
    // Translate notes with AI if needed
    const translatedNotes = med.notes ? 
      await translateNotesWithAI(med.notes, state.selectedLanguage) : 
      '';
    
    return `
    <div class="handout-medication">
      <div class="handout-header">
        <img src="${med.image}" alt="${med.name}" />
        <div class="handout-content-right">
          <div class="handout-med">${med.name}</div>
          
          ${translatedDirections ? `
            <div class="handout-block">
              <div class="block-title">Directions:</div>
              <div class="block-body">${translatedDirections}</div>
            </div>
          ` : ''}
          
          ${translatedNotes ? `
            <div class="handout-block">
              <div class="block-title">Notes:</div>
              <div class="block-body">${translatedNotes}</div>
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
  }));
  
  container.innerHTML = medicationHTMLs.join('');
}

function clearMedicationForm() {
  const medSearchEl = $('#medSearch');
  const notesEl = $('#notes');

  if (medSearchEl) {
    medSearchEl.value = '';
  }
  if (notesEl) {
    notesEl.value = '';
  }
  
  // Clear visual selection in medication list
  const medButtons = document.querySelectorAll('.med-button');
  medButtons.forEach(btn => {
    btn.classList.remove('selected');
  });
  
  // Clear form fields and reset eye selection
  clearFormFields();
  
  // Hide eye selection by default
  const eyeSelection = document.querySelector('.eye-selection');
  const eyeSelectionLabel = document.querySelector('label[for="eye-selection"], label:has(+ .eye-selection)');
  
  if (eyeSelection) {
    eyeSelection.style.display = 'none';
  }
  // Hide the label
  if (eyeSelectionLabel) {
    eyeSelectionLabel.style.display = 'none';
  }
  
  updateSelection(null);
}

function clearAll() {
  state.treatmentPlan = [];
  updateHandoutDisplay();
  clearMedicationForm();
  try {
    localStorage.removeItem('handoutDraft');
  } catch {}
}

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
  
  const clearBtn = $('#clearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearAll);
  }

  const printBtn = $('#printBtn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      if (state.treatmentPlan.length === 0) {
        if (!confirm('No medications in treatment plan. Print anyway?')) return;
      }
      window.print();
    });
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
  if (languageSelect) {
    languageSelect.addEventListener('change', async (e) => {
      state.selectedLanguage = e.target.value;
      // Update existing treatment plan with new language (including AI translation)
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
});


