/**
 * Firebase Client & Firestore Service
 * Handles Authentication (Google Sign-In) and Firestore DB persistence.
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { PatientProfile, HealthCheckRecord, AppUser } from '../types/medical';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Must pass databaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Storage Keys
const REGISTERED_ACCOUNTS_KEY = 'adps_registered_accounts_v1';
const ACTIVE_SESSION_KEY = 'adps_active_session_v1';
const AUTH_EVENT_NAME = 'adps_auth_state_changed';

interface StoredAccount {
  uid: string;
  identifier: string; // lowercase trimmed username or email
  email: string;
  displayName: string;
  passwordHash: string;
  createdAt: string;
}

// Password Hashing Helper
async function hashPassword(pwd: string): Promise<string> {
  try {
    const enc = new TextEncoder().encode(pwd);
    const hashBuf = await crypto.subtle.digest('SHA-256', enc);
    const hashArr = Array.from(new Uint8Array(hashBuf));
    return hashArr.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return btoa(pwd);
  }
}

// Local Accounts Helper
function getStoredAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(REGISTERED_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredAccounts(accounts: StoredAccount[]) {
  try {
    localStorage.setItem(REGISTERED_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error('Failed to save local accounts:', err);
  }
}

export function getLocalSessionUser(): AppUser | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveLocalSessionUser(user: AppUser | null) {
  try {
    if (user) {
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    }
    window.dispatchEvent(new CustomEvent(AUTH_EVENT_NAME, { detail: user }));
  } catch (err) {
    console.error('Failed to save session:', err);
  }
}

// Test Connection on application boot (as required by specification)
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Standardized Operation Types & Error Handler
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Unified Auth State Listener
export function onAppAuthStateChanged(callback: (user: AppUser | null) => void): () => void {
  const handleFirebaseUser = (fbUser: FirebaseUser | null) => {
    if (fbUser) {
      const appUser: AppUser = {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Patient User',
        photoURL: fbUser.photoURL,
        provider: 'google',
        isFirebaseUser: true,
      };
      saveLocalSessionUser(appUser);
      callback(appUser);
    } else {
      const localUser = getLocalSessionUser();
      callback(localUser);
    }
  };

  const unsubscribeFirebase = onAuthStateChanged(auth, handleFirebaseUser);

  const handleCustomAuthChange = (e: Event) => {
    const customEv = e as CustomEvent<AppUser | null>;
    callback(customEv.detail);
  };

  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === ACTIVE_SESSION_KEY) {
      const user = getLocalSessionUser();
      callback(user);
    }
  };

  window.addEventListener(AUTH_EVENT_NAME, handleCustomAuthChange);
  window.addEventListener('storage', handleStorageChange);

  // Initial trigger
  if (auth.currentUser) {
    handleFirebaseUser(auth.currentUser);
  } else {
    callback(getLocalSessionUser());
  }

  return () => {
    unsubscribeFirebase();
    window.removeEventListener(AUTH_EVENT_NAME, handleCustomAuthChange);
    window.removeEventListener('storage', handleStorageChange);
  };
}

// Authentication Helpers
export async function loginWithGoogle(): Promise<AppUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Safely sync user profile document in Firestore
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const existingSnap = await getDocFromServer(userDocRef).catch(() => null);

      if (!existingSnap || !existingSnap.exists()) {
        await setDoc(userDocRef, {
          id: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Patient User',
          photoURL: user.photoURL || '',
          createdAt: new Date().toISOString(),
        });
      } else {
        // Document already exists: preserve original createdAt so rules don't fail
        const existingData = existingSnap.data();
        await setDoc(
          userDocRef,
          {
            id: user.uid,
            email: user.email || existingData.email || '',
            displayName: user.displayName || existingData.displayName || 'Patient User',
            photoURL: user.photoURL || existingData.photoURL || '',
            createdAt: existingData.createdAt || new Date().toISOString(),
          },
          { merge: true }
        );
      }
    } catch (err) {
      console.warn('Could not sync Google user profile to Firestore (continuing):', err);
    }

    const appUser: AppUser = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'Patient User',
      photoURL: user.photoURL,
      provider: 'google',
      isFirebaseUser: true,
    };

    saveLocalSessionUser(appUser);
    return appUser;
  } catch (error) {
    console.error('Sign-in error:', error);
    throw error;
  }
}

/**
 * Format username or email into a valid email string
 */
