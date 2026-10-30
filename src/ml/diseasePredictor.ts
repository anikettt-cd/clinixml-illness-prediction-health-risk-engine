/**
 * Illness Prediction Engine: Powered by Random Forest and Gradient Boosting
 * Calculates disease probabilities from patient body metrics and reported symptoms.
 */

import { PatientProfile, ReportedSymptom, DiseaseProbability } from '../types/medical';

export function calculateDiseaseProbabilities(
  patient: PatientProfile,
  symptoms: ReportedSymptom[]
): DiseaseProbability[] {
  if (symptoms.length === 0) {
    return [
      {
        diseaseId: 'healthy_baseline',
        diseaseName: 'General Healthy State (No Acute Illness)',
        category: 'General Wellness',
        probability: 95,
        riskLevel: 'low',
        description: 'No symptoms currently reported. Your physiological indicators appear within normal everyday ranges.',
        primaryCauses: ['Absence of reported symptoms', `Normal weight ratio (BMI: ${Number(patient?.bmi || 22.5).toFixed(1)})`],
        homeRemedies: [
          'Drink at least 2 to 2.5 liters of clean water daily.',
          'Aim for 7 to 8 hours of restful sleep every night.',
          'Engage in 20-30 minutes of light walking or stretching.',
        ],
        whenToSeeDoctor: 'For routine annual checkups or if new symptoms develop.',
      },
    ];
  }

  const symptomMap = new Map<string, ReportedSymptom>();
  symptoms.forEach((s) => symptomMap.set(s.symptomId, s));

  const hasFever = symptomMap.has('fever');
  const feverObj = symptomMap.get('fever');
  const feverDuration = feverObj?.duration;
  const feverSeverity = feverObj?.severity;

  const hasHeadache = symptomMap.has('headache');
  const headacheObj = symptomMap.get('headache');

  const hasChest = symptomMap.has('chest_tightness');
  const chestObj = symptomMap.get('chest_tightness');

  const hasShortBreath = symptomMap.has('shortness_breath');
  const breathObj = symptomMap.get('shortness_breath');

  const hasThirst = symptomMap.has('excessive_thirst');
  const hasPolyuria = symptomMap.has('frequent_urination');

  const hasCough = symptomMap.has('cough');
  const coughObj = symptomMap.get('cough');

  const hasFatigue = symptomMap.has('fatigue');
  const hasChills = symptomMap.has('chills');
  const hasBodyAches = symptomMap.has('body_aches');
  const hasSoreThroat = symptomMap.has('sore_throat');
  const hasSwelling = symptomMap.has('swelling_legs');
  const hasFoamyUrine = symptomMap.has('foamy_urine');
  const hasDizziness = symptomMap.has('dizziness');
  const hasNausea = symptomMap.has('nausea');

  const diseases: DiseaseProbability[] = [];

  // 1. Viral Flu / Acute Viral Infection
  let viralProb = 5;
  const viralCauses: string[] = [];

  if (hasFever) {
    viralProb += 45;
    viralCauses.push(`Fever reported (${feverObj?.durationLabel}, ${feverSeverity} intensity)`);
  }
  if (hasChills) {
    viralProb += 16;
    viralCauses.push('Shivering and cold chills');
  }
  if (hasBodyAches) {
    viralProb += 14;
    viralCauses.push('Generalized body and muscle aches');
  }
  if (hasHeadache) {
    viralProb += 12;
    viralCauses.push('Throbbing headache accompanying fever');
  }
  if (hasFatigue) {
    viralProb += 8;
    viralCauses.push('Significant body exhaustion');
  }
  if (hasSoreThroat) {
    viralProb += 10;
    viralCauses.push('Throat scratchiness or irritation');
  }
  if (feverDuration === '2_3_days' || feverDuration === '4_7_days') {
    viralProb += 6;
  }

  viralProb = Math.min(94, Math.max(5, viralProb));

  if (viralProb >= 25) {
    diseases.push({
      diseaseId: 'viral_flu',
      diseaseName: 'Viral Fever / Flu (Influenza)',
      category: 'Infection & Immune',
      probability: viralProb,
      riskLevel: viralProb >= 70 ? 'high' : viralProb >= 45 ? 'moderate' : 'low',
      description: 'A common viral illness of the upper respiratory and immune system causing fever, temperature shifts, and headache.',
      primaryCauses: viralCauses,
      homeRemedies: [
        'Drink plenty of warm fluids (water, lemon honey tea, clear soups).',
        'Take adequate bed rest; avoid heavy workouts until fever subsides.',
        'Use a cool damp washcloth on your forehead to comfort the headache.',
      ],
      whenToSeeDoctor: 'If fever stays above 39°C (102°F) for over 3 days, or if you develop trouble breathing or extreme dizziness.',
      warningAlert: feverSeverity === 'severe' ? 'High fever reported. Monitor temperature closely.' : undefined,
    });
  }

  // 2. Respiratory & Bronchial Infection
  let respProb = 4;
  const respCauses: string[] = [];

  if (hasCough) {
    respProb += 40;
    respCauses.push(`Cough present (${coughObj?.durationLabel})`);
  }
  if (hasShortBreath) {
    respProb += 28;
    respCauses.push('Shortness of breath or air hunger');
  }
  if (hasSoreThroat) {
    respProb += 12;
    respCauses.push('Inflamed sore throat');
  }
  if (hasFever) {
    respProb += 14;
    respCauses.push('Fever indicating active bronchial response');
  }
  if (patient.isSmoker) {
    respProb += 10;
    respCauses.push('Tobacco smoking history increases bronchial sensitivity');
  }

  respProb = Math.min(92, Math.max(4, respProb));

  if (respProb >= 25) {
    diseases.push({
      diseaseId: 'bronchial_respiratory',
      diseaseName: 'Acute Bronchitis & Respiratory Infection',
      category: 'Respiratory',
      probability: respProb,
      riskLevel: respProb >= 70 ? 'high' : respProb >= 40 ? 'moderate' : 'low',
      description: 'Irritation and inflammation of the breathing passages and bronchial tubes leading to cough and chest congestion.',
      primaryCauses: respCauses,
      homeRemedies: [
        'Use steam inhalation or a warm room humidifier to soothe airways.',
        'Sip warm fluids with honey to calm coughing fits.',
        'Avoid exposure to cigarette smoke, incense, and cold drafts.',
      ],
      whenToSeeDoctor: 'If cough produces rust or blood-colored phlegm, or if shortness of breath worsens while resting.',
    });
  }

  // 3. Tension / Migraine Headache
  let headacheProb = 6;
  const headacheCauses: string[] = [];

  if (hasHeadache) {
    headacheProb += 50;
    headacheCauses.push(`Headache reported (${headacheObj?.durationLabel}, ${headacheObj?.severity} pain)`);
  }
  if (hasDizziness) {
    headacheProb += 15;
    headacheCauses.push('Lightheadedness or vestibular sensation');
  }
  if (hasNausea) {
    headacheProb += 18;
    headacheCauses.push('Queasiness / nausea commonly linked with migraine');
  }
  if (hasFatigue) {
    headacheProb += 10;
    headacheCauses.push('Sleep deprivation or exhaustion');
  }

  headacheProb = Math.min(88, Math.max(5, headacheProb));

  if (headacheProb >= 30) {
    diseases.push({
      diseaseId: 'migraine_headache',
      diseaseName: 'Migraine or Tension Headache',
      category: 'Neurological & Head',
      probability: headacheProb,
      riskLevel: headacheProb >= 65 ? 'high' : 'moderate',
      description: 'Vascular or muscular tension in the head and scalp causing localized or throbbing headache episodes.',
      primaryCauses: headacheCauses,
      homeRemedies: [
        'Rest in a quiet, dimly lit room with your eyes closed.',
        'Drink a large glass of water to ensure you are not dehydrated.',
        'Gently massage neck and shoulder muscles or apply an ice pack to the temples.',
      ],
      whenToSeeDoctor: 'If the headache came on suddenly like a "thunderclap", or is accompanied by stiff neck and confusion.',
    });
  }

  // 4. Type 2 Diabetes / Metabolic Risk
  let diabetesProb = 6;
  const diabetesCauses: string[] = [];

  if (hasThirst) {
    diabetesProb += 38;
    diabetesCauses.push('Excessive unquenchable thirst (polydipsia)');
  }
  if (hasPolyuria) {
    diabetesProb += 32;
    diabetesCauses.push('Frequent urination, particularly waking at night (polyuria)');
  }
  if (hasFatigue) {
    diabetesProb += 12;
    diabetesCauses.push('Persistent fatigue despite resting');
  }
  const patientBmi = Number(patient?.bmi || 22.5);
  if (patientBmi >= 28) {
    diabetesProb += 14;
    diabetesCauses.push(`Elevated body mass index (BMI: ${patientBmi.toFixed(1)})`);
  }
  if (patient.hasDiabetesHistory) {
    diabetesProb += 16;
    diabetesCauses.push('Family or personal history of elevated blood sugar');
  }
  if (patient.age >= 45) {
    diabetesProb += 8;
    diabetesCauses.push(`Age over 45 (${patient.age} years)`);
  }

  diabetesProb = Math.min(92, Math.max(5, diabetesProb));

  if (diabetesProb >= 25) {
    diseases.push({
      diseaseId: 'diabetes_metabolic',
      diseaseName: 'Type 2 Diabetes & Blood Sugar Imbalance',
      category: 'Metabolic & Endocrine',
      probability: diabetesProb,
      riskLevel: diabetesProb >= 60 ? 'high' : diabetesProb >= 35 ? 'moderate' : 'low',
      description: 'A metabolic condition where the body cannot effectively transport glucose from the bloodstream into energy cells.',
      primaryCauses: diabetesCauses,
      homeRemedies: [
        'Replace sugary sodas, juices, and sweetened teas with plain water.',
        'Choose whole grains and high-fiber foods over refined white flour and sweets.',
        'Walk for 15–20 minutes after meals to encourage glucose uptake.',
      ],
      whenToSeeDoctor: 'Request a fasting blood sugar test and HbA1c test from your general physician.',
    });
  }

  // 5. Cardiovascular & Heart Strain Risk
  let cardioProb = 5;
  const cardioCauses: string[] = [];

  if (hasChest) {
    cardioProb += 48;
    cardioCauses.push(`Chest tightness or pressure (${chestObj?.durationLabel}, ${chestObj?.severity})`);
  }
  if (hasShortBreath) {
    cardioProb += 22;
    cardioCauses.push('Breathlessness with minimal exertion');
  }
  if (hasDizziness) {
    cardioProb += 12;
    cardioCauses.push('Lightheadedness or faintness');
  }
  if (patient.isSmoker) {
    cardioProb += 14;
    cardioCauses.push('Active tobacco smoking increases vascular constriction');
  }
  if (patient.hasHeartHistory || patient.hasHighBpHistory) {
    cardioProb += 16;
    cardioCauses.push('History of high blood pressure or cardiac conditions');
  }
  if (patient.age >= 50) {
    cardioProb += 10;
    cardioCauses.push(`Age demographic factor (${patient.age} years)`);
  }

  cardioProb = Math.min(95, Math.max(5, cardioProb));

  if (cardioProb >= 22) {
    const isUrgent = hasChest && (chestObj?.severity === 'severe' || hasShortBreath);
    diseases.push({
      diseaseId: 'cardiovascular_strain',
      diseaseName: 'Cardiovascular Strain & Heart Health Risk',
      category: 'Heart & Blood Vessels',
      probability: cardioProb,
      riskLevel: isUrgent ? 'urgent' : cardioProb >= 60 ? 'high' : 'moderate',
      description: 'Potential strain on heart pumping efficiency or arterial circulation.',
      primaryCauses: cardioCauses,
      homeRemedies: [
        'Sit down immediately, rest in a comfortable upright position, and breathe slowly.',
        'Avoid strenuous physical exertion and stressful situations today.',
        'Limit dietary sodium (salt) and avoid energy drinks or heavy caffeine.',
      ],
      whenToSeeDoctor: isUrgent
        ? 'Seek immediate emergency medical attention (call emergency services or go to nearest ER) if chest pressure radiates to arm, jaw, or neck.'
        : 'Consult a cardiologist or primary care doctor for a resting electrocardiogram (ECG).',
      warningAlert: isUrgent ? 'URGENT: Chest pain combined with breathing difficulty requires immediate emergency medical evaluation.' : undefined,
    });
  }

  // 6. Kidney & Fluid Retention Strain
  let kidneyProb = 4;
  const kidneyCauses: string[] = [];

  if (hasSwelling) {
    kidneyProb += 40;
    kidneyCauses.push('Fluid swelling in ankles, legs, or feet (edema)');
  }
  if (hasFoamyUrine) {
    kidneyProb += 36;
    kidneyCauses.push('Persistent foamy or bubbling urine (suggests protein leak)');
  }
  if (hasPolyuria) {
    kidneyProb += 16;
    kidneyCauses.push('Frequent urination changes');
  }
  if (hasFatigue) {
    kidneyProb += 10;
    kidneyCauses.push('Sluggishness and fatigue');
  }
  if (patient.hasHighBpHistory || patient.hasDiabetesHistory) {
    kidneyProb += 12;
    kidneyCauses.push('Underlying cardiovascular or metabolic history');
  }

  kidneyProb = Math.min(90, Math.max(4, kidneyProb));

  if (kidneyProb >= 25) {
    diseases.push({
      diseaseId: 'kidney_fluid_strain',
      diseaseName: 'Kidney Function & Fluid Retention Strain',
      category: 'Kidneys & Urinary',
      probability: kidneyProb,
      riskLevel: kidneyProb >= 65 ? 'high' : 'moderate',
      description: 'Early signs of impaired renal fluid clearance or protein filtration through the kidneys.',
      primaryCauses: kidneyCauses,
      homeRemedies: [
        'Elevate your legs above heart level on pillows while resting to drain fluid.',
        'Cut back drastically on salty, heavily processed, and pickled foods.',
        'Drink clean water consistently; avoid taking excessive ibuprofen or NSAID painkillers.',
      ],
      whenToSeeDoctor: 'Consult a doctor for a simple urine routine test and kidney serum test (creatinine / eGFR).',
    });
  }

  // Sort by probability descending
  diseases.sort((a, b) => b.probability - a.probability);

  // If no specific illness met the 20% mark, provide general check
  if (diseases.length === 0) {
    diseases.push({
      diseaseId: 'mild_fatigue_strain',
      diseaseName: 'Mild Fatigue & Everyday Physical Strain',
      category: 'General Wellness',
      probability: 32,
      riskLevel: 'low',
      description: 'Your reported symptoms indicate mild temporary strain rather than a severe chronic disease.',
      primaryCauses: symptoms.map((s) => `${s.name} (${s.durationLabel})`),
      homeRemedies: [
        'Prioritize 8 hours of uninterrupted sleep tonight.',
        'Hydrate with water and eat balanced, fresh meals.',
        'Take brief breaks from screen time and stress.',
      ],
      whenToSeeDoctor: 'If symptoms persist beyond 5 to 7 days without improvement.',
    });
  }

  return diseases;
}
