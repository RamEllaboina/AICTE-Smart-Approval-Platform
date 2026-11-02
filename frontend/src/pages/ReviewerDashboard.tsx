import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { ApplicationItem, ReviewerStats } from '../types';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { 
  ClipboardCheck, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';

export const ReviewerDashboard: React.FC = () => {
  const [stats, setStats] = useState<ReviewerStats | null>(null);
  const [assignedApps, setAssignedApps] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, appsData] = await Promise.all([
          api.analytics.getReviewerStats(),
          api.reviews.getAssigned(),
        ]);
        setStats(statsData);
        setAssignedApps(appsData);
      } catch (err) {
        console.error('Failed to load reviewer workspace:', err);
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
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reviewer Scrutiny Workspace</h1>
        <p className="text-xs text-slate-500 mt-1">
          Expert committee dossier examination, observation recording, and deficiency issuance
        </p>
      </div>

      {/* Reviewer Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Dossiers"
          value={stats?.assigned_count || 0}
          subtitle="Total allocated for scrutiny"
          icon={ClipboardCheck}
          tone="blue"
        />
        <StatCard
          title="Under Scrutiny"
          value={stats?.under_scrutiny_count || 0}
          subtitle="Actively in evaluation"
          icon={Clock}
          tone="amber"
        />
        <StatCard
          title="Open Deficiencies"
          value={stats?.open_deficiencies_count || 0}
          subtitle="Awaiting institutional response"
          icon={AlertTriangle}
          tone="rose"
        />
        <StatCard
          title="Reviews Completed"
          value={stats?.review_completed_count || 0}
          subtitle="Recommendation submitted"
          icon={CheckCircle}
          tone="emerald"
        />
      </div>

      {/* Assigned Applications Queue */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Assigned Applications Queue</h3>
            <p className="text-xs text-slate-500">Examine statutory documents, evaluate compliance, and record observations</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
            {assignedApps.length} Assigned
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Reference No.</th>
                <th className="px-6 py-3">Institution Name</th>
                <th className="px-6 py-3">Proposal Title</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Readiness Score</th>
                <th className="px-6 py-3">Deadline</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assignedApps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No applications currently assigned for review. Check back later or contact System Admin.
                  </td>
                </tr>
              ) : (
                assignedApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{app.application_number}</td>
                    <td className="px-6 py-4 font-medium text-slate-800 max-w-[180px] truncate">{app.institution_name}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800 max-w-xs truncate">{app.title}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900">{app.compliance_score}%</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-500 text-[11px]">
                      {app.deadline_date ? new Date(app.deadline_date).toLocaleDateString() : '7 Days'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/applications/${app.id}`}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-xs transition"
                      >
                        <span>Examine Dossier</span>
                        <ArrowRight className="w-3.5 h-3.5" />
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
