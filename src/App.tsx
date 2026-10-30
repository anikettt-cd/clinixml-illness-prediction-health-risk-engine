/**
 * Symptoms Based Disease Detection System
 * Clean, simple, light-colored design centered around the patient.
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PatientProfileForm } from './components/PatientProfileForm';
import { SimpleHealthCheck } from './components/SimpleHealthCheck';
import { SimpleHistoryList } from './components/SimpleHistoryList';
import { SplashScreen } from './components/SplashScreen';
import { AuthScreen } from './components/AuthScreen';
import { PatientProfile, HealthCheckRecord, ReportedSymptom, AppUser } from './types/medical';
import { calculateDiseaseProbabilities } from './ml/diseasePredictor';
import {
  auth,
  loginWithGoogle,
  logoutUser,
  onAppAuthStateChanged,
  savePatientToFirestore,
  deletePatientFromFirestore,
  saveRecordToFirestore,
  deleteRecordFromFirestore,
  subscribeToPatients,
  subscribeToRecords,
} from './lib/firebase';

// Safe localStorage access that never throws in sandboxed iframes
function getStorageItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  } catch {
    return null;
  }
}

function setStorageItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Ignore iframe storage access restrictions
  }
}

// Sanitize loaded patient data to ensure no undefined property crashes
function sanitizePatient(p: Partial<PatientProfile>): PatientProfile {
  const weight = Number(p.weightKg) || 68;
  const height = Number(p.heightCm) || 172;
  const heightM = height / 100;
  const calcBmi = heightM > 0 ? weight / (heightM * heightM) : 23.0;

  return {
    id: String(p.id || `pat_${Date.now()}`),
    name: String(p.name || 'User'),
    age: Number(p.age) || 30,
    gender: p.gender === 'female' ? 'female' : p.gender === 'other' ? 'other' : 'male',
    weightKg: Math.round(weight * 10) / 10,
    heightCm: Math.round(height),
    bmi: Math.round((Number(p.bmi) || calcBmi) * 10) / 10,
    isSmoker: Boolean(p.isSmoker),
    hasDiabetesHistory: Boolean(p.hasDiabetesHistory),
    hasHeartHistory: Boolean(p.hasHeartHistory),
    hasHighBpHistory: Boolean(p.hasHighBpHistory),
    medicationsSummary: p.medicationsSummary || undefined,
    createdAt: p.createdAt || new Date().toISOString(),
  };
}

export default function App() {
  // Authentication state
  const [user, setUser] = useState<AppUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // Patients storage (Starts clean using fresh key so old mock patients from turn 1 are never loaded)
  const [patients, setPatients] = useState<PatientProfile[]>(() => {
    const raw = getStorageItem('adps_patients_v3');
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(sanitizePatient);
      }
      return [];
    } catch {
      return [];
    }
  });

  const [currentPatientId, setCurrentPatientId] = useState<string>(() => {
    return getStorageItem('adps_active_patient_id_v3') || '';
  });

  // History records storage
  const [historyRecords, setHistoryRecords] = useState<HealthCheckRecord[]>(() => {
    const raw = getStorageItem('adps_history_records_v3');
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'check_symptoms' | 'history'>('check_symptoms');

  // Modal / Screen to add or edit patient
  const [isAddingNewPatient, setIsAddingNewPatient] = useState(false);
  const [isEditingCurrentPatient, setIsEditingCurrentPatient] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initial welcome / splash popup shown at startup for a few seconds
  const [showSplash, setShowSplash] = useState(true);

  // Authentication login modal - automatically prompts when not signed in
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Track Auth state changes across Google & username/password accounts
  useEffect(() => {
    const unsubscribe = onAppAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // When user is authenticated via Google / Firebase, sync with Firestore in real-time
  useEffect(() => {
    if (!user || (!user.isFirebaseUser && user.provider !== 'google')) return;

    // Listen for patient updates in Firestore
    const unsubPatients = subscribeToPatients(user.uid, (remotePatients) => {
      if (remotePatients.length > 0) {
        setPatients(remotePatients);
        setCurrentPatientId((prev) => {
          const exists = remotePatients.some((p) => p.id === prev);
          return exists ? prev : remotePatients[0].id;
        });
      }
    });

    // Listen for past check-in records in Firestore
    const unsubRecords = subscribeToRecords(user.uid, (remoteRecords) => {
      setHistoryRecords(remoteRecords);
    });

    return () => {
      unsubPatients();
      unsubRecords();
    };
  }, [user]);

  // Upload existing local data to Firestore upon Google sign-in
  useEffect(() => {
    if (!user || (!user.isFirebaseUser && user.provider !== 'google')) return;
    if (patients.length > 0) {
      patients.forEach((pat) => {
        savePatientToFirestore(user.uid, pat).catch((err) => {
          console.warn('Auto-sync patient to Firestore notice:', err);
        });
      });
    }
    if (historyRecords.length > 0) {
      historyRecords.forEach((rec) => {
        saveRecordToFirestore(user.uid, rec).catch((err) => {
          console.warn('Auto-sync record to Firestore notice:', err);
        });
      });
    }
  }, [user?.uid, user?.provider]);

  // Sync with localStorage safely
  useEffect(() => {
    setStorageItem('adps_patients_v3', JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    setStorageItem('adps_history_records_v3', JSON.stringify(historyRecords));
  }, [historyRecords]);

  useEffect(() => {
    setStorageItem('adps_active_patient_id_v3', currentPatientId);
  }, [currentPatientId]);

  // Current active patient
  const currentPatient = patients.find((p) => p.id === currentPatientId) || patients[0];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleOpenAuthModal = () => {
    setIsAuthModalOpen(true);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      showToast('Signed out of cloud account.');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Add new patient
  const handleSaveNewPatient = async (newPat: PatientProfile) => {
    const sanitized = sanitizePatient(newPat);
    setPatients((prev) => [...prev, sanitized]);
    setCurrentPatientId(sanitized.id);
    setIsAddingNewPatient(false);
    setIsEditingCurrentPatient(false);
    setActiveTab('check_symptoms');

    if (user) {
      try {
        await savePatientToFirestore(user.uid, sanitized);
        showToast(`Welcome, ${sanitized.name}! Profile saved.`);
      } catch (err) {
        console.error('Save error:', err);
        showToast(`Welcome, ${sanitized.name}! Saved.`);
      }
    } else {
      showToast(`Welcome, ${sanitized.name}!`);
    }
  };

  // Update existing patient
  const handleUpdatePatient = async (updated: PatientProfile) => {
    const sanitized = sanitizePatient(updated);
    setPatients((prev) => prev.map((p) => (p.id === sanitized.id ? sanitized : p)));
    setIsEditingCurrentPatient(false);

    if (user) {
      try {
        await savePatientToFirestore(user.uid, sanitized);
        showToast(`Updated details for ${sanitized.name}.`);
      } catch (err) {
        console.error('Update error:', err);
        showToast(`Updated details for ${sanitized.name}.`);
      }
    } else {
      showToast(`Updated details for ${sanitized.name}.`);
    }
  };

  // Save a completed health check-in
  const handleSaveCheckIn = async (symptoms: ReportedSymptom[]) => {
    if (!currentPatient) return;

    const predictions = calculateDiseaseProbabilities(currentPatient, symptoms);
    const formattedDate = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newRecord: HealthCheckRecord = {
      id: `rec_${Date.now()}`,
      patientId: currentPatient.id,
      timestamp: new Date().toISOString(),
      formattedDate,
      reportedSymptoms: symptoms,
      predictions,
      topDisease: predictions[0],
    };

    setHistoryRecords((prev) => [newRecord, ...prev]);

    if (user) {
      try {
        await saveRecordToFirestore(user.uid, newRecord);
        showToast('Check-in saved successfully!');
      } catch (err) {
        console.error('Save record error:', err);
        showToast('Check-in saved to health history!');
      }
    } else {
      showToast('Check-in saved!');
    }
  };

  // Delete past record
  const handleDeleteRecord = async (id: string) => {
    setHistoryRecords((prev) => prev.filter((r) => r.id !== id));
    if (user) {
      try {
        await deleteRecordFromFirestore(user.uid, id);
      } catch (err) {
        console.error('Firestore delete record error:', err);
      }
    }
    showToast('Record deleted.');
  };

  // Filter history records for current patient
  const patientHistoryRecords = historyRecords.filter(
    (r) => r.patientId === currentPatient?.id
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-sky-500/20 selection:text-sky-900">
      {/* Startup Splash Popup Screen */}
      {showSplash && (
        <SplashScreen
          onComplete={() => {
            setShowSplash(false);
            if (!user) {
              setIsAuthModalOpen(true);
            }
          }}
          onOpenLogin={() => setIsAuthModalOpen(true)}
        />
      )}

      {/* User Authentication & Login Modal */}
      <AuthScreen
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(name) => {
          showToast(`Welcome, ${name}! Signed in successfully.`);
        }}
        allowDismiss={true}
      />

      {/* Simple Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        patients={patients}
        currentPatientId={currentPatient?.id || ''}
        onSelectPatient={setCurrentPatientId}
        onAddNewPatient={() => setIsAddingNewPatient(true)}
        onShowSplash={() => setShowSplash(true)}
        user={user}
        isAuthLoading={isAuthLoading}
        onLogin={handleOpenAuthModal}
        onLogout={handleLogout}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Scenario 1: No patient exists yet -> prompt onboarding directly from the beginning */}
        {patients.length === 0 || isAddingNewPatient ? (
          <div className="py-4">
            <PatientProfileForm
              onSavePatient={handleSaveNewPatient}
              onCancel={patients.length > 0 ? () => setIsAddingNewPatient(false) : undefined}
              isInitialSetup={patients.length === 0}
            />
          </div>
        ) : isEditingCurrentPatient ? (
          /* Scenario 2: Edit existing patient's body stats */
          <div className="py-4">
            <PatientProfileForm
              onSavePatient={handleUpdatePatient}
              onCancel={() => setIsEditingCurrentPatient(false)}
              isInitialSetup={false}
            />
          </div>
        ) : (
          /* Scenario 3: Standard active user experience */
          <>
            {activeTab === 'check_symptoms' && currentPatient && (
              <SimpleHealthCheck
                patient={currentPatient}
                onEditPatient={() => setIsEditingCurrentPatient(true)}
                onSaveCheckIn={handleSaveCheckIn}
              />
            )}

            {activeTab === 'history' && (
              <SimpleHistoryList
                records={patientHistoryRecords}
                onDeleteRecord={handleDeleteRecord}
                onStartNewCheckIn={() => setActiveTab('check_symptoms')}
              />
            )}
          </>
        )}
      </main>

      {/* Simple, peaceful footer */}
      <footer className="border-t border-slate-200 bg-white py-5 px-4 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <button
            onClick={() => setShowSplash(true)}
            className="hover:text-sky-600 font-medium transition-colors cursor-pointer text-slate-600"
          >
            Symptoms Based Disease Detection System
          </button>
          <span className="text-[11px] text-slate-400">
            For personal informational purposes · Always seek professional medical care for emergencies
          </span>
        </div>
      </footer>
    </div>
  );
}

