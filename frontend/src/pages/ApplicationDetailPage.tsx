import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { 
  ApplicationDetail, 
  ComplianceEvaluation, 
  DeficiencyItem, 
  ReviewComment 
} from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { WorkflowTimeline } from '../components/workflow/WorkflowTimeline';
import { ComplianceScoreGauge } from '../components/compliance/ComplianceScoreGauge';
import { ComplianceFindingsList } from '../components/compliance/ComplianceFindingsList';
import { Modal } from '../components/common/Modal';
import { 
  ArrowLeft, 
  Send, 
  Upload, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  RefreshCw,
  MessageSquare,
  ShieldAlert,
  Award
} from 'lucide-react';

export const ApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const role = user?.role;

  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [evaluation, setEvaluation] = useState<ComplianceEvaluation | null>(null);
  const [deficiencies, setDeficiencies] = useState<DeficiencyItem[]>([]);
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('LAND_DOCUMENTS');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const [isDeficiencyModalOpen, setIsDeficiencyModalOpen] = useState(false);
  const [defTitle, setDefTitle] = useState('');
  const [defDesc, setDefDesc] = useState('');
  const [defCorrection, setDefCorrection] = useState('');

  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [decisionType, setDecisionType] = useState('APPROVED');
  const [decisionReason, setDecisionReason] = useState('');

  const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
  const [observationContent, setObservationContent] = useState('');
  const [observationRec, setObservationRec] = useState('RECOMMENDED');

  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [selectedDeficiencyId, setSelectedDeficiencyId] = useState<string | null>(null);
  const [responseNotes, setResponseNotes] = useState('');

  const loadAllData = async () => {
    if (!id) return;
    try {
      const [appData, evalData, defData, commData] = await Promise.all([
        api.applications.get(id),
        api.compliance.get(id),
        api.reviews.getDeficiencies(id),
        api.reviews.getComments(id),
      ]);
      setApplication(appData);
      setEvaluation(evalData);
      setDeficiencies(defData);
      setComments(commData);
    } catch (err) {
      console.error('Failed to load application dossier:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [id]);

  const handleRunEvaluation = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const newEval = await api.compliance.evaluate(id);
      setEvaluation(newEval);
      const updatedApp = await api.applications.get(id);
      setApplication(updatedApp);
    } finally {
      setActionLoading(false);
    }
  };

  const handleInstitutionalSubmit = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await api.applications.submit(id);
      await loadAllData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !uploadFile) return;
    setActionLoading(true);
    try {
      await api.documents.upload(id, uploadCategory, uploadTitle, uploadFile);
      setIsUploadModalOpen(false);
      setUploadTitle('');
      setUploadFile(null);
      await loadAllData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleIssueDeficiencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setActionLoading(true);
    try {
      await api.reviews.issueDeficiency(id, {
        title: defTitle,
        description: defDesc,
        requested_correction: defCorrection,
        severity: 'HIGH',
        due_days: 7,
      });
      setIsDeficiencyModalOpen(false);
      setDefTitle('');
      setDefDesc('');
      setDefCorrection('');
      await loadAllData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setActionLoading(true);
    try {
      await api.reviews.recordFinalDecision(id, decisionType, decisionReason);
      setIsDecisionModalOpen(false);
      setDecisionReason('');
      await loadAllData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleObservationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setActionLoading(true);
    try {
      await api.reviews.addComment(id, {
        stage: application?.status || 'UNDER_REVIEW',
        comment_type: 'FORMAL_RECOMMENDATION',
        content: observationContent,
        recommendation: observationRec,
      });
      setIsObservationModalOpen(false);
      setObservationContent('');
      await loadAllData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleResponseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeficiencyId) return;
    setActionLoading(true);
    try {
      await api.reviews.respondDeficiency(selectedDeficiencyId, {
        response_notes: responseNotes,
      });
      setIsResponseModalOpen(false);
      setSelectedDeficiencyId(null);
      setResponseNotes('');
      await loadAllData();
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !application) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-10 bg-slate-200 rounded-lg w-1/3 animate-pulse" />
        <div className="h-64 bg-slate-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const isInstAdmin = role === 'INSTITUTION_ADMIN';
  const isReviewer = role === 'REVIEWER';
  const isApprover = role === 'APPROVING_AUTHORITY';
  const isAdmin = role === 'SYSTEM_ADMIN';

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Back button & Dossier Identification */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            to="/applications"
            className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Applications Directory</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{application.application_number}</h1>
            <StatusBadge status={application.status} size="lg" />
            <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-slate-100 text-slate-700">
              Rev #{application.current_revision}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-700 mt-1">{application.title}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {application.institution_name} &bull; Academic Year {application.academic_year} &bull; {application.category.replace(/_/g, ' ')}
          </p>
        </div>

        {/* Role-governed Workflow Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Institutional Actions */}
          {(isInstAdmin || isAdmin) &&
            (application.status === 'DRAFT' || application.status === 'RETURNED_FOR_CORRECTION') && (
              <>
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs"
                >
                  <Upload className="w-4 h-4 text-slate-600" />
                  <span>Attach Document</span>
                </button>
                <button
                  onClick={handleInstitutionalSubmit}
                  disabled={actionLoading}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>{application.status === 'RETURNED_FOR_CORRECTION' ? 'Resubmit Corrected Dossier' : 'Submit for Review'}</span>
                </button>
              </>
            )}

          {/* Reviewer Actions */}
          {(isReviewer || isAdmin) &&
            (application.status === 'PENDING_REVIEW' || application.status === 'UNDER_REVIEW') && (
              <>
                <button
                  onClick={() => setIsDeficiencyModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100 text-xs font-bold transition"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Issue Deficiency Notice</span>
                </button>
                <button
                  onClick={() => setIsObservationModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Record Scrutiny Recommendation</span>
                </button>
              </>
            )}

          {/* Approving Authority Actions */}
          {(isApprover || isAdmin) && (
            <button
              onClick={() => setIsDecisionModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-violet-700 hover:bg-violet-600 text-white text-xs font-bold transition shadow-sm"
            >
              <Award className="w-4 h-4" />
              <span>Record Final Statutory Decision</span>
            </button>
          )}

          <button
            onClick={handleRunEvaluation}
            disabled={actionLoading}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
            title="Re-run Compliance Engine"
          >
            <RefreshCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Workflow Timeline Component */}
      <WorkflowTimeline
        currentStatus={application.status}
        history={application.transition_history || []}
      />

      {/* Grid: Compliance Engine & Detailed Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Readiness Score */}
        <div className="lg:col-span-1 space-y-6">
          <ComplianceScoreGauge
            score={evaluation?.readiness_score || application.compliance_score}
            totalRules={evaluation?.total_rules || 0}
            passedRules={evaluation?.passed_rules || 0}
            failedRules={evaluation?.failed_rules || 0}
          />

          {/* Structured Parameters Snapshot */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Statutory Metrics Snapshot</h4>
            <div className="space-y-2 text-xs divide-y divide-slate-100">
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Built-up Area:</span>
                <span className="font-bold text-slate-800">{application.details_json?.built_up_area_sqm || 0} sq.m</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Contiguous Land:</span>
                <span className="font-bold text-slate-800">{application.details_json?.land_area_acres || 0} Acres</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Full-time Faculty:</span>
                <span className="font-bold text-slate-800">{application.details_json?.total_faculty_count || 0} Members</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Student Capacity:</span>
                <span className="font-bold text-slate-800">{application.details_json?.total_approved_intake || 0} Seats</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Security Corpus Fund:</span>
                <span className="font-bold text-slate-800">INR {application.details_json?.corpus_fund_lakhs || 0} Lakhs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Explainable Findings & Remediation */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Statutory Norms & Compliance Findings</h3>
                <p className="text-xs text-slate-500">Deterministic explainable evaluation with handbook citations</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                {evaluation?.findings?.length || 0} Rules Evaluated
              </span>
            </div>

            <ComplianceFindingsList findings={evaluation?.findings || []} />
          </div>
        </div>
      </div>

      {/* Deficiencies Management Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Deficiency Notices & Rectifications</h3>
            <p className="text-xs text-slate-500">Scrutiny committee discrepancy notifications and institutional responses</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            {deficiencies.length} Notices Issued
          </span>
        </div>

        {deficiencies.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            No deficiency notices issued on this application dossier.
          </div>
        ) : (
          <div className="space-y-3">
            {deficiencies.map((d) => (
              <div
                key={d.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">{d.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        d.status === 'OPEN'
                          ? 'bg-rose-100 text-rose-800'
                          : d.status === 'SUBMITTED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {d.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Due: {new Date(d.due_date).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-slate-600">{d.description}</p>

                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="font-semibold text-slate-800 block text-[11px] mb-0.5">Required Correction:</span>
                  <p className="text-slate-600">{d.requested_correction}</p>
                </div>

                {/* Existing responses */}
                {d.responses && d.responses.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/60 space-y-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Institutional Rectification History:</span>
                    {d.responses.map((r) => (
                      <div key={r.id} className="p-2 bg-blue-50/60 rounded-lg border border-blue-100 text-slate-700">
                        <p>{r.response_notes}</p>
                        <span className="text-[10px] text-slate-400 font-mono block mt-1">
                          Submitted: {new Date(r.submitted_at).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Institution Respond Button */}
                {isInstAdmin && d.status === 'OPEN' && (
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setSelectedDeficiencyId(d.id);
                        setIsResponseModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition"
                    >
                      Submit Rectification Response
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Supporting Documents Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Statutory Documents & Digital Proofs</h3>
            <p className="text-xs text-slate-500">Cryptographically verified uploads with SHA-256 integrity checksums</p>
          </div>
          {(isInstAdmin || isAdmin) && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Document Title</th>
                <th className="px-4 py-3">File Name</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">SHA-256 Checksum</th>
                <th className="px-4 py-3 text-right">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {application.documents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No documents uploaded yet. Upload Land Title Deed, Building Plan, and Fire NOC.
                  </td>
                </tr>
              ) : (
                application.documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                        {doc.category.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{doc.title}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">{doc.file_name}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {(doc.file_size_bytes / 1024).toFixed(1)} KB
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] text-slate-400 truncate max-w-[120px]">
                      {doc.sha256_checksum}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={api.documents.getDownloadUrl(doc.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-slate-200 text-blue-600 hover:bg-blue-50 font-semibold transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Observations and Review Comments Log */}
      {comments.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Expert Review Observations & Final Concurrence Notes
          </h3>
          <div className="space-y-3">
            {comments.map((c) => (
              <div key={c.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-800">{c.comment_type.replace(/_/g, ' ')}</span>
                    {c.recommendation && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.recommendation === 'RECOMMENDED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {c.recommendation}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(c.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed">{c.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Upload Document */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Supporting Document"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Document Category *
            </label>
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
            >
              <option value="LAND_DOCUMENTS">Land Title Deed / Ownership Document</option>
              <option value="BUILDING_PLAN">Approved Building Plan & Completion Certificate</option>
              <option value="FIRE_SAFETY_NOC">Fire & Life Safety NOC</option>
              <option value="FACULTY_LIST">Approved Faculty List & Qualifications</option>
              <option value="AUDITED_ACCOUNTS">Audited Balance Sheet & Financial Statements</option>
              <option value="OTHER">Other Supplementary Document</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Document Title / Label *
            </label>
            <input
              type="text"
              required
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder="e.g. Registered Land Deed 2026"
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select PDF / Image File *
            </label>
            <input
              type="file"
              required
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading || !uploadFile}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-sm disabled:opacity-50"
            >
              {actionLoading ? 'Uploading...' : 'Save & Checksum'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Issue Deficiency */}
      <Modal
        isOpen={isDeficiencyModalOpen}
        onClose={() => setIsDeficiencyModalOpen(false)}
        title="Issue Deficiency Notice"
      >
        <form onSubmit={handleIssueDeficiencySubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Deficiency Title *
            </label>
            <input
              type="text"
              required
              value={defTitle}
              onChange={(e) => setDefTitle(e.target.value)}
              placeholder="e.g. Fire & Life Safety NOC Expired"
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description of Discrepancy *
            </label>
            <textarea
              required
              rows={3}
              value={defDesc}
              onChange={(e) => setDefDesc(e.target.value)}
              placeholder="Detail the specific deficiency identified during physical/digital scrutiny..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Mandatory Corrective Action Required *
            </label>
            <textarea
              required
              rows={2}
              value={defCorrection}
              onChange={(e) => setDefCorrection(e.target.value)}
              placeholder="Provide clear rectification instructions for the institution..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsDeficiencyModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-sm disabled:opacity-50"
            >
              {actionLoading ? 'Issuing...' : 'Issue Notice & Set Deadline'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Record Observation */}
      <Modal
        isOpen={isObservationModalOpen}
        onClose={() => setIsObservationModalOpen(false)}
        title="Record Scrutiny Observation & Recommendation"
      >
        <form onSubmit={handleObservationSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Scrutiny Recommendation *
            </label>
            <select
              value={observationRec}
              onChange={(e) => setObservationRec(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
            >
              <option value="RECOMMENDED">Recommended for Approval</option>
              <option value="DEFICIENCY_FOUND">Deficiencies Identified</option>
              <option value="NOT_RECOMMENDED">Not Recommended</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Scrutiny Observation Notes *
            </label>
            <textarea
              required
              rows={4}
              value={observationContent}
              onChange={(e) => setObservationContent(e.target.value)}
              placeholder="Detail observations regarding laboratory space, faculty verification, and building compliance..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsObservationModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold shadow-sm disabled:opacity-50"
            >
              {actionLoading ? 'Recording...' : 'Submit Formal Observation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Approving Authority Decision */}
      <Modal
        isOpen={isDecisionModalOpen}
        onClose={() => setIsDecisionModalOpen(false)}
        title="Approving Authority Statutory Decision"
      >
        <form onSubmit={handleDecisionSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Formal Decision *
            </label>
            <select
              value={decisionType}
              onChange={(e) => setDecisionType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
            >
              <option value="APPROVED">Grant Formal Approval (APPROVED)</option>
              <option value="REJECTED">Reject Application (REJECTED)</option>
              <option value="RETURNED_FOR_CORRECTION">Return for Institutional Remediation</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Concurrence Rationale & Decision Notes *
            </label>
            <textarea
              required
              rows={4}
              value={decisionReason}
              onChange={(e) => setDecisionReason(e.target.value)}
              placeholder="Enter official committee decision rationale for public records..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsDecisionModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 rounded-xl bg-violet-700 hover:bg-violet-600 text-white font-semibold shadow-sm disabled:opacity-50"
            >
              {actionLoading ? 'Recording Decision...' : 'Commit Statutory Decision'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Respond to Deficiency */}
      <Modal
        isOpen={isResponseModalOpen}
        onClose={() => setIsResponseModalOpen(false)}
        title="Submit Rectification Response"
      >
        <form onSubmit={handleResponseSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Institutional Response & Explanation *
            </label>
            <textarea
              required
              rows={4}
              value={responseNotes}
              onChange={(e) => setResponseNotes(e.target.value)}
              placeholder="Describe how the deficiency was addressed, referencing any uploaded documents..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsResponseModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-sm disabled:opacity-50"
            >
              {actionLoading ? 'Submitting...' : 'Submit Rectification'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
