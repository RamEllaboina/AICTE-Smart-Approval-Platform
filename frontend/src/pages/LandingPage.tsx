import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth, DEMO_CREDENTIALS } from '../context/AuthContext';
import type { Role } from '../types';
import { 
  Building2, 
  ShieldCheck, 
  Sliders, 
  Clock, 
  History, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  FileCheck,
  AlertCircle
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { quickSwitchRole } = useAuth();

  const handleQuickLogin = async (role: Role) => {
    await quickSwitchRole(role);
    if (role === 'INSTITUTION_ADMIN') window.location.href = '/dashboard';
    else if (role === 'REVIEWER') window.location.href = '/reviewer';
    else if (role === 'APPROVING_AUTHORITY') window.location.href = '/approvals';
    else if (role === 'SYSTEM_ADMIN') window.location.href = '/admin';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-inner">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base tracking-wide text-white">AICTE SMART APPROVAL PLATFORM</span>
              <p className="text-[11px] text-slate-400">All India Council for Technical Education &bull; SIH26262</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to="/login"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition"
            >
              Stakeholder Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Smart India Hackathon 2026 &bull; Problem Statement SIH26262</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight">
            Workflow Automation & <span className="text-blue-600">Compliance Monitoring</span> Platform
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            A centralized, deterministic, and transparent workflow platform for institutional approval intake, automated statutory norm validation, multi-tier reviewer coordination, proactive deadline escalation, and tamper-evident audit trails.
          </p>

          {/* Prototype Disclaimer Banner */}
          <div className="mt-6 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 text-left flex items-start space-x-2.5 max-w-2xl mx-auto">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <strong className="font-bold">SIH Demonstration Notice: </strong>
              <span>
                This is a proposed demonstration prototype built for Smart India Hackathon 2026. All institutional records and regulatory evaluations utilize synthetic demonstration data based on the AICTE Approval Process Handbook (APH 2026-27).
              </span>
            </div>
          </div>
        </div>

        {/* 1-Click Demo Persona Launchpad */}
        <div className="mt-12 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-md">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-slate-900">Instant Demo Stakeholder Login</h2>
            <p className="text-xs text-slate-500">Select any role below to test the end-to-end workflow immediately without manual credential entry</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(Object.keys(DEMO_CREDENTIALS) as Role[]).map((roleKey) => {
              const creds = DEMO_CREDENTIALS[roleKey];
              let iconColor = 'bg-blue-50 text-blue-600 border-blue-100';
              if (roleKey === 'REVIEWER') iconColor = 'bg-amber-50 text-amber-600 border-amber-100';
              if (roleKey === 'APPROVING_AUTHORITY') iconColor = 'bg-emerald-50 text-emerald-600 border-emerald-100';
              if (roleKey === 'SYSTEM_ADMIN') iconColor = 'bg-purple-50 text-purple-600 border-purple-100';

              return (
                <button
                  key={roleKey}
                  onClick={() => handleQuickLogin(roleKey)}
                  className="text-left p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition bg-slate-50/50 hover:bg-white group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Persona</span>
                    <span className={`p-1.5 rounded-lg border text-xs ${iconColor}`}>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition">
                    {creds.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 truncate">{creds.subtitle}</p>
                  <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] font-mono text-slate-400">
                    {creds.email}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Core Architectural Pillars */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mb-4">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Deterministic Compliance Engine</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Transparent evaluation of statutory norms (carpet area ratios, contiguous land acreage, faculty-student cadre ratios, required NOCs) with explainable citations and remediation advice.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Deadline & Escalation Alerting</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Multi-tiered monitoring with automated 72-hour notifications, 24-hour urgency alerts, and overdue escalations preventing administrative backlogs and review bottlenecks.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mb-4">
              <History className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Immutable Audit Traceability</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Append-only audit log capturing all workflow state transitions, document uploads, reviewer scrutiny comments, deficiency notices, and concurrence decisions with cryptographic SHA-256 integrity.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-8 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between">
          <div>
            <span className="font-bold text-white">AICTE Smart Approval Platform</span> &bull; Smart India Hackathon 2026 (SIH26262)
          </div>
          <div className="mt-4 sm:mt-0 text-slate-400">
            Engineered with FastAPI, React, PostgreSQL & Celery
          </div>
        </div>
      </footer>
    </div>
  );
};
