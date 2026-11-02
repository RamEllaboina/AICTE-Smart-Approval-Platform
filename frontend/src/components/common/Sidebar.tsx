import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  ClipboardCheck, 
  ShieldCheck, 
  Sliders, 
  History, 
  Building,
  Bell,
  HelpCircle
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role;

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition ${
      isActive
        ? 'bg-blue-600 text-white shadow-sm font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4">
      <div className="space-y-6">
        {/* Role identification tag */}
        <div className="px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
          <div className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Stakeholder Scope</div>
          <div className="text-xs font-bold text-slate-800 mt-0.5">
            {role ? role.replace('_', ' ') : 'Guest User'}
          </div>
        </div>

        {/* Institution Admin Navigation */}
        {role === 'INSTITUTION_ADMIN' && (
          <nav className="space-y-1">
            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider px-3 mb-2">Portal Services</div>
            <NavLink to="/dashboard" className={linkClass}>
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview Dashboard</span>
            </NavLink>
            <NavLink to="/applications" className={linkClass} end>
              <FileText className="w-4 h-4" />
              <span>My Applications</span>
            </NavLink>
            <NavLink to="/applications/new" className={linkClass}>
              <PlusCircle className="w-4 h-4" />
              <span>New Approval Intake</span>
            </NavLink>
            <NavLink to="/institution/profile" className={linkClass}>
              <Building className="w-4 h-4" />
              <span>Institutional Profile</span>
            </NavLink>
          </nav>
        )}

        {/* Reviewer Navigation */}
        {role === 'REVIEWER' && (
          <nav className="space-y-1">
            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider px-3 mb-2">Reviewer Workspace</div>
            <NavLink to="/reviewer" className={linkClass} end>
              <ClipboardCheck className="w-4 h-4" />
              <span>Assigned Scrutiny Queue</span>
            </NavLink>
            <NavLink to="/notifications" className={linkClass}>
              <Bell className="w-4 h-4" />
              <span>Deadlines & Reminders</span>
            </NavLink>
          </nav>
        )}

        {/* Approving Authority Navigation */}
        {role === 'APPROVING_AUTHORITY' && (
          <nav className="space-y-1">
            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider px-3 mb-2">Authority Board</div>
            <NavLink to="/approvals" className={linkClass}>
              <ShieldCheck className="w-4 h-4" />
              <span>Final Approvals Queue</span>
            </NavLink>
            <NavLink to="/admin" className={linkClass}>
              <LayoutDashboard className="w-4 h-4" />
              <span>Operational Metrics</span>
            </NavLink>
          </nav>
        )}

        {/* System Admin Navigation */}
        {role === 'SYSTEM_ADMIN' && (
          <nav className="space-y-1">
            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider px-3 mb-2">Administration</div>
            <NavLink to="/admin" className={linkClass} end>
              <LayoutDashboard className="w-4 h-4" />
              <span>System Analytics</span>
            </NavLink>
            <NavLink to="/applications" className={linkClass}>
              <FileText className="w-4 h-4" />
              <span>Global Applications</span>
            </NavLink>
            <NavLink to="/admin/rules" className={linkClass}>
              <Sliders className="w-4 h-4" />
              <span>Compliance Rules & SLA</span>
            </NavLink>
            <NavLink to="/admin/audit" className={linkClass}>
              <History className="w-4 h-4" />
              <span>Immutable Audit Logs</span>
            </NavLink>
          </nav>
        )}
      </div>

      {/* Footer Info Box */}
      <div className="mt-6 p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-slate-600 text-[11px] leading-relaxed">
        <div className="font-semibold text-blue-900 flex items-center space-x-1.5 mb-1">
          <HelpCircle className="w-3.5 h-3.5 text-blue-700" />
          <span>APH 2026-27 Compliant</span>
        </div>
        Deterministic validation engine active. All decisions recorded with actor cryptographic traceability.
      </div>
    </aside>
  );
};
