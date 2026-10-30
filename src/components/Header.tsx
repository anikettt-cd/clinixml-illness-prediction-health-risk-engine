/**
 * Clean & Simple Header
 * Strictly follows Top Bar Contract: [Brand] - [Nav links] - [Primary actions]
 * No complex ML jargon or cluttered dashboards.
 */

import React from 'react';
import { HeartPulse, UserPlus, LogOut, CheckCircle2 } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { PatientProfile, AppUser } from '../types/medical';

interface HeaderProps {
  activeTab: 'check_symptoms' | 'history';
  setActiveTab: (tab: 'check_symptoms' | 'history') => void;
  patients: PatientProfile[];
  currentPatientId: string;
  onSelectPatient: (id: string) => void;
  onAddNewPatient: () => void;
  onShowSplash?: () => void;
  user: AppUser | FirebaseUser | null;
  isAuthLoading: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  patients,
  currentPatientId,
  onSelectPatient,
  onAddNewPatient,
  onShowSplash,
  user,
  isAuthLoading,
  onLogin,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Zone 1: Brand Wordmark */}
        <div
          onClick={onShowSplash}
          className={`flex items-center gap-2.5 shrink-0 ${onShowSplash ? 'cursor-pointer group' : ''}`}
        >
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shadow-2xs group-hover:bg-sky-100 transition-colors">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 group-hover:text-sky-700 transition-colors leading-tight">
              Symptoms Based Disease Detection System
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              AI-Powered Health Assessment & Symptom Checker
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        {patients.length > 0 && (
          <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveTab('check_symptoms')}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'check_symptoms'
                  ? 'bg-white text-sky-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Check Symptoms
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'history'
                  ? 'bg-white text-sky-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Past Check-ins
            </button>
          </nav>
        )}

        {/* Zone 3: Patient Switcher & Auth Section */}
        <div className="flex items-center gap-2 shrink-0">
          {patients.length > 1 && (
            <div className="relative hidden lg:flex items-center">
              <select
                value={currentPatientId}
                onChange={(e) => onSelectPatient(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl px-3 py-1.5 focus:outline-none focus:border-sky-500 pr-7 cursor-pointer"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.age}y)
                  </option>
                ))}
              </select>
            </div>
          )}

          {patients.length > 0 && (
            <button
              onClick={onAddNewPatient}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-colors shadow-2xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Patient</span>
            </button>
          )}

          {/* User Authentication Status */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full border border-sky-300 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="hidden xl:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-800 truncate max-w-[110px]">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Signed In
                  </span>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Sign out"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              disabled={isAuthLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isAuthLoading ? 'Connecting...' : 'Sign In'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Nav tab strip */}
      {patients.length > 0 && (
        <div className="md:hidden flex border-t border-slate-100 px-4 py-1.5 bg-slate-50 gap-2 justify-center">
          <button
            onClick={() => setActiveTab('check_symptoms')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'check_symptoms'
                ? 'bg-white text-sky-700 shadow-2xs'
                : 'text-slate-600'
            }`}
          >
            Check Symptoms
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'history'
                ? 'bg-white text-sky-700 shadow-2xs'
                : 'text-slate-600'
            }`}
          >
            Past Check-ins
          </button>
          <button
            onClick={onAddNewPatient}
            className="px-2 py-1 text-xs font-medium text-sky-700 rounded-lg flex items-center gap-1"
          >
            <UserPlus className="w-3 h-3" /> Add
          </button>
        </div>
      )}
    </header>
  );
};
