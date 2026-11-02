import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { AdminStats } from '../types';
import { StatCard } from '../components/common/StatCard';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';
import { 
  LayoutDashboard, 
  Clock, 
  AlertTriangle, 
  Download, 
  RefreshCw, 
  Layers, 
  Users,
  CheckCircle2
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sweepMessage, setSweepMessage] = useState<string | null>(null);
  const [sweeping, setSweeping] = useState(false);

  const loadData = async () => {
    try {
      const data = await api.analytics.getAdminStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTriggerSweep = async () => {
    setSweeping(true);
    setSweepMessage(null);
    try {
      const resp = await api.admin.triggerDeadlineCheck();
      setSweepMessage(resp.message || 'Deadline sweep completed successfully.');
      await loadData();
    } catch (err: any) {
      setSweepMessage(err.message || 'Failed to trigger sweep.');
    } finally {
      setSweeping(false);
    }
  };

  if (loading || !stats) {
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

  // Prepare chart data
  const statusData = Object.entries(stats.status_distribution || {}).map(([key, value]) => ({
    name: key.replace(/_/g, ' '),
    count: value,
  }));

  const categoryData = Object.entries(stats.category_distribution || {}).map(([key, value]) => ({
    name: key.replace(/_/g, ' '),
    value: value,
  }));

  const COLORS = ['#2563EB', '#D97706', '#059669', '#DC2626', '#7C3AED', '#0891B2'];

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header and Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Operational & SLA Analytics</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time workflow bottleneck detection, reviewer workload balancing & compliance velocity
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleTriggerSweep}
            disabled={sweeping}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${sweeping ? 'animate-spin' : ''}`} />
            <span>Trigger Deadline Sweep</span>
          </button>

          <a
            href={api.admin.getExportUrl()}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {sweepMessage && (
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{sweepMessage}</span>
        </div>
      )}

      {/* Primary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Applications"
          value={stats.total_applications}
          subtitle="System-wide approval volume"
          icon={Layers}
          tone="blue"
        />
        <StatCard
          title="Avg Cycle Duration"
          value={`${stats.average_processing_days} Days`}
          subtitle="From submission to board decision"
          icon={Clock}
          tone="slate"
        />
        <StatCard
          title="Overdue Tasks"
          value={stats.overdue_count}
          subtitle="Escalation alerts active"
          icon={AlertTriangle}
          tone={stats.overdue_count > 0 ? 'rose' : 'emerald'}
        />
        <StatCard
          title="Active Reviewers"
          value={stats.reviewer_workloads.length}
          subtitle="Scrutiny committee capacity"
          icon={Users}
          tone="violet"
        />
      </div>

      {/* Bottleneck Detection Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Workflow Bottleneck Analysis</h3>
          <p className="text-xs text-slate-500">Stage duration monitoring against target SLA thresholds</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.bottlenecks.map((b) => {
            let badgeBg = 'bg-slate-100 text-slate-700';
            if (b.status_level === 'CRITICAL') badgeBg = 'bg-rose-100 text-rose-800 animate-pulse';
            else if (b.status_level === 'WARNING') badgeBg = 'bg-amber-100 text-amber-800';
            else badgeBg = 'bg-emerald-100 text-emerald-800';

            return (
              <div
                key={b.stage}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-slate-800">{b.stage_label}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeBg}`}>
                      {b.status_level}
                    </span>
                  </div>
                  <div className="text-2xl font-black text-slate-900">{b.active_count}</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Active Applications in stage</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] flex justify-between text-slate-600">
                  <span>Avg: <strong>{b.avg_hours_in_stage}h</strong></span>
                  <span>Target SLA: <strong>{b.target_sla_hours}h</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Volume by State</h3>
          <p className="text-xs text-slate-500 mb-4">Application counts across state machine lifecycle</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Pie Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Applications by Academic Stream</h3>
          <p className="text-xs text-slate-500 mb-4">Distribution by approval application category</p>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} (${((percent || 0) * 100).toFixed(0)}%)`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Reviewer Workload Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Reviewer Capacity & Workload Balance</h3>
          <p className="text-xs text-slate-500">Distribution of assigned scrutiny tasks across active reviewers</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Reviewer Name</th>
                <th className="px-6 py-3">Email Address</th>
                <th className="px-6 py-3">Active Assigned</th>
                <th className="px-6 py-3">Completed Scrutinies</th>
                <th className="px-6 py-3">Load Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.reviewer_workloads.map((r) => {
                const isHeavy = r.active_assigned > 3;
                return (
                  <tr key={r.reviewer_id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 font-bold text-slate-900">{r.reviewer_name}</td>
                    <td className="px-6 py-4 font-mono text-slate-500">{r.email}</td>
                    <td className="px-6 py-4 font-bold text-blue-600">{r.active_assigned}</td>
                    <td className="px-6 py-4 font-bold text-emerald-600">{r.completed}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          isHeavy ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isHeavy ? 'High Load' : 'Available'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
