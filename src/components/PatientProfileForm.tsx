/**
 * Simple Patient Profile Creator
 * Asks simple, everyday questions (Age, Body Weight, Height, Lifestyle)
 * without complicated medical jargon like blood pressure.
 */

import React, { useState } from 'react';
import { User, Scale, ArrowRight, HeartPulse } from 'lucide-react';
import { PatientProfile } from '../types/medical';

interface PatientProfileFormProps {
  onSavePatient: (patient: PatientProfile) => void;
  onCancel?: () => void;
  isInitialSetup?: boolean;
}

export const PatientProfileForm: React.FC<PatientProfileFormProps> = ({
  onSavePatient,
  onCancel,
  isInitialSetup = false,
}) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState(30);
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [weightKg, setWeightKg] = useState(68);
  const [heightCm, setHeightCm] = useState(172);
  const [isSmoker, setIsSmoker] = useState(false);
  const [hasDiabetes, setHasDiabetes] = useState(false);
  const [hasHeart, setHasHeart] = useState(false);
  const [hasHighBp, setHasHighBp] = useState(false);
  const [medications, setMedications] = useState('');

  // Calculate BMI dynamically
  const heightM = heightCm / 100;
  const bmi = heightM > 0 ? weightKg / (heightM * heightM) : 22.5;

  const getBmiCategory = (val: number) => {
    if (val < 18.5) return { label: 'Underweight', color: 'text-amber-700 bg-amber-50' };
    if (val < 25) return { label: 'Normal / Healthy Weight', color: 'text-emerald-700 bg-emerald-50' };
    if (val < 30) return { label: 'Overweight', color: 'text-amber-700 bg-amber-50' };
    return { label: 'Higher Weight Range', color: 'text-rose-700 bg-rose-50' };
  };

  const bmiCat = getBmiCategory(bmi);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newPatient: PatientProfile = {
      id: `pat_${Date.now()}`,
      name: name.trim(),
      age: Number(age) || 30,
      gender,
      weightKg: Number(weightKg) || 68,
      heightCm: Number(heightCm) || 172,
      bmi: Math.round(bmi * 10) / 10,
      isSmoker,
      hasDiabetesHistory: hasDiabetes,
      hasHeartHistory: hasHeart,
      hasHighBpHistory: hasHighBp,
      medicationsSummary: medications.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onSavePatient(newPatient);
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 max-w-xl mx-auto shadow-sm">
      <div className="text-center max-w-md mx-auto mb-6">
        <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-3 border border-sky-100 shadow-2xs">
          <HeartPulse className="w-6 h-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          {isInitialSetup ? 'Welcome! Enter Your Basic Details' : 'Add New Patient'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
          Please enter basic information like your body weight and age so we can accurately estimate health risks.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1.5">
            Patient Name / Your Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              required
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
            />
          </div>
        </div>

        {/* Age and Gender */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Age (Years) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              max={110}
              required
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-sky-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Gender <span className="text-rose-500">*</span>
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'other')}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-sky-500 transition-all"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Body Weight and Height */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Body Weight (kg) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Scale className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="number"
                min={20}
                max={250}
                step="0.5"
                required
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-sky-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Height (cm) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={60}
              max={230}
              required
              value={heightCm}
              onChange={(e) => setHeightCm(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-sky-500 transition-all"
            />
          </div>
        </div>

        {/* Auto calculated BMI indicator */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
          <span className="text-slate-600 font-medium">Body Mass Index (BMI):</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">{bmi.toFixed(1)} kg/m²</span>
            <span className={`px-2 py-0.5 rounded-md font-medium text-[11px] ${bmiCat.color}`}>
              {bmiCat.label}
            </span>
          </div>
        </div>

        {/* Simple Lifestyle Questions */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-800">
            Simple Health Background (optional):
          </label>

          <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isSmoker}
              onChange={(e) => setIsSmoker(e.target.checked)}
              className="w-4 h-4 rounded text-sky-600 accent-sky-600"
            />
            <span>Do you smoke cigarettes or tobacco?</span>
          </label>

          <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={hasDiabetes}
              onChange={(e) => setHasDiabetes(e.target.checked)}
              className="w-4 h-4 rounded text-sky-600 accent-sky-600"
            />
            <span>Any family or personal history of diabetes (high sugar)?</span>
          </label>

          <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={hasHeart}
              onChange={(e) => setHasHeart(e.target.checked)}
              className="w-4 h-4 rounded text-sky-600 accent-sky-600"
            />
            <span>Any personal history of heart conditions?</span>
          </label>

          <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={hasHighBp}
              onChange={(e) => setHasHighBp(e.target.checked)}
              className="w-4 h-4 rounded text-sky-600 accent-sky-600"
            />
            <span>History of high blood pressure?</span>
          </label>
        </div>

        {/* Daily Medicines */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Are you currently taking any medicines? (optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Allergy pills, Vitamins, or leave blank"
            value={medications}
            onChange={(e) => setMedications(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-sky-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          {!isInitialSetup && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
          >
            <span>Continue to Symptom Check</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
