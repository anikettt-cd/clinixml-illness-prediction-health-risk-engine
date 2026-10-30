/**
 * Patient Health Profile & Illness Prediction Types
 * Simplified for everyday patient use without medical jargon.
 */

export type RiskUrgency = 'low' | 'moderate' | 'high' | 'urgent';

export interface PatientProfile {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  weightKg: number;
  heightCm: number;
  bmi: number;
  isSmoker: boolean;
  hasDiabetesHistory: boolean;
  hasHeartHistory: boolean;
  hasHighBpHistory: boolean;
  medicationsSummary?: string;
  createdAt: string;
}

export interface ReportedSymptom {
  symptomId: string;
  name: string;
  duration: '<1_day' | '2_3_days' | '4_7_days' | '>1_week' | '>1_month';
  durationLabel: string;
  severity: 'mild' | 'moderate' | 'severe';
  severityLabel: string;
  nuanceAnswer?: string;
}

export interface DiseaseProbability {
  diseaseId: string;
  diseaseName: string;
  category: string;
  probability: number; // 0 to 100
  riskLevel: RiskUrgency;
  description: string;
  primaryCauses: string[];
  homeRemedies: string[];
  whenToSeeDoctor: string;
  warningAlert?: string;
}

export interface HealthCheckRecord {
  id: string;
  patientId: string;
  timestamp: string;
  formattedDate: string;
  reportedSymptoms: ReportedSymptom[];
  predictions: DiseaseProbability[];
  topDisease: DiseaseProbability;
  notes?: string;
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  provider: 'google' | 'password' | 'guest';
  isFirebaseUser?: boolean;
}
