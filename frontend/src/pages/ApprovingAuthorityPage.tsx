import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { ApplicationItem } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { 
  ShieldCheck, 
  Award, 
  XCircle, 
  RefreshCw, 
  ExternalLink,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const ApprovingAuthorityPage: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Decision Modal
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);
  const [decision, setDecision] = useState('APPROVED');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.applications.list();
      // Filter applications that are in review completed or pending final decision or approved/rejected
      setApplications(data);
    } catch (err) {
      console.error('Error fetching applications for approving board:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCommitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    setSubmitting(true);
    try {
      await api.reviews.recordFinalDecision(selectedApp.id, decision, reason);
      setSelectedApp(null);
      setReason('');
      await loadData();
    } catch (err) {
      console.error('Decision submission failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Approving Authority Board</h1>
          <p className="text-xs text-slate-500 mt-1">
            Statutory concurrence, final regulatory grant, and institutional approval resolutions
          </p>
        </div>
      </div>

      {/* Decision Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Final Decision Docket</h3>
            <p className="text-xs text-slate-500">Examine committee recommendations and commit formal statutory orders</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-50 text-violet-700">
            {applications.length} Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Reference No.</th>
                <th className="px-6 py-3.5">Institution</th>
                <th className="px-6 py-3.5">Proposal Title</th>
                <th className="px-6 py-3.5">Current State</th>
                <th className="px-6 py-3.5">Readiness Score</th>
                <th className="px-6 py-3.5 text-right">Commit Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="h-5 bg-slate-100 rounded" />
                    </td>
                  </tr>
                ))
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No applications ready for final decision.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {app.application_number}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800 max-w-[180px] truncate">
                      {app.institution_name}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800 max-w-xs truncate">
                      {app.title}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900">{app.compliance_score}%</span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link
                        to={`/applications/${app.id}`}
                        className="inline-flex items-center px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setDecision('APPROVED');
                          setReason('');
                        }}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-violet-700 hover:bg-violet-600 text-white font-semibold shadow-xs transition"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Decide</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision Modal */}
      {selectedApp && (
        <Modal
          isOpen={Boolean(selectedApp)}
          onClose={() => setSelectedApp(null)}
          title={`Record Decision: ${selectedApp.application_number}`}
        >
          <form onSubmit={handleCommitDecision} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Formal Statutory Order *
              </label>
              <select
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
              >
                <option value="APPROVED">Grant Statutory Approval (APPROVED)</option>
                <option value="REJECTED">Reject Approval Intake (REJECTED)</option>
                <option value="RETURNED_FOR_CORRECTION">Return for Institutional Remediation</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Concurrence Rationale & Official Gazette Notes *
              </label>
              <textarea
                required
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter statutory council rationale, meeting reference number, and concurrence notes..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-violet-700 hover:bg-violet-600 text-white font-semibold shadow-sm disabled:opacity-50"
              >
                {submitting ? 'Recording...' : 'Commit Formal Order'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
