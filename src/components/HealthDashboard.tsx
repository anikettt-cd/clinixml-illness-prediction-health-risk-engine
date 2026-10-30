import React, { useMemo } from 'react';
import { Activity, Heart, TrendingUp, Calendar, ShieldCheck } from 'lucide-react';
import { PatientProfile, HealthCheckRecord } from '../types/medical';

interface HealthDashboardProps {
  patient: PatientProfile;
  records: HealthCheckRecord[];
  onNewCheckIn: () => void;
}

const getBmiCategory = (bmi: number) => {
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-amber-700 bg-amber-50 border-amber-200' };
  if (bmi < 25) return { label: 'Healthy Weight', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  if (bmi < 30) return { label: 'Overweight', color: 'text-amber-700 bg-amber-50 border-amber-200' };
  return { label: 'Higher Weight Range', color: 'text-rose-700 bg-rose-50 border-rose-200' };
};

export const HealthDashboard: React.FC<HealthDashboardProps> = ({ patient, records, onNewCheckIn }) => {
  const bmiCat = getBmiCategory(patient.bmi);
  const riskFactorCount = [patient.isSmoker, patient.hasDiabetesHistory, patient.hasHeartHistory, patient.hasHighBpHistory].filter(Boolean).length;
  const latest = records[0];
  const trend = useMemo(() => records.slice(0, 6).reverse(), [records]);
  const wellnessScore = useMemo(() => {
    let score = 100;
    if (patient.bmi < 18.5 || patient.bmi >= 30) score -= 12;
    else if (patient.bmi >= 25) score -= 6;
    score -= riskFactorCount * 8;
    if (latest) score -= Math.min(20, Math.round(latest.topDisease.probability / 5));
    return Math.max(35, Math.min(100, score));
  }, [patient, riskFactorCount, latest]);
  const scoreColor = wellnessScore >= 80 ? 'text-emerald-600' : wellnessScore >= 60 ? 'text-amber-600' : 'text-rose-600';
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Welcome back, {patient.name}</h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">Quick snapshot of your health profile and recent activity.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Wellness Score</p>
              <p className={`text-3xl font-extrabold tabular-nums ${scoreColor}`}>{wellnessScore}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
              <Activity className="w-7 h-7" />
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 mb-2"><Heart className="w-4 h-4 text-rose-500" /><span className="text-[11px] font-semibold uppercase tracking-wider">BMI</span></div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{patient.bmi.toFixed(1)}</p>
          <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${bmiCat.color}`}>{bmiCat.label}</span>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 mb-2"><ShieldCheck className="w-4 h-4 text-amber-500" /><span className="text-[11px] font-semibold uppercase tracking-wider">Risk Factors</span></div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{riskFactorCount}</p>
          <p className="text-[10px] text-slate-500 mt-1.5">{riskFactorCount === 0 ? 'No major risk factors recorded' : 'Recorded in your profile'}</p>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 mb-2"><Calendar className="w-4 h-4 text-sky-500" /><span className="text-[11px] font-semibold uppercase tracking-wider">Check-ins</span></div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{records.length}</p>
          <p className="text-[10px] text-slate-500 mt-1.5">{latest ? `Last: ${latest.formattedDate}` : 'No check-ins yet'}</p>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 mb-2"><TrendingUp className="w-4 h-4 text-emerald-500" /><span className="text-[11px] font-semibold uppercase tracking-wider">Latest Top Risk</span></div>
          <p className="text-sm font-bold text-slate-900 truncate">{latest ? latest.topDisease.diseaseName : '—'}</p>
          <p className="text-[10px] text-slate-500 mt-1.5">{latest ? `${latest.topDisease.probability}% probability` : 'Run a check to see'}</p>
        </div>
      </div>
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Recent Check-in Trend</h3>
        {trend.length === 0 ? (
          <p className="text-xs text-slate-500">No data yet. Complete a symptom check to build your trend.</p>
        ) : (
          <div className="flex items-end gap-3 h-40">
            {trend.map((rec) => (
              <div key={rec.id} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full flex items-end justify-center h-28">
                  <div className={`w-full max-w-[40px] rounded-t-lg transition-all ${rec.topDisease.probability >= 65 ? 'bg-rose-400' : rec.topDisease.probability >= 35 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ height: `${Math.max(8, rec.topDisease.probability)}%` }} title={`${rec.topDisease.diseaseName}: ${rec.topDisease.probability}%`} />
                </div>
                <span className="text-[9px] text-slate-500 text-center leading-tight">{rec.formattedDate.split(',')[0]}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex justify-center">
        <button onClick={onNewCheckIn} className="px-6 py-3 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-all shadow-md shadow-sky-600/20">+ Start a New Symptom Check</button>
      </div>
    </div>
  );
};
