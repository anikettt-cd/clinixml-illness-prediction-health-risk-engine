/**
 * Simple Past Check-Ins & Health History List
 * Clean light theme, patient friendly.
 */

import React from 'react';
import { Calendar, Clock, Stethoscope, Trash2 } from 'lucide-react';
import { HealthCheckRecord } from '../types/medical';

interface SimpleHistoryListProps {
  records: HealthCheckRecord[];
  onDeleteRecord: (id: string) => void;
  onStartNewCheckIn: () => void;
}

export const SimpleHistoryList: React.FC<SimpleHistoryListProps> = ({
  records,
  onDeleteRecord,
  onStartNewCheckIn,
}) => {
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'health-check-history.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            My Past Health Check-ins
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Review symptoms and disease probabilities logged over time.
          </p>
        </div>

<div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-all shadow-xs"
          >
            ⬇️ Export Data
          </button>
          <button
            onClick={onStartNewCheckIn}
            className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-all shadow-xs shrink-0 self-start sm:self-auto"
          >
            + Check Symptoms Now
          </button>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 sm:p-12 text-center max-w-md mx-auto shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-3">
            <Stethoscope className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Past Check-ins Yet</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-4">
            You haven&apos;t saved any symptom check-ins yet. Run a check to see disease probabilities.
          </p>
          <button
            onClick={onStartNewCheckIn}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-all shadow-xs"
          >
            Start First Health Check
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((rec) => {
            return (
              <div
                key={rec.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                    <Calendar className="w-4 h-4 text-sky-600" />
                    <span>{rec.formattedDate}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-medium">
                      Top Match:{' '}
                      <strong className="text-slate-900">{rec.topDisease?.diseaseName}</strong> (
                      <span className="text-sky-700 font-bold">{rec.topDisease?.probability}%</span>)
                    </span>
                    <button
                      onClick={() => onDeleteRecord(rec.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Symptoms reported in this check */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Reported Symptoms:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {rec.reportedSymptoms.map((s, idx) => (
                      <span
                        key={idx}
                        className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-medium"
                      >
                        {s.name} ({s.durationLabel})
                      </span>
                    ))}
                  </div>
                </div>

                {/* Top Care advice */}
                {rec.topDisease?.homeRemedies && rec.topDisease.homeRemedies.length > 0 && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 leading-relaxed">
                    <strong>Care note: </strong> {rec.topDisease.homeRemedies[0]}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
