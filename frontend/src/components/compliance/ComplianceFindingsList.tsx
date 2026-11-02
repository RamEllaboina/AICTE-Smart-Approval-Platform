import React from 'react';
import type { ComplianceFinding } from '../../types';
import { CheckCircle2, XCircle, AlertTriangle, BookOpen, ArrowRight } from 'lucide-react';

interface Props {
  findings: ComplianceFinding[];
}

export const ComplianceFindingsList: React.FC<Props> = ({ findings }) => {
  if (!findings || findings.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
        No compliance findings recorded. Run evaluation to check requirements.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {findings.map((f) => {
        const isPassed = f.status === 'PASSED';
        const isFailed = f.status === 'FAILED';
        const isWarning = f.status === 'WARNING';

        let borderClass = 'border-slate-200 bg-white';
        let badgeClass = 'bg-slate-100 text-slate-700';
        let Icon = AlertTriangle;

        if (isPassed) {
          borderClass = 'border-emerald-200 bg-emerald-50/20';
          badgeClass = 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold';
          Icon = CheckCircle2;
        } else if (isFailed) {
          borderClass = 'border-rose-200 bg-rose-50/20';
          badgeClass = 'bg-rose-100 text-rose-800 border border-rose-300 font-semibold';
          Icon = XCircle;
        } else if (isWarning) {
          borderClass = 'border-amber-200 bg-amber-50/20';
          badgeClass = 'bg-amber-100 text-amber-800 border border-amber-300 font-semibold';
          Icon = AlertTriangle;
        }

        return (
          <div
            key={f.id}
            className={`p-4 rounded-xl border transition shadow-xs ${borderClass}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="mt-0.5">
                  <Icon
                    className={`w-5 h-5 ${
                      isPassed ? 'text-emerald-600' : isFailed ? 'text-rose-600' : 'text-amber-600'
                    }`}
                  />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-slate-800">{f.rule_code}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${badgeClass}`}>
                      {f.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium mt-1">{f.message}</p>
                </div>
              </div>
            </div>

            {/* Calculations and Expected Values */}
            {(f.calculated_value || f.expected_value) && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100/80 text-[11px]">
                {f.calculated_value && (
                  <div className="bg-white/80 p-2 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block font-medium">Reported / Calculated:</span>
                    <span className="font-semibold text-slate-800">{f.calculated_value}</span>
                  </div>
                )}
                {f.expected_value && (
                  <div className="bg-white/80 p-2 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block font-medium">Statutory Minimum Norm:</span>
                    <span className="font-semibold text-slate-800">{f.expected_value}</span>
                  </div>
                )}
              </div>
            )}

            {/* Actionable Remediation Guidance */}
            {f.remediation_action && (
              <div className="mt-2.5 p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/60 text-xs flex items-start space-x-2 text-amber-900">
                <ArrowRight className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <strong className="font-semibold">Recommended Remediation: </strong>
                  <span>{f.remediation_action}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