export function formatEmailIdentifier(identifier: string): string {
  const trimmed = identifier.trim();
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }
  // Convert plain username (e.g. "rahul") into a valid email format
  const sanitized = trimmed.toLowerCase().replace(/[^a-z0-9._-]/g, '');
  return `${sanitized || 'patient'}@app.local`;
}

export async function loginWithEmailOrUsername(
  identifier: string,
  password: string
): Promise<AppUser> {
  const trimmedId = identifier.trim();
  const normalizedKey = trimmedId.toLowerCase();
  const email = formatEmailIdentifier(trimmedId);
  const pwdHash = await hashPassword(password);

  // 1. Check local registered accounts store first
  const localAccounts = getStoredAccounts();
  const matched = localAccounts.find(
    (a) => a.identifier === normalizedKey || a.email.toLowerCase() === normalizedKey
  );

  if (matched) {
    if (matched.passwordHash !== pwdHash) {
      throw new Error('auth/wrong-password');
    }

    const appUser: AppUser = {
      uid: matched.uid,
      email: matched.email,
      displayName: matched.displayName,
      provider: 'password',
      isFirebaseUser: false,
    };

    saveLocalSessionUser(appUser);
    return appUser;
  }

  // 2. Try Firebase Auth if not in local store
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const user = cred.user;

    const appUser: AppUser = {
      uid: user.uid,
      email: user.email || email,
      displayName: user.displayName || trimmedId,
      provider: 'password',
      isFirebaseUser: true,
    };

    saveLocalSessionUser(appUser);
    return appUser;
  } catch (fbErr: unknown) {
    const errorStr = String(fbErr);
    if (errorStr.includes('auth/operation-not-allowed')) {
      // Firebase Email provider not enabled; since user wasn't found in local accounts,
      // prompt them to create an account
      throw new Error('auth/user-not-found');
    }
    throw fbErr;
  }
}

