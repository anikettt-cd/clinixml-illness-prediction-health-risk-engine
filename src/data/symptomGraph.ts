/**
 * Clinical Symptom Knowledge Graph & Association Engine
 * Powers dynamic follow-up questioning and cross-symptom suggestions.
 */

export interface DynamicQuestion {
  id: string;
  question: string;
  type: 'duration' | 'severity' | 'nuance';
  options: { label: string; value: string; riskWeight?: number }[];
}

export interface ClinicalSymptom {
  id: string;
  name: string;
  category: 'General' | 'Head & Senses' | 'Chest & Breathing' | 'Digestive' | 'Kidneys & Urinary' | 'Body & Joints';
  description: string;
  commonAssociatedIds: {
    symptomId: string;
    reason: string;
  }[];
  questions: DynamicQuestion[];
}

export const CLINICAL_SYMPTOMS_GRAPH: Record<string, ClinicalSymptom> = {
  fever: {
    id: 'fever',
    name: 'Fever or High Temperature',
    category: 'General',
    description: 'Feeling unusually hot, feverish, or body temperature above 37.8°C (100°F).',
    commonAssociatedIds: [
      { symptomId: 'headache', reason: 'Fever causes blood vessels in the head to widen, often triggering a throbbing headache.' },
      { symptomId: 'chills', reason: 'As the body raises its setpoint temperature, you will feel shivers and chills.' },
      { symptomId: 'body_aches', reason: 'Immune chemicals (cytokines) fighting infection cause generalized muscle and joint aches.' },
      { symptomId: 'fatigue', reason: 'Your body expends intense cellular energy to fight off the infection.' },
      { symptomId: 'sore_throat', reason: 'Common respiratory viruses typically inflame the throat mucosa alongside fever.' },
    ],
    questions: [
      {
        id: 'duration',
        question: 'From how much time has this fever been happening?',
        type: 'duration',
        options: [
          { label: 'Started today (less than 24 hours)', value: '<1_day', riskWeight: 1 },
          { label: '2 to 3 days', value: '2_3_days', riskWeight: 2 },
          { label: '4 to 7 days (about a week)', value: '4_7_days', riskWeight: 3 },
          { label: 'More than a week (persistent fever)', value: '>1_week', riskWeight: 4 },
        ],
      },
      {
        id: 'severity',
        question: 'How high does the fever feel or measure?',
        type: 'severity',
        options: [
          { label: 'Mild warmth (around 37.5°C - 38.0°C / 99.5°F - 100.4°F)', value: 'mild', riskWeight: 1 },
          { label: 'Moderate fever (38.1°C - 39.0°C / 100.5°F - 102.2°F)', value: 'moderate', riskWeight: 2 },
          { label: 'High fever (above 39.0°C / 102.2°F)', value: 'severe', riskWeight: 4 },
        ],
      },
      {
        id: 'nuance',
        question: 'Do you feel any sudden shivering or shaking chills?',
        type: 'nuance',
        options: [
          { label: 'No chills', value: 'no' },
          { label: 'Mild shivers', value: 'mild_chills' },
          { label: 'Severe teeth-chattering rigors', value: 'severe_rigors', riskWeight: 3 },
        ],
      },
    ],
  },

  headache: {
    id: 'headache',
    name: 'Headache',
    category: 'Head & Senses',
    description: 'Pain, throbbing, or pressure in the forehead, temples, back of head, or whole head.',
    commonAssociatedIds: [
      { symptomId: 'fever', reason: 'Headache accompanied by fever often indicates an active viral or bacterial infection.' },
      { symptomId: 'dizziness', reason: 'Cerebral perfusion changes or dehydration can cause both headache and lightheadedness.' },
      { symptomId: 'nausea', reason: 'Migraines, high blood pressure spikes, and systemic infections often provoke nausea.' },
      { symptomId: 'blurred_vision', reason: 'Severe tension, high blood pressure, or migraine aura can cause visual blurriness.' },
      { symptomId: 'neck_stiffness', reason: 'Tension or irritation in the cervical/meningeal nerves can cause neck tightness.' },
    ],
    questions: [
      {
        id: 'duration',
        question: 'From how much time have you had this headache?',
        type: 'duration',
        options: [
          { label: 'Started a few hours ago', value: '<6_hours', riskWeight: 1 },
          { label: 'All day today', value: '1_day', riskWeight: 1 },
          { label: '2 to 3 days', value: '2_3_days', riskWeight: 2 },
          { label: 'More than a week / ongoing daily', value: '>1_week', riskWeight: 3 },
        ],
      },
      {
        id: 'severity',
        question: 'How intense is the headache pain?',
        type: 'severity',
        options: [
          { label: 'Mild dull ache (can do normal things)', value: 'mild', riskWeight: 1 },
          { label: 'Moderate throbbing (uncomfortable, need rest)', value: 'moderate', riskWeight: 2 },
          { label: 'Severe / intense pain (hard to open eyes or function)', value: 'severe', riskWeight: 3 },
          { label: 'Sudden worst headache of my life ("thunderclap")', value: 'worst_ever', riskWeight: 5 },
        ],
      },
    ],
  },

  chest_tightness: {
    id: 'chest_tightness',
    name: 'Chest Pain or Tightness',
    category: 'Chest & Breathing',
    description: 'Sensation of squeezing, heavy pressure, fullness, or aching in the chest area.',
    commonAssociatedIds: [
      { symptomId: 'shortness_breath', reason: 'Impaired cardiac pumping or myocardial ischemia directly reduces oxygen delivery to lungs.' },
      { symptomId: 'palpitations', reason: 'Cardiac arrhythmias, fluttering, or rapid pounding heartbeats frequently co-occur.' },
      { symptomId: 'dizziness', reason: 'Drop in cardiac output or blood pressure can cause lightheadedness or faintness.' },
      { symptomId: 'fatigue', reason: 'Weakened cardiac output causes profound whole-body exhaustion with minimal exertion.' },
      { symptomId: 'arm_jaw_pain', reason: 'Referred cardiac sensory nerves can cause pain radiating to left shoulder, arm, or jaw.' },
    ],
    questions: [
      {
        id: 'duration',
        question: 'From how much time has this chest tightness been happening?',
        type: 'duration',
        options: [
          { label: 'Started recently (in the last 1-2 hours)', value: '<2_hours', riskWeight: 4 },
          { label: 'Comes and goes today', value: 'today', riskWeight: 3 },
          { label: 'Intermittent over the past 2-4 days', value: 'few_days', riskWeight: 3 },
          { label: 'Happens for weeks during walking or exertion', value: 'weeks_exertion', riskWeight: 3 },
        ],
      },
      {
        id: 'severity',
        question: 'How severe is the chest discomfort?',
        type: 'severity',
        options: [
          { label: 'Mild discomfort / dull tightness', value: 'mild', riskWeight: 2 },
          { label: 'Noticeable heavy pressure', value: 'moderate', riskWeight: 3 },
          { label: 'Severe crushing or squeezing sensation', value: 'severe', riskWeight: 5 },
        ],
      },
      {
        id: 'nuance',
        question: 'Does the chest tightness happen more when you walk or climb stairs?',
        type: 'nuance',
        options: [
          { label: 'No, happens at rest or with posture changes', value: 'at_rest' },
          { label: 'Yes, gets noticeably worse with physical exertion', value: 'exertional', riskWeight: 4 },
        ],
      },
    ],
  },

  shortness_breath: {
    id: 'shortness_breath',
    name: 'Shortness of Breath (Dyspnea)',
    category: 'Chest & Breathing',
    description: 'Feeling out of breath, unable to take a deep breath, or panting after minimal movement.',
    commonAssociatedIds: [
      { symptomId: 'chest_tightness', reason: 'Heart or lung strain frequently causes both breathlessness and chest heaviness.' },
      { symptomId: 'cough', reason: 'Bronchial irritation, respiratory infections, or fluid congestion provoke coughing.' },
      { symptomId: 'fatigue', reason: 'Low oxygenation leaves muscles starved of oxygen, causing rapid exhaustion.' },
      { symptomId: 'swelling_legs', reason: 'Fluid buildup in legs and lungs often signals heart failure or kidney fluid retention.' },
      { symptomId: 'wheezing', reason: 'Narrowed airways in asthma, bronchitis, or COPD cause audible whistling sounds.' },
    ],
    questions: [
      {
        id: 'duration',
        question: 'From how much time have you had shortness of breath?',
        type: 'duration',
        options: [
          { label: 'Started suddenly today', value: 'sudden_today', riskWeight: 4 },
          { label: 'Over the last 2 to 3 days', value: '2_3_days', riskWeight: 2 },
          { label: 'Gradually worsening over 1-2 weeks', value: 'weeks', riskWeight: 3 },
          { label: 'Ongoing for months', value: 'chronic', riskWeight: 2 },
        ],
      },
      {
        id: 'severity',
        question: 'When do you feel breathless?',
        type: 'severity',
        options: [
          { label: 'Only after strenuous exertion (fast running, heavy lifting)', value: 'heavy_exertion', riskWeight: 1 },
          { label: 'After light exertion (climbing 1 flight of stairs, fast walk)', value: 'light_exertion', riskWeight: 3 },
          { label: 'Even while resting quietly or lying flat in bed', value: 'at_rest', riskWeight: 5 },
        ],
      },
    ],
  },

  excessive_thirst: {
    id: 'excessive_thirst',
    name: 'Excessive Thirst (Polydipsia)',
    category: 'General',
    description: 'Feeling constantly thirsty and having a dry mouth even after drinking plenty of water.',
    commonAssociatedIds: [
      { symptomId: 'frequent_urination', reason: 'High blood glucose causes osmotic diuresis, flushing water out in frequent urine.' },
      { symptomId: 'blurred_vision', reason: 'Fluctuating blood sugar alters fluid balance inside the eye lenses.' },
      { symptomId: 'fatigue', reason: 'Cells cannot absorb glucose effectively, leading to starvation of energy.' },
      { symptomId: 'weight_loss', reason: 'Body burns fat and muscle stores when it cannot use insulin to absorb carbs.' },
      { symptomId: 'tingling_feet', reason: 'Elevated glucose damages small sensory nerve fibers in toes and feet.' },
    ],
    questions: [
      {
        id: 'duration',
        question: 'From how much time have you noticed this excessive thirst?',
        type: 'duration',
        options: [
          { label: 'Just noticed in the last couple of days', value: 'few_days', riskWeight: 1 },
          { label: 'For 1 to 2 weeks', value: '1_2_weeks', riskWeight: 2 },
          { label: 'For more than a month', value: '>1_month', riskWeight: 3 },
        ],
      },
      {
        id: 'severity',
        question: 'How much water or fluids are you drinking daily?',
        type: 'severity',
        options: [
          { label: 'Slightly more than usual (2-3 liters)', value: 'mild', riskWeight: 1 },
          { label: 'Constantly thirsty, drinking 4 to 6+ liters per day', value: 'severe', riskWeight: 3 },
        ],
      },
    ],
  },

  frequent_urination: {
    id: 'frequent_urination',
    name: 'Frequent Urination (Polyuria)',
    category: 'Kidneys & Urinary',
    description: 'Needing to pee much more often than normal, especially waking up multiple times at night.',
    commonAssociatedIds: [
      { symptomId: 'excessive_thirst', reason: 'The body tries to excrete excess sugar or wastes through constant urination.' },
      { symptomId: 'fatigue', reason: 'Broken sleep from night urination plus metabolic shifts causes deep fatigue.' },
      { symptomId: 'foamy_urine', reason: 'Kidneys filtering high volume may leak albumin proteins causing bubbles.' },
      { symptomId: 'blurred_vision', reason: 'Dehydration from frequent urination pulls fluid from tissues including the eyes.' },
    ],
    questions: [
      {
        id: 'duration',
        question: 'From how much time has this been happening?',
        type: 'duration',
        options: [
          { label: 'A few days', value: 'few_days', riskWeight: 1 },
          { label: '1 to 3 weeks', value: 'weeks', riskWeight: 2 },
          { label: 'More than a month', value: 'months', riskWeight: 3 },
        ],
      },
      {
        id: 'nuance',
        question: 'How many times do you wake up at night to urinate?',
        type: 'nuance',
        options: [
          { label: '0 to 1 time', value: 'normal' },
          { label: '2 to 3 times', value: 'moderate_night', riskWeight: 2 },
          { label: '4 or more times every night', value: 'severe_night', riskWeight: 4 },
        ],
      },
    ],
  },

  swelling_legs: {
    id: 'swelling_legs',
    name: 'Swelling in Legs, Ankles, or Feet (Edema)',
    category: 'Kidneys & Urinary',
    description: 'Puffy swelling where socks leave deep ring indentations, or heavy feeling in legs.',
    commonAssociatedIds: [
      { symptomId: 'shortness_breath', reason: 'Fluid retaining in extremities can also pool in the lungs (pulmonary congestion).' },
      { symptomId: 'foamy_urine', reason: 'Protein loss in kidney disease lowers blood albumin, allowing fluid to leak into tissues.' },
      { symptomId: 'fatigue', reason: 'Poor cardiac pumping or renal function causes systemic sluggishness.' },
      { symptomId: 'weight_gain_sudden', reason: 'Retaining liters of excess fluid causes rapid unexplained weight jumps.' },
    ],
    questions: [
      {
        id: 'duration',
        question: 'From how much time has this swelling been present?',
        type: 'duration',
        options: [
          { label: 'Just noticed today or yesterday', value: 'recent', riskWeight: 2 },
          { label: 'Over the past 1 to 2 weeks', value: 'weeks', riskWeight: 3 },
          { label: 'Ongoing for months', value: 'chronic', riskWeight: 2 },
        ],
      },
      {
        id: 'nuance',
        question: 'Is the swelling in one leg or both legs?',
        type: 'nuance',
        options: [
          { label: 'Both legs equally (bilateral)', value: 'both_legs', riskWeight: 2 },
          { label: 'One leg only with pain/redness (unilateral)', value: 'one_leg_painful', riskWeight: 4 },
        ],
      },
    ],
  },

  cough: {
    id: 'cough',
    name: 'Cough',
    category: 'Chest & Breathing',
    description: 'Dry hacking cough or wet cough producing phlegm or mucus.',
    commonAssociatedIds: [
      { symptomId: 'fever', reason: 'Cough combined with fever points to respiratory infection like bronchitis or pneumonia.' },
      { symptomId: 'sore_throat', reason: 'Post-nasal drip and viral pharyngitis commonly cause both throat pain and coughing.' },
      { symptomId: 'shortness_breath', reason: 'Airway inflammation or fluid in alveoli restricts air movement.' },
      { symptomId: 'chest_tightness', reason: 'Repeated coughing spasms or pleurisy causes chest wall soreness.' },
      { symptomId: 'fatigue', reason: 'Coughing disrupts restful sleep and requires continuous muscular effort.' },
    ],
    questions: [
      {
        id: 'duration',
        question: 'From how much time have you had this cough?',
        type: 'duration',
        options: [
          { label: '1 to 3 days', value: '1_3_days', riskWeight: 1 },
          { label: '4 to 7 days', value: '1_week', riskWeight: 2 },
          { label: '2 to 3 weeks (lingering cough)', value: '2_3_weeks', riskWeight: 3 },
          { label: 'More than a month (chronic cough)', value: '>1_month', riskWeight: 3 },
        ],
      },
      {
        id: 'nuance',
        question: 'What kind of cough is it?',
        type: 'nuance',
        options: [
          { label: 'Dry / tickly with no mucus', value: 'dry' },
          { label: 'Wet cough with clear or white phlegm', value: 'wet_clear' },
          { label: 'Wet cough with yellow or green thick phlegm', value: 'wet_colored', riskWeight: 2 },
          { label: 'Coughing up traces of blood', value: 'blood_tinged', riskWeight: 5 },
        ],
      },
    ],
  },

  fatigue: {
    id: 'fatigue',
    name: 'Extreme Fatigue & Weakness',
    category: 'General',
    description: 'Severe lack of energy, feeling drained, or struggling to complete usual daily activities.',
    commonAssociatedIds: [
      { symptomId: 'fever', reason: 'Infections rapidly drain cellular ATP reserves.' },
      { symptomId: 'headache', reason: 'Exhaustion, sleep deprivation, or dehydration commonly trigger headaches.' },
      { symptomId: 'body_aches', reason: 'Systemic inflammation weakens muscles and creates generalized soreness.' },
      { symptomId: 'excessive_thirst', reason: 'Uncontrolled blood sugar starves cells of energy, resulting in chronic fatigue.' },
      { symptomId: 'shortness_breath', reason: 'Poor cardiac or pulmonary function deprives body tissues of essential oxygen.' },
    ],
    questions: [
      {
        id: 'duration',
        question: 'From how much time have you been feeling this fatigue?',
        type: 'duration',
        options: [
          { label: 'Started in the last 2-3 days', value: 'recent', riskWeight: 1 },
          { label: 'Last 1 to 2 weeks', value: 'weeks', riskWeight: 2 },
          { label: 'Ongoing for over a month', value: 'chronic', riskWeight: 3 },
        ],
      },
    ],
  },

  dizziness: {
    id: 'dizziness',
    name: 'Dizziness or Lightheadedness',
    category: 'Head & Senses',
    description: 'Feeling faint, unsteady, or like the room is spinning when standing up.',
    commonAssociatedIds: [
      { symptomId: 'headache', reason: 'Inner ear disturbances, dehydration, or blood pressure drops induce both symptoms.' },
      { symptomId: 'palpitations', reason: 'Irregular or rapid heart beats lead to temporary drops in brain blood flow.' },
      { symptomId: 'chest_tightness', reason: 'Hemodynamic compromise or coronary ischemia causes lightheadedness.' },
      { symptomId: 'fatigue', reason: 'Anemia, low blood pressure, or chronic illness manifests as weakness and dizziness.' },
    ],
    questions: [
      {
        id: 'duration',
        question: 'From how much time has this dizziness been happening?',
        type: 'duration',
        options: [
          { label: 'Just had an episode today', value: 'today', riskWeight: 2 },
          { label: 'Off and on for a few days', value: 'few_days', riskWeight: 2 },
          { label: 'Happens daily for weeks', value: 'weeks', riskWeight: 3 },
        ],
      },
    ],
  },

  // Supporting associated symptoms
  chills: {
    id: 'chills',
    name: 'Chills or Shivering',
    category: 'General',
    description: 'Sudden feeling of cold accompanied by involuntary shivering or goosebumps.',
    commonAssociatedIds: [
      { symptomId: 'fever', reason: 'Chills directly precede or accompany rapid spikes in internal body temperature.' },
      { symptomId: 'body_aches', reason: 'Muscle contractions from shivering cause sore aching muscles.' },
      { symptomId: 'fatigue', reason: 'Shivering exhausts metabolic energy reserves.' },
    ],
    questions: [
      {
        id: 'duration',
        question: 'How long have you been experiencing chills?',
        type: 'duration',
        options: [
          { label: 'Started today', value: 'today', riskWeight: 1 },
          { label: 'Past 2 to 3 days', value: 'few_days', riskWeight: 2 },
        ],
      },
    ],
  },

  body_aches: {
    id: 'body_aches',
    name: 'Body Aches & Muscle Soreness',
    category: 'Body & Joints',
    description: 'Generalized dull aching in back, legs, arms, and joints without heavy workouts.',
    commonAssociatedIds: [
      { symptomId: 'fever', reason: 'Systemic immune response triggers myalgia across skeletal muscles.' },
      { symptomId: 'headache', reason: 'Viral infection creates concurrent cranial and somatic aching.' },
      { symptomId: 'fatigue', reason: 'Inflammation causes both deep exhaustion and tender muscle fibers.' },
    ],
    questions: [
      {
        id: 'duration',
        question: 'From how much time have your muscles been aching?',
        type: 'duration',
        options: [
          { label: '1 to 2 days', value: '1_2_days', riskWeight: 1 },
          { label: '3 to 7 days', value: 'few_days', riskWeight: 2 },
          { label: 'More than 2 weeks', value: 'weeks', riskWeight: 3 },
        ],
      },
    ],
  },

  sore_throat: {
    id: 'sore_throat',
    name: 'Sore Throat',
    category: 'Head & Senses',
    description: 'Scratchiness, pain, or difficulty swallowing in the throat.',
    commonAssociatedIds: [
      { symptomId: 'fever', reason: 'Infection of tonsils or pharynx frequently triggers fever.' },
      { symptomId: 'cough', reason: 'Throat irritation triggers involuntary reflex coughing.' },
      { symptomId: 'headache', reason: 'Upper airway congestion creates tension in sinuses and head.' },
    ],
    questions: [
      {
        id: 'duration',
        question: 'How many days have you had this sore throat?',
        type: 'duration',
        options: [
          { label: '1 to 2 days', value: '1_2_days', riskWeight: 1 },
          { label: '3 to 5 days', value: 'few_days', riskWeight: 2 },
          { label: 'Over a week', value: 'week', riskWeight: 3 },
        ],
      },
    ],
  },

  palpitations: {
    id: 'palpitations',
    name: 'Heart Palpitations or Fluttering',
    category: 'Chest & Breathing',
    description: 'Sensations of racing, pounding, skipping beats, or fluttering in the chest.',
    commonAssociatedIds: [
      { symptomId: 'chest_tightness', reason: 'Cardiac arrhythmias frequently cause tightness and discomfort.' },
      { symptomId: 'shortness_breath', reason: 'Rapid inefficient beating reduces cardiac stroke volume, causing air hunger.' },
      { symptomId: 'dizziness', reason: 'Drops in blood pressure during palpitations cause dizziness.' },
    ],
    questions: [
      {
        id: 'duration',
        question: 'When do these palpitations occur?',
        type: 'duration',
        options: [
          { label: 'Occasional brief flutters (a few seconds)', value: 'brief', riskWeight: 1 },
          { label: 'Lasts several minutes at a time', value: 'minutes', riskWeight: 3 },
          { label: 'Sustained racing for hours', value: 'sustained', riskWeight: 5 },
        ],
      },
    ],
  },

  foamy_urine: {
    id: 'foamy_urine',
    name: 'Foamy or Bubbling Urine',
    category: 'Kidneys & Urinary',
    description: 'Thick persistent white foam or bubbles in the toilet bowl that do not flush away easily.',
    commonAssociatedIds: [
      { symptomId: 'swelling_legs', reason: 'Protein leakage through damaged kidney glomeruli leads to fluid swelling in ankles.' },
      { symptomId: 'fatigue', reason: 'Kidney dysfunction causes toxin accumulation and anemia.' },
      { symptomId: 'frequent_urination', reason: 'Changes in renal concentration ability lead to nocturia.' },
    ],
    questions: [
      {
        id: 'duration',
        question: 'From how much time have you noticed foamy urine?',
        type: 'duration',
        options: [
          { label: 'Just noticed recently (past few days)', value: 'few_days', riskWeight: 2 },
          { label: 'Consistently for 2 or more weeks', value: 'weeks', riskWeight: 4 },
        ],
      },
    ],
  },

  nausea: {
    id: 'nausea',
    name: 'Nausea or Upset Stomach',
    category: 'Digestive',
    description: 'Feeling sick to your stomach, queasiness, or urge to vomit.',
    commonAssociatedIds: [
      { symptomId: 'headache', reason: 'Migraines, high intracranial pressure, or vestibular imbalance trigger nausea.' },
      { symptomId: 'fever', reason: 'Gastroenteritis and systemic infections provoke gastric distress.' },
      { symptomId: 'dizziness', reason: 'Inner ear disturbances cause simultaneous vertigo and nausea.' },
    ],
    questions: [
      {
        id: 'duration',
        question: 'How long have you had this nausea?',
        type: 'duration',
        options: [
          { label: 'Started today', value: 'today', riskWeight: 1 },
          { label: '2 to 3 days', value: 'few_days', riskWeight: 2 },
          { label: 'More than a week', value: 'week', riskWeight: 3 },
        ],
      },
    ],
  },

  blurred_vision: {
    id: 'blurred_vision',
    name: 'Blurred or Hazy Vision',
    category: 'Head & Senses',
    description: 'Difficulty focusing eyes, fuzzy eyesight, or intermittent blurring.',
    commonAssociatedIds: [
      { symptomId: 'excessive_thirst', reason: 'High blood glucose alters osmotic fluid balance in the lens of the eye.' },
      { symptomId: 'headache', reason: 'Hypertension crisis or migraine aura manifests with visual disturbance.' },
      { symptomId: 'dizziness', reason: 'Low blood flow to optic and cerebral centers causes faintness with blurred sight.' },
    ],
    questions: [
      {
        id: 'duration',
        question: 'When did your vision become blurred?',
        type: 'duration',
        options: [
          { label: 'Started suddenly today', value: 'sudden', riskWeight: 4 },
          { label: 'Gradually over the past few weeks', value: 'gradual', riskWeight: 2 },
        ],
      },
    ],
  },
};

export const COMMON_SYMPTOMS_LIST = Object.values(CLINICAL_SYMPTOMS_GRAPH);
