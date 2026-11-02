import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { InstitutionStats, ApplicationItem, DeadlineItem } from '../types';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { 
  FileText, 
  Clock, 
  AlertTriangle, 
  Award, 
  PlusCircle, 
  ArrowRight,
  Calendar,
  Building
} from 'lucide-react';

export const InstitutionDashboard: React.FC = () => {
  const [stats, setStats] = useState<InstitutionStats | null>(null);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, appsData, deadlinesData] = await Promise.all([
          api.analytics.getInstitutionStats(),
          api.applications.list(),
          api.notifications.getDeadlines(),
        ]);
        setStats(statsData);
        setApplications(appsData);
        setDeadlines(deadlinesData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 bg-slate-200 rounded-lg w-1/4 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 space-y-8">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Institutional Approval Workspace</h1>
          <p className="text-xs text-slate-500 mt-1">
            Application submission tracking, automated compliance validation & deficiency rectifications
          </p>
        </div>
        <Link
          to="/applications/new"
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Approval Intake</span>
        </Link>
      </div>

      {/* Primary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Intakes"
          value={stats?.total_applications || 0}
          subtitle="All academic categories"
          icon={FileText}
          tone="blue"
        />
        <StatCard
          title="Under Review"
          value={stats?.under_review_count || 0}
          subtitle="Awaiting committee scrutiny"
          icon={Clock}
          tone="amber"
        />
        <StatCard
          title="Deficiencies Issued"
          value={stats?.pending_deficiencies_count || 0}
          subtitle="Immediate institutional response needed"
          icon={AlertTriangle}
          tone="rose"
        />
        <StatCard
          title="Approved Programs"
          value={stats?.approved_count || 0}
          subtitle="Statutory concurrence granted"
          icon={Award}
          tone="emerald"
        />
      </div>

      {/* Deadlines Alert Banner if Any */}
      {deadlines.length > 0 && (
        <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200 shadow-xs">
          <div className="flex items-center space-x-2 mb-3">
            <Calendar className="w-4 h-4 text-amber-700" />
            <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              Critical Upcoming Statutory Deadlines ({deadlines.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {deadlines.map((dl) => (
              <div
                key={dl.id}
                className="p-3 bg-white rounded-xl border border-amber-200 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-800">{dl.task_type.replace(/_/g, ' ')}</span>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Due Date: {new Date(dl.due_date).toLocaleDateString()}
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    dl.is_overdue
                      ? 'bg-rose-100 text-rose-800 animate-pulse'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {dl.is_overdue ? 'OVERDUE' : `${Math.round(dl.hours_remaining)} hrs remaining`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Active Approval Applications</h3>
            <p className="text-xs text-slate-500">Track real-time workflow state and compliance readiness</p>
          </div>
          <Link
            to="/applications"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Reference No.</th>
                <th className="px-6 py-3">Proposal / Program Title</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Current Status</th>
                <th className="px-6 py-3">Compliance Score</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No applications submitted yet. Click "New Approval Intake" to begin.
                  </td>
                </tr>
              ) : (
                applications.slice(0, 5).map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{app.application_number}</td>
                    <td className="px-6 py-4 font-medium text-slate-800 max-w-xs truncate">{app.title}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {app.category.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-800">{app.compliance_score}%</span>
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              app.compliance_score >= 80 ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${app.compliance_score}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/applications/${app.id}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