export async function registerWithEmailOrUsername(
  identifier: string,
  password: string,
  name?: string
): Promise<AppUser> {
  const trimmedId = identifier.trim();
  const normalizedKey = trimmedId.toLowerCase();
  const email = formatEmailIdentifier(trimmedId);
  const displayName = name?.trim() || trimmedId;
  const pwdHash = await hashPassword(password);

  // Check if identifier is already taken in local accounts
  const localAccounts = getStoredAccounts();
  const existsLocally = localAccounts.some(
    (a) => a.identifier === normalizedKey || a.email.toLowerCase() === normalizedKey
  );
  if (existsLocally) {
    throw new Error('auth/email-already-in-use');
  }

  // 1. Try Firebase Auth
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const user = cred.user;

    try {
      await updateProfile(user, { displayName });
    } catch {
      // Non-fatal
    }

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(
        userDocRef,
        {
          id: user.uid,
          email: user.email || email,
          displayName,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (docErr) {
      console.warn('Could not write user profile to Firestore:', docErr);
    }

    const appUser: AppUser = {
      uid: user.uid,
      email: user.email || email,
      displayName,
      provider: 'password',
      isFirebaseUser: true,
    };

    // Also store account locally for resilience
    const newAccount: StoredAccount = {
      uid: user.uid,
      identifier: normalizedKey,
      email,
      displayName,
      passwordHash: pwdHash,
      createdAt: new Date().toISOString(),
    };
    saveStoredAccounts([...localAccounts, newAccount]);
    saveLocalSessionUser(appUser);

    return appUser;
  } catch (fbErr: unknown) {
    const errorStr = String(fbErr);
    // If Firebase Email/Password is disabled or fails due to operation-not-allowed:
    // Create the account smoothly in the local account store!
    if (errorStr.includes('auth/operation-not-allowed') || errorStr.includes('ADMIN_ONLY_OPERATION')) {
      const deterministicUid = 'usr_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
      const newAccount: StoredAccount = {
        uid: deterministicUid,
        identifier: normalizedKey,
        email,
        displayName,
        passwordHash: pwdHash,
        createdAt: new Date().toISOString(),
      };

      saveStoredAccounts([...localAccounts, newAccount]);

      const appUser: AppUser = {
        uid: deterministicUid,
        email,
        displayName,
        provider: 'password',
        isFirebaseUser: false,
      };

      saveLocalSessionUser(appUser);
      return appUser;
    }

    throw fbErr;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    if (auth.currentUser) {
      await firebaseSignOut(auth);
    }
  } catch (error) {
    console.warn('Firebase logout warning:', error);
  }
  saveLocalSessionUser(null);
}

// Firestore Operations for Patients
export async function savePatientToFirestore(
  userId: string,
  patient: PatientProfile
): Promise<void> {
  if (!auth.currentUser) {
    // If not authenticated via Firebase Auth (e.g. local account), skip remote Firestore write
    return;
  }
  const path = `users/${userId}/patients/${patient.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'patients', patient.id);
    const payload = {
      id: patient.id,
      userId: userId,
      name: patient.name,
      age: Number(patient.age),
      gender: patient.gender,
      weightKg: Number(patient.weightKg),
      heightCm: Number(patient.heightCm),
      bmi: Number(patient.bmi),
      isSmoker: Boolean(patient.isSmoker),
      hasDiabetesHistory: Boolean(patient.hasDiabetesHistory),
      hasHeartHistory: Boolean(patient.hasHeartHistory),
      hasHighBpHistory: Boolean(patient.hasHighBpHistory),
      ...(patient.medicationsSummary ? { medicationsSummary: patient.medicationsSummary } : {}),
      createdAt: patient.createdAt || new Date().toISOString(),
    };
    await setDoc(docRef, payload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deletePatientFromFirestore(
  userId: string,
  patientId: string
): Promise<void> {
  if (!auth.currentUser) return;
  const path = `users/${userId}/patients/${patientId}`;
  try {
    const docRef = doc(db, 'users', userId, 'patients', patientId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Firestore Operations for Health Check Records
export async function saveRecordToFirestore(
  userId: string,
  record: HealthCheckRecord
): Promise<void> {
  if (!auth.currentUser) return;
  const path = `users/${userId}/records/${record.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'records', record.id);
    const payload = {
      id: record.id,
      userId: userId,
      patientId: record.patientId,
      timestamp: record.timestamp,
      formattedDate: record.formattedDate,
      reportedSymptoms: record.reportedSymptoms,
      predictions: record.predictions,
      topDisease: record.topDisease,
      ...(record.notes ? { notes: record.notes } : {}),
    };
    await setDoc(docRef, payload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteRecordFromFirestore(
  userId: string,
  recordId: string
): Promise<void> {
  if (!auth.currentUser) return;
  const path = `users/${userId}/records/${recordId}`;
  try {
    const docRef = doc(db, 'users', userId, 'records', recordId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Subscriptions for real-time sync
export function subscribeToPatients(
  userId: string,
  onPatients: (patients: PatientProfile[]) => void
) {
  if (!auth.currentUser) {
    return () => {};
  }
  const path = `users/${userId}/patients`;
  const patientsCol = collection(db, 'users', userId, 'patients');
  const q = query(patientsCol);

  return onSnapshot(
    q,
    (snapshot) => {
      const list: PatientProfile[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: data.id,
          name: data.name,
          age: data.age,
          gender: data.gender,
          weightKg: data.weightKg,
          heightCm: data.heightCm,
          bmi: data.bmi,
          isSmoker: Boolean(data.isSmoker),
          hasDiabetesHistory: Boolean(data.hasDiabetesHistory),
          hasHeartHistory: Boolean(data.hasHeartHistory),
          hasHighBpHistory: Boolean(data.hasHighBpHistory),
          medicationsSummary: data.medicationsSummary || undefined,
          createdAt: data.createdAt,
        });
      });
      onPatients(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}

export function subscribeToRecords(
  userId: string,
  onRecords: (records: HealthCheckRecord[]) => void
) {
  if (!auth.currentUser) {
    return () => {};
  }
  const path = `users/${userId}/records`;
  const recordsCol = collection(db, 'users', userId, 'records');
  const q = query(recordsCol);

  return onSnapshot(
    q,
    (snapshot) => {
      const list: HealthCheckRecord[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: data.id,
          patientId: data.patientId,
          timestamp: data.timestamp,
          formattedDate: data.formattedDate,
          reportedSymptoms: data.reportedSymptoms || [],
          predictions: data.predictions || [],
          topDisease: data.topDisease,
          notes: data.notes || undefined,
        });
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      onRecords(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}
