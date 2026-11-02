import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

interface Props {
  score: number;
  totalRules: number;
  passedRules: number;
  failedRules: number;
}

export const ComplianceScoreGauge: React.FC<Props> = ({
  score,
  totalRules,
  passedRules,
  failedRules
}) => {
  let colorClass = 'text-blue-600 stroke-blue-600';
  let bgClass = 'bg-blue-50 text-blue-800';

  if (score >= 90) {
    colorClass = 'text-emerald-600 stroke-emerald-600';
    bgClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  } else if (score >= 70) {
    colorClass = 'text-amber-500 stroke-amber-500';
    bgClass = 'bg-amber-50 text-amber-800 border-amber-200';
  } else {
    colorClass = 'text-rose-600 stroke-rose-600';
    bgClass = 'bg-rose-50 text-rose-800 border-rose-200';
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900">Compliance Readiness Score</h4>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${bgClass}`}>
            {score >= 90 ? 'High Readiness' : score >= 70 ? 'Moderate Gaps' : 'Critical Deficiencies'}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Automated deterministic validation against AICTE statutory rules
        </p>

        {/* Gauge Center Metric */}
        <div className="flex items-center justify-center my-6">
          <div className="relative flex items-center justify-center">
            {/* Circular Progress Ring */}
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="52"
                className="stroke-slate-100"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="64"
                cy="64"
                r="52"
                className={`transition-all duration-700 ease-out ${colorClass}`}
                strokeWidth="10"
                strokeDasharray={2 * Math.PI * 52}
                strokeDashoffset={(2 * Math.PI * 52) * (1 - score / 100)}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{score}%</span>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Readiness</span>
            </div>
          </div>
        </div>

        {/* Detailed counts */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs pt-4 border-t border-slate-100">
          <div className="p-2 rounded-lg bg-slate-50">
            <span className="text-slate-400 block text-[10px] font-semibold">TOTAL RULES</span>
            <span className="font-bold text-slate-800 text-sm">{totalRules}</span>
          </div>
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800">
            <span className="text-emerald-600 block text-[10px] font-semibold">PASSED</span>
            <span className="font-bold text-sm">{passedRules}</span>
          </div>
          <div className="p-2 rounded-lg bg-rose-50 text-rose-800">
            <span className="text-rose-600 block text-[10px] font-semibold">DEFICIENT</span>
            <span className="font-bold text-sm">{failedRules}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-start space-x-1.5">
        <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
        <span>A 100% score indicates fulfilled application parameters and does not constitute regulatory approval.</span>
      </div>
    </div>
  );
};
