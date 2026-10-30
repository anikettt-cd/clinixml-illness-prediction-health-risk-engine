/**
 * AuthScreen / Login Modal Component
 * Prompts user to sign in or register upon opening the app.
 * Supports:
 * 1. One-click Google Sign-In (cloud database sync)
 * 2. Username / Email and Password sign-in & registration
 * 3. Guest mode continuation if user wants to test immediately
 */

import React, { useState } from 'react';
import {
  HeartPulse,
  Lock,
  User,
  Mail,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  ShieldCheck,
  Cloud,
  X,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import {
  loginWithGoogle,
  loginWithEmailOrUsername,
  registerWithEmailOrUsername,
} from '../lib/firebase';

interface AuthScreenProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userName: string) => void;
  allowDismiss?: boolean;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  isOpen,
  onClose,
  onSuccess,
  allowDismiss = true,
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = await loginWithGoogle();
      onSuccess(user.displayName || user.email || 'User');
      onClose();
    } catch (err: unknown) {
      console.error('Google Sign-in failed:', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('popup-closed-by-user')) {
        setErrorMessage('Sign-in popup was closed. Please try again.');
      } else if (msg.includes('popup-blocked')) {
        setErrorMessage('Sign-in popup was blocked by your browser. Please allow popups or use Username/Password below.');
      } else if (msg.includes('unauthorized-domain')) {
        setErrorMessage('Google OAuth domain restricted in preview. Please sign in with Username and Password below.');
      } else {
        setErrorMessage('Unable to connect with Google right now. Please sign in or register with Username and Password below.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage('Please enter your username or email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (isRegister && password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (isRegister) {
        const user = await registerWithEmailOrUsername(
          identifier,
          password,
          fullName.trim() || undefined
        );
        onSuccess(user.displayName || identifier.trim());
        onClose();
      } else {
        const user = await loginWithEmailOrUsername(identifier, password);
        onSuccess(user.displayName || identifier.trim());
        onClose();
      }
    } catch (err: unknown) {
      console.error('Auth error:', err);
      const errorStr = String(err);
      if (errorStr.includes('auth/invalid-credential') || errorStr.includes('auth/wrong-password')) {
        setErrorMessage('Invalid username/email or password. Please check your credentials.');
      } else if (errorStr.includes('auth/user-not-found')) {
        setErrorMessage(`No account found for "${identifier.trim()}". Click "Create Account" below to register.`);
      } else if (errorStr.includes('auth/email-already-in-use')) {
        setErrorMessage(`"${identifier.trim()}" is already registered. Please sign in instead.`);
      } else if (errorStr.includes('auth/weak-password')) {
        setErrorMessage('Password is too weak. Please use at least 6 characters.');
      } else {
        setErrorMessage('Could not sign in. Please verify your details or try creating a new account.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col">
        {/* Top Header Card */}
        <div className="bg-gradient-to-br from-sky-50 via-sky-50/60 to-white px-6 pt-6 pb-5 border-b border-sky-100/70 relative text-center">
          {allowDismiss && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-sky-500/20">
            <HeartPulse className="w-6 h-6 animate-pulse" />
          </div>

          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {isRegister ? 'Create Patient Account' : 'Welcome to Health Check'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Sign in to securely save your symptoms, assessment history, and patient data to the cloud database.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Primary 1-Click Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 rounded-xl shadow-2xs text-xs font-semibold text-slate-800 flex items-center justify-center gap-3 transition-colors cursor-pointer disabled:opacity-60"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
            <span>{isLoading ? 'Connecting...' : 'Continue with Google (Recommended)'}</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-medium text-slate-600 uppercase tracking-wider shrink-0">
              Or with username / password
            </span>
          </div>

          {/* Email / Username & Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name (Optional)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Username or Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. user123 or rahul@gmail.com"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-sky-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-semibold text-xs rounded-xl shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <span>Processing...</span>
              ) : isRegister ? (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Account</span>
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Toggle between Login and Register */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMessage(null);
              }}
              className="text-xs text-sky-700 hover:text-sky-900 font-medium cursor-pointer"
            >
              {isRegister
                ? 'Already have an account? Sign In'
                : "Don't have an account yet? Create Account"}
            </button>
          </div>

          {/* Guest option */}
          <div className="border-t border-slate-100 pt-3 text-center">
            <button
              type="button"
              onClick={onClose}
              className="text-[11px] text-slate-600 hover:text-slate-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Continue without signing in for now</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Footer info pill */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-2.5 text-center text-[10px] text-slate-600 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>Patient records are private and encrypted in cloud database.</span>
        </div>
      </div>
    </div>
  );
};
