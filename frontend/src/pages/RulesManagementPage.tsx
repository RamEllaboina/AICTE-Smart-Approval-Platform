import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { ComplianceRule } from '../types';
import { Sliders, BookOpen, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const RulesManagementPage: React.FC = () => {
  const [rules, setRules] = useState<ComplianceRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRules() {
      try {
        const data = await api.compliance.getActiveRules();
        setRules(data);
      } catch (err) {
        console.error('Failed to load rules:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRules();
  }, []);

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Statutory Compliance Rules Management</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configurable declarative rules traced to AICTE Approval Process Handbook (APH 2026-27) clauses
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 bg-slate-200 rounded-2xl animate-pulse" />
          ))
        ) : (
          rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {rule.rule_code}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      rule.severity === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-800'
                        : rule.severity === 'HIGH'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {rule.severity} SEVERITY
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900">{rule.name}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{rule.description}</p>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                {rule.handbook_reference && (
                  <div className="flex items-start space-x-1.5 text-blue-800 bg-blue-50/50 p-2 rounded-lg border border-blue-100 text-[11px]">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                    <span><strong>Statutory Citation:</strong> {rule.handbook_reference}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Type: {rule.rule_type}</span>
                  <span>Version: v{rule.version}.0</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
