/**
 * Simple, Patient-Centric Health Check Component
 * Clean, light color theme.
 * Asks simple questions, suggests related symptoms, asks how long it's happening,
 * and predicts disease probabilities in clear plain English.
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  Check,
  Clock,
  Sparkles,
  RotateCcw,
  Stethoscope,
  HeartPulse,
  AlertTriangle,
  BookmarkPlus,
  Edit2,
  Trash2,
} from 'lucide-react';
import { CLINICAL_SYMPTOMS_GRAPH, ClinicalSymptom } from '../data/symptomGraph';
import { PatientProfile, ReportedSymptom } from '../types/medical';
import { calculateDiseaseProbabilities } from '../ml/diseasePredictor';

interface SimpleHealthCheckProps {
  patient: PatientProfile;
  onEditPatient: () => void;
  onSaveCheckIn: (symptoms: ReportedSymptom[]) => void;
}

export const SimpleHealthCheck: React.FC<SimpleHealthCheckProps> = ({
  patient,
  onEditPatient,
  onSaveCheckIn,
}) => {
  const [copied, setCopied] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected symptoms with their duration & severity
  const [selectedSymptoms, setSelectedSymptoms] = useState<Record<string, ReportedSymptom>>({
    fever: {
      symptomId: 'fever',
      name: 'Fever or High Temperature',
      duration: '2_3_days',
      durationLabel: '2 to 3 days',
      severity: 'moderate',
      severityLabel: 'Moderate (Noticeable discomfort)',
    },
  });

  // Calculate dynamic disease probabilities
  const diseaseProbabilities = useMemo(() => {
    return calculateDiseaseProbabilities(patient, Object.values(selectedSymptoms));
  }, [patient, selectedSymptoms]);

  // Suggested symptoms based on all selected symptoms
  const suggestedSymptoms = useMemo(() => {
    const map = new Map<string, { symptom: ClinicalSymptom; reason: string; triggeredBy: string }>();

    Object.keys(selectedSymptoms).forEach((symId) => {
      const sym = CLINICAL_SYMPTOMS_GRAPH[symId];
      if (!sym) return;

      sym.commonAssociatedIds.forEach((assoc) => {
        if (!selectedSymptoms[assoc.symptomId] && !map.has(assoc.symptomId)) {
          const associatedSym = CLINICAL_SYMPTOMS_GRAPH[assoc.symptomId];
          if (associatedSym) {
            map.set(assoc.symptomId, {
              symptom: associatedSym,
              reason: assoc.reason,
              triggeredBy: sym.name,
            });
          }
        }
      });
    });

    return Array.from(map.values()).slice(0, 4);
  }, [selectedSymptoms]);

  // Handle adding symptom
  const handleAddSymptom = (symptomId: string) => {
    const sym = CLINICAL_SYMPTOMS_GRAPH[symptomId];
    if (!sym || selectedSymptoms[symptomId]) return;

    setSelectedSymptoms((prev) => ({
      ...prev,
      [symptomId]: {
        symptomId,
        name: sym.name,
        duration: '2_3_days',
        durationLabel: '2 to 3 days',
        severity: 'moderate',
        severityLabel: 'Moderate',
      },
    }));
    setSearchQuery('');
  };

  // Handle removing symptom
  const handleRemoveSymptom = (symptomId: string) => {
    setSelectedSymptoms((prev) => {
      const copy = { ...prev };
      delete copy[symptomId];
      return copy;
    });
  };

  // Update duration
  const handleUpdateDuration = (symptomId: string, duration: ReportedSymptom['duration'], label: string) => {
    setSelectedSymptoms((prev) => {
      const current = prev[symptomId];
      if (!current) return prev;
      return {
        ...prev,
        [symptomId]: { ...current, duration, durationLabel: label },
      };
    });
  };

  // Update severity
  const handleUpdateSeverity = (symptomId: string, severity: ReportedSymptom['severity'], label: string) => {
    setSelectedSymptoms((prev) => {
      const current = prev[symptomId];
      if (!current) return prev;
      return {
        ...prev,
        [symptomId]: { ...current, severity, severityLabel: label },
      };
    });
  };

  // Quick symptom presets
  const applyPreset = (ids: string[]) => {
    const next: Record<string, ReportedSymptom> = {};
    ids.forEach((id) => {
      const sym = CLINICAL_SYMPTOMS_GRAPH[id];
      if (sym) {
        next[id] = {
          symptomId: id,
          name: sym.name,
          duration: '2_3_days',
          durationLabel: '2 to 3 days',
          severity: 'moderate',
          severityLabel: 'Moderate',
        };
      }
    });
    setSelectedSymptoms(next);
  };

// Copy report to clipboard
  const handleCopyReport = async () => {
    const text = [
      'Symptom Check Report',
      `Patient: ${patient.name} (Age ${patient.age}, BMI ${patient.bmi.toFixed(1)})`,
      '',
      'Reported Symptoms:',
      ...Object.values(selectedSymptoms).map((s) => `- ${s.name} (${s.durationLabel}, ${s.severityLabel})`),
      '',
      'Top Predictions:',
      ...diseaseProbabilities.slice(0, 5).map((d) => `- ${d.diseaseName}: ${d.probability}% (${d.riskLevel})`),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.alert('Copy failed. Please copy manually.');
    }
  };

  // Clear all symptoms
  const handleClearAll = () => {
    setSelectedSymptoms({});
  };

  // Filtered symptoms for search
  const availableFiltered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return Object.values(CLINICAL_SYMPTOMS_GRAPH).filter((s) => {
      if (selectedSymptoms[s.id]) return false;
      if (!query) return true;
      return (
        s.name.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, selectedSymptoms]);

useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const selectedCount = Object.keys(selectedSymptoms).length;
  const topPrediction = diseaseProbabilities[0];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Patient Welcome & Body Stats Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center font-bold text-base shadow-2xs">
            {patient.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Hello, {patient.name}!
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span>{patient.age} years</span>
              <span className="text-slate-300">·</span>
              <span className="capitalize">{patient.gender}</span>
              <span className="text-slate-300">·</span>
              <span>Weight: <strong className="text-slate-700">{patient?.weightKg ?? 68} kg</strong></span>
              <span className="text-slate-300">·</span>
              <span>Height: <strong className="text-slate-700">{patient?.heightCm ?? 172} cm</strong></span>
              <span className="text-slate-300">·</span>
              <span>BMI: <strong className="text-sky-700">{Number(patient?.bmi || 22.5).toFixed(1)}</strong></span>
            </div>
          </div>
        </div>

        <button
          onClick={onEditPatient}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors self-start sm:self-auto"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit Body Details</span>
        </button>
      </div>

      {/* Step 1: Select Symptoms */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
        <div>
          <div className="flex items-center gap-2 text-sky-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <Stethoscope className="w-4 h-4" />
            <span>Step 1 of 2</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            What symptoms are you experiencing?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Click on common symptoms or search below to tell us what you are feeling:
          </p>
        </div>

        {/* Quick Symptoms Grid */}
        <div className="flex flex-wrap gap-2 pt-1">
          {[
            { id: 'fever', label: '🌡️ Fever' },
            { id: 'headache', label: '🤕 Headache' },
            { id: 'chest_tightness', label: '❤️ Chest Pain / Tightness' },
            { id: 'shortness_breath', label: '🫁 Shortness of Breath' },
            { id: 'excessive_thirst', label: '💧 Excessive Thirst' },
            { id: 'cough', label: '🗣️ Cough' },
            { id: 'fatigue', label: '😴 Extreme Fatigue' },
            { id: 'swelling_legs', label: '🦵 Leg / Ankle Swelling' },
            { id: 'frequent_urination', label: '🚽 Frequent Urination' },
            { id: 'dizziness', label: '💫 Dizziness' },
          ].map((item) => {
            const isPicked = !!selectedSymptoms[item.id];
            return (
              <button
                key={item.id}
                onClick={() =>
                  isPicked ? handleRemoveSymptom(item.id) : handleAddSymptom(item.id)
                }
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isPicked
                    ? 'bg-sky-600 text-white shadow-xs font-semibold ring-2 ring-sky-500/20'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                }`}
              >
                <span>{item.label}</span>
                {isPicked && <Check className="w-3.5 h-3.5 ml-0.5" />}
              </button>
            );
          })}
        </div>

{/* Quick Presets */}
        <div className="flex flex-wrap gap-2 pt-2">
          <span className="text-[11px] font-semibold text-slate-500 self-center">Quick presets:</span>
          <button onClick={() => applyPreset(['fever', 'headache', 'body_aches', 'fatigue'])} className="px-3 py-1.5 text-[11px] font-medium bg-slate-100 hover:bg-sky-50 text-slate-700 rounded-lg transition-colors">Cold / Flu</button>
          <button onClick={() => applyPreset(['excessive_thirst', 'frequent_urination', 'fatigue'])} className="px-3 py-1.5 text-[11px] font-medium bg-slate-100 hover:bg-sky-50 text-slate-700 rounded-lg transition-colors">Diabetes Check</button>
          <button onClick={() => applyPreset(['chest_tightness', 'shortness_breath', 'dizziness'])} className="px-3 py-1.5 text-[11px] font-medium bg-slate-100 hover:bg-sky-50 text-slate-700 rounded-lg transition-colors">Heart & Breathing</button>
          <button onClick={() => applyPreset(['swelling_legs', 'foamy_urine', 'fatigue'])} className="px-3 py-1.5 text-[11px] font-medium bg-slate-100 hover:bg-sky-50 text-slate-700 rounded-lg transition-colors">Kidney Check</button>
        </div>

        {/* Search Input for other symptoms */}
        <div className="relative pt-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search any other symptom (e.g. sore throat, chills, nausea, blurry vision)... (press / to focus)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
            />
          </div>

          {searchQuery.trim().length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 max-h-56 overflow-y-auto p-1.5 space-y-1">
              {availableFiltered.length === 0 ? (
                <div className="p-3 text-xs text-slate-500 text-center">
                  No matching symptom found.
                </div>
              ) : (
                availableFiltered.map((sym) => (
                  <button
                    key={sym.id}
                    onClick={() => handleAddSymptom(sym.id)}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50 flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">{sym.name}</div>
                      <div className="text-[11px] text-slate-500">{sym.description}</div>
                    </div>
                    <span className="text-sky-600 font-semibold text-xs flex items-center gap-1 shrink-0 ml-2">
                      <Plus className="w-3.5 h-3.5" /> Add
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Suggested Symptoms (If patient has fever, suggest headache, chills, etc.) */}
      {suggestedSymptoms.length > 0 && (
        <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-sky-950">
                Related Symptoms You Might Also Have
              </h3>
              <p className="text-xs text-sky-800 mt-0.5 leading-relaxed">
                People experiencing your symptoms commonly report these as well. Click to add if you are experiencing them:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                {suggestedSymptoms.map((item) => (
                  <div
                    key={item.symptom.id}
                    className="bg-white/95 border border-sky-200/90 rounded-xl p-3.5 flex flex-col justify-between shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {item.symptom.name}
                        </span>
                        <span className="text-[10px] text-sky-700 font-semibold bg-sky-100/70 px-2 py-0.5 rounded-md">
                          Linked with {item.triggeredBy}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-normal">
                        {item.reason}
                      </p>
                    </div>

                    <button
                      onClick={() => handleAddSymptom(item.symptom.id)}
                      className="mt-3 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Yes, I have this too</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Follow-up Questions (How long has this been happening?) */}
      {selectedCount > 0 && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 text-sky-600 text-xs font-semibold uppercase tracking-wider mb-1">
                <Clock className="w-4 h-4" />
                <span>Step 2 of 2</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Tell us how long and how severe it feels
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Knowing how many days this has been happening helps calculate the exact illness probability:
              </p>
            </div>

            <button
              onClick={handleClearAll}
              className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear all</span>
            </button>
          </div>

          {/* List of active symptoms with simple questions */}
          <div className="space-y-4">
            {Object.values(selectedSymptoms).map((symState) => {
              return (
                <div
                  key={symState.symptomId}
                  className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm sm:text-base font-bold text-slate-900">
                      {symState.name}
                    </span>
                    <button
                      onClick={() => handleRemoveSymptom(symState.symptomId)}
                      className="text-xs text-slate-400 hover:text-rose-600 p-1 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  </div>

                  {/* Question: From how much time is this happening? */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                    <label className="block text-xs font-semibold text-slate-800">
                      From how much time has this been happening?
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { value: '<1_day', label: 'Started today (<24h)' },
                        { value: '2_3_days', label: '2 to 3 days' },
                        { value: '4_7_days', label: 'About a week' },
                        { value: '>1_week', label: 'More than a week' },
                      ].map((opt) => {
                        const isChosen = symState.duration === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() =>
                              handleUpdateDuration(symState.symptomId, opt.value as ReportedSymptom['duration'], opt.label)
                            }
                            className={`p-2.5 rounded-xl text-xs font-semibold text-left transition-all border ${
                              isChosen
                                ? 'bg-sky-50 border-sky-400 text-sky-900 ring-2 ring-sky-400/20 shadow-2xs'
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Question: How severe is it right now? */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                    <label className="block text-xs font-semibold text-slate-800">
                      How severe does it feel right now?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { value: 'mild', label: 'Mild (Manageable, able to do tasks)' },
                        { value: 'moderate', label: 'Moderate (Uncomfortable, need rest)' },
                        { value: 'severe', label: 'Severe (Hard to function / intense)' },
                      ].map((opt) => {
                        const isChosen = symState.severity === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() =>
                              handleUpdateSeverity(symState.symptomId, opt.value as ReportedSymptom['severity'], opt.label)
                            }
                            className={`p-2.5 rounded-xl text-xs font-semibold text-left transition-all border ${
                              isChosen
                                ? 'bg-sky-50 border-sky-400 text-sky-900 ring-2 ring-sky-400/20 shadow-2xs'
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Disease Probability Forecast Results */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-sky-600 text-xs font-semibold uppercase tracking-wider">
              <HeartPulse className="w-4 h-4" />
              <span>Predicted Health Risks &amp; Illness Probabilities</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              What kind of disease could this be?
            </h2>
          </div>

          {topPrediction && (
            <div
              className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold uppercase tracking-wider self-start sm:self-auto ${
                topPrediction.riskLevel === 'urgent' || topPrediction.riskLevel === 'high'
                  ? 'bg-rose-50 border-rose-300 text-rose-800'
                  : topPrediction.riskLevel === 'moderate'
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800'
              }`}
            >
              {topPrediction.riskLevel === 'urgent'
                ? 'Urgent Attention Needed'
                : topPrediction.riskLevel === 'high'
                ? 'High Probability'
                : topPrediction.riskLevel === 'moderate'
                ? 'Moderate Probability'
                : 'Low Risk'}
            </div>
          )}
        </div>

        {/* Warning if urgent */}
        {topPrediction?.warningAlert && (
          <div className="bg-rose-50 border border-rose-300 p-4 rounded-xl flex items-start gap-3 text-rose-900 text-xs sm:text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Important Health Notice:</strong>
              <p className="mt-0.5 text-rose-800 leading-relaxed">{topPrediction.warningAlert}</p>
            </div>
          </div>
        )}

        {/* Disease Probability Cards List */}
        <div className="space-y-4">
          {diseaseProbabilities.map((disease, idx) => {
            const isHighest = idx === 0;
            return (
              <div
                key={disease.diseaseId}
                className={`rounded-2xl p-5 sm:p-6 transition-all border ${
                  isHighest
                    ? 'bg-sky-50/50 border-sky-300 ring-2 ring-sky-100 shadow-xs'
                    : 'bg-white border-slate-200'
                }`}
              >
                {/* Title & Probability Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">
                        {disease.diseaseName}
                      </h3>
                      {isHighest && (
                        <span className="text-[10px] font-bold uppercase bg-sky-600 text-white px-2 py-0.5 rounded-md">
                          Most Likely
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">{disease.category}</span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-slate-500">Probability:</span>
                    <span
                      className={`text-2xl sm:text-3xl font-extrabold font-mono tabular-nums ${
                        disease.probability >= 65
                          ? 'text-rose-600'
                          : disease.probability >= 35
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {disease.probability}%
                    </span>
                  </div>
                </div>

                {/* Probability Bar */}
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      disease.probability >= 65
                        ? 'bg-rose-500'
                        : disease.probability >= 35
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${disease.probability}%` }}
                  />
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-3">
                  {disease.description}
                </p>

                {/* Why this was predicted */}
                {disease.primaryCauses.length > 0 && (
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 mb-3 text-xs">
                    <strong className="text-slate-800 block mb-1">
                      Why this was identified:
                    </strong>
                    <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                      {disease.primaryCauses.map((cause, cIdx) => (
                        <li key={cIdx}>{cause}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Home Remedies and Doctor Advice */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                    <strong className="text-slate-800 block mb-1">
                      💡 Home Care &amp; What You Can Do:
                    </strong>
                    <ul className="list-disc list-inside text-slate-600 space-y-1">
                      {disease.homeRemedies.map((remedy, rIdx) => (
                        <li key={rIdx}>{remedy}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                    <strong className="text-slate-800 block mb-1">
                      🩺 When to See a Doctor:
                    </strong>
                    <p className="text-slate-600 leading-relaxed">
                      {disease.whenToSeeDoctor}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-2">
          <button
            onClick={handleCopyReport}
            className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
          >
            <span>{copied ? '✅ Copied!' : '📋 Copy Report'}</span>
          </button>
          <button
            onClick={() => window.print()}
            className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
          >
            <span>🖨️ Print Report</span>
          </button>
          <button
            onClick={() => onSaveCheckIn(Object.values(selectedSymptoms))}
            className="w-full sm:w-auto px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
          >
            <BookmarkPlus className="w-4 h-4" />
            <span>Save This Check-in to History</span>
          </button>
        </div>

        {/* Printable Report (hidden on screen) */}
        <div className="print-report hidden print:block mt-6 border border-slate-200 rounded-xl p-6 bg-white">
          <h1 className="text-lg font-bold text-slate-900 mb-2">Symptom Check Report</h1>
          <p className="text-xs text-slate-500 mb-4">Patient: {patient.name} · Age {patient.age} · BMI {patient.bmi.toFixed(1)}</p>
          <h2 className="text-sm font-semibold text-slate-800 mb-1">Reported Symptoms</h2>
          <ul className="text-xs text-slate-700 mb-4 list-disc list-inside">
            {Object.values(selectedSymptoms).map((s) => (
              <li key={s.symptomId}>{s.name} — {s.durationLabel}, {s.severityLabel}</li>
            ))}
          </ul>
          <h2 className="text-sm font-semibold text-slate-800 mb-1">Top Predictions</h2>
          <ul className="text-xs text-slate-700 space-y-1">
            {diseaseProbabilities.slice(0, 5).map((d) => (
              <li key={d.diseaseId}>{d.diseaseName}: {d.probability}% ({d.riskLevel})</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
