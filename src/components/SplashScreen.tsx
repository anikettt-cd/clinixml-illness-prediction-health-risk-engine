/**
 * Splash Screen / Intro Popup Modal
 * Displays upon starting the app for a few seconds before auto-transitioning to the main app.
 * Provides smooth animations, countdown progress, and an immediate 'Continue' button.
 */

import React, { useState, useEffect } from 'react';
import { HeartPulse, ArrowRight, ShieldCheck, Stethoscope } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
  onOpenLogin?: () => void;
  durationMs?: number; // default 3500ms
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  onOpenLogin,
  durationMs = 3200,
}) => {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setProgress(pct);

      if (elapsed >= durationMs) {
        clearInterval(interval);
        handleExit();
      }
    }, 40);

    return () => clearInterval(interval);
  }, [durationMs]);

  const handleExit = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 400); // 400ms fade transition
  };

  const secondsRemaining = Math.max(1, Math.ceil((durationMs * (1 - progress / 100)) / 1000));

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md transition-opacity duration-400 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Light, clean modal container */}
      <div
        className={`w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden transform transition-all duration-400 ease-out ${
          isFadingOut ? 'scale-95 translate-y-2' : 'scale-100 translate-y-0'
        }`}
      >
        {/* Soft decorative header band */}
        <div className="bg-gradient-to-br from-sky-50 via-sky-50/50 to-white px-8 pt-10 pb-6 text-center border-b border-sky-100/60 relative">
          {/* Pulsing Medical Icon */}
          <div className="relative inline-flex items-center justify-center mb-5">
            <span className="animate-ping absolute inline-flex h-20 w-20 rounded-full bg-sky-200 opacity-60" />
            <div className="relative w-20 h-20 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/25 border-2 border-white">
              <HeartPulse className="w-10 h-10 animate-pulse" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-[11px] font-semibold tracking-wide uppercase mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
            <span>Clinical Intelligence</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
            Symptoms Based Disease Detection System
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-sm mx-auto leading-relaxed">
            Personal health assistant for early risk assessment, symptom analysis, and illness detection.
          </p>
        </div>

        {/* Action & Auto-Timer Area */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Quick feature highlights */}
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">Symptom Inquiries</p>
                <p className="text-[11px] text-slate-500">Related symptoms & duration checks</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">Risk Probabilities</p>
                <p className="text-[11px] text-slate-500">Early condition likelihood</p>
              </div>
            </div>
          </div>

          {/* Progress bar and counter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
                Loading application...
              </span>
              <span className="tabular-nums font-medium text-slate-700">
                Starting in {secondsRemaining}s
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-sky-600 rounded-full transition-all duration-75 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={handleExit}
              className="w-full py-3 px-5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer group"
            >
              <span>Start Now</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {onOpenLogin && (
              <button
                onClick={() => {
                  setIsFadingOut(true);
                  setTimeout(() => {
                    onComplete();
                    onOpenLogin();
                  }, 300);
                }}
                className="w-full py-2 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Sign In / Login to Account
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
