import React from 'react';
import type { ApplicationStatus, TransitionHistoryItem } from '../../types';
import { Check, Clock, AlertTriangle, XCircle, Award } from 'lucide-react';

interface Props {
  currentStatus: ApplicationStatus | string;
  history: TransitionHistoryItem[];
}

const STAGES = [
  { key: 'DRAFT', label: 'Draft' },
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'COMPLETENESS_CHECK', label: 'Completeness' },
  { key: 'UNDER_REVIEW', label: 'Expert Scrutiny' },
  { key: 'REVIEW_COMPLETED', label: 'Recommended' },
  { key: 'PENDING_FINAL_DECISION', label: 'Board Review' },
  { key: 'APPROVED', label: 'Final Decision' },
];

export const WorkflowTimeline: React.FC<Props> = ({ currentStatus, history }) => {
  // Determine active stage index
  let activeIndex = STAGES.findIndex((s) => s.key === currentStatus);
  if (currentStatus === 'RETURNED_FOR_CORRECTION') activeIndex = 2;
  if (currentStatus === 'RESUBMITTED') activeIndex = 2;
  if (currentStatus === 'PENDING_REVIEW') activeIndex = 3;
  if (currentStatus === 'REJECTED') activeIndex = 6;
  if (activeIndex === -1) activeIndex = 0;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Application Progression Stepper</h4>
          <p className="text-xs text-slate-500">Statutory state transition lifecycle & concurrence verification</p>
        </div>
        {currentStatus === 'RETURNED_FOR_CORRECTION' && (
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Deficiency Under Rectification</span>
          </div>
        )}
      </div>

      <div className="relative">
        {/* Connector Line */}
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />

        <div className="flex items-center justify-between relative z-10">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < activeIndex;
            const isCurrent = idx === activeIndex;
            const isRejected = isCurrent && currentStatus === 'REJECTED';
            const isApproved = isCurrent && currentStatus === 'APPROVED';

            let nodeClass = 'bg-slate-100 text-slate-400 border-slate-300';
            let icon = <span className="text-xs font-bold">{idx + 1}</span>;

            if (isCompleted) {
              nodeClass = 'bg-blue-600 text-white border-blue-600';
              icon = <Check className="w-4 h-4" />;
            } else if (isApproved) {
              nodeClass = 'bg-emerald-600 text-white border-emerald-600 ring-4 ring-emerald-100';
              icon = <Award className="w-4 h-4" />;
            } else if (isRejected) {
              nodeClass = 'bg-rose-600 text-white border-rose-600 ring-4 ring-rose-100';
              icon = <XCircle className="w-4 h-4" />;
            } else if (isCurrent) {
              nodeClass = 'bg-blue-50 text-blue-700 border-blue-600 ring-4 ring-blue-100';
              icon = <Clock className="w-4 h-4 animate-spin" />;
            }

            return (
              <div key={stage.key} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs transition shadow-sm ${nodeClass}`}
                >
                  {icon}
                </div>
                <span
                  className={`text-[11px] font-medium mt-2 text-center max-w-[80px] leading-tight ${
                    isCurrent ? 'font-bold text-blue-700' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                  }`}
                >
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historical Transition Logs */}
      {history && history.length > 0 && (
        <div className="mt-6 pt-5 border-t border-slate-100">
          <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Recent Transition Audit Trail</h5>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {history.slice(0, 4).map((h) => (
              <div key={h.id} className="text-xs flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-800">{h.from_state} &rarr; {h.to_state}</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-[11px] text-slate-600">{h.actor_role}</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {new Date(h.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
