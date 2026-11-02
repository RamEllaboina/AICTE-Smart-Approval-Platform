import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, DEMO_CREDENTIALS } from '../../context/AuthContext';
import type { Role } from '../../types';
import { 
  Building2, 
  Bell, 
  LogOut, 
  UserCircle, 
  Check, 
  ChevronDown,
  Sparkles,
  Layers
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, quickSwitchRole } = useAuth();
  const navigate = useNavigate();
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  const handleRoleSelect = async (role: Role) => {
    setShowRoleSwitcher(false);
    await quickSwitchRole(role);
    if (role === 'INSTITUTION_ADMIN') navigate('/dashboard');
    else if (role === 'REVIEWER') navigate('/reviewer');
    else if (role === 'APPROVING_AUTHORITY') navigate('/approvals');
    else if (role === 'SYSTEM_ADMIN') navigate('/admin');
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Portal Identification */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-inner">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-base tracking-wide text-white">AICTE SMART APPROVAL</span>
                  <span className="bg-amber-500/20 text-amber-400 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-amber-500/30">
                    SIH26262
                  </span>
                </div>
                <p className="text-xs text-slate-400">All India Council for Technical Education</p>
              </div>
            </Link>
          </div>

          {/* Center: SIH Demo Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
              className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition"
              title="Quickly switch between all 4 roles for demonstration"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Demo Persona: <strong className="text-blue-400">{user?.role?.replace('_', ' ')}</strong></span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showRoleSwitcher && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white text-slate-800 shadow-xl border border-slate-200 py-2 z-50">
                <div className="px-3 py-1.5 text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
                  Select Demo Stakeholder
                </div>
                {(Object.keys(DEMO_CREDENTIALS) as Role[]).map((r) => {
                  const item = DEMO_CREDENTIALS[r];
                  const isSelected = user?.role === r;
                  return (
                    <button
                      key={r}
                      onClick={() => handleRoleSelect(r)}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-blue-50 flex items-start justify-between transition ${
                        isSelected ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-medium">{item.title}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[200px]">{item.subtitle}</div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-blue-600 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Navigation Controls */}
          <div className="flex items-center space-x-4">
            <Link
              to="/notifications"
              className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition relative"
              title="Notifications & Deadlines"
            >
              <Bell className="w-5 h-5" />
            </Link>

            {user ? (
              <div className="flex items-center space-x-3 border-l border-slate-800 pl-4">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-medium text-white">{user.full_name}</div>
                  <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                    {user.institution_name || user.email}
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
