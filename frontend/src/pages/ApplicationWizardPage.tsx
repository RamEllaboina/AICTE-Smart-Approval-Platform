import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { 
  Building2, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Save, 
  Send, 
  AlertCircle,
  FileCheck,
  CheckCircle2
} from 'lucide-react';

export const ApplicationWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'NEW_PROGRAM',
    academic_year: '2026-2027',
    program_name: '',
    proposed_intake: 60,
    total_approved_intake: 300,
    built_up_area_sqm: 1600.0,
    land_area_acres: 3.0,
    total_faculty_count: 18,
    corpus_fund_lakhs: 60.0,
    has_barrier_free_environment: true,
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep === 1 && (!formData.title || !formData.program_name)) {
      setError('Please provide a proposal title and program name.');
      return;
    }
    setError(null);
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmitDraft = async (shouldSubmit: boolean) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const app = await api.applications.create({
        title: formData.title,
        category: formData.category,
        academic_year: formData.academic_year,
        details_json: {
          program_name: formData.program_name,
          proposed_intake: Number(formData.proposed_intake),
          total_approved_intake: Number(formData.total_approved_intake),
          built_up_area_sqm: Number(formData.built_up_area_sqm),
          land_area_acres: Number(formData.land_area_acres),
          total_faculty_count: Number(formData.total_faculty_count),
          corpus_fund_lakhs: Number(formData.corpus_fund_lakhs),
          has_barrier_free_environment: Boolean(formData.has_barrier_free_environment),
        },
      });

      if (shouldSubmit) {
        await api.applications.submit(app.id);
      }

      navigate(`/applications/${app.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to save application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">New Technical Approval Intake</h1>
        <p className="text-xs text-slate-500 mt-1">
          Structured submission dossier complying with AICTE Approval Process Handbook (APH 2026-27)
        </p>
      </div>

      {/* Wizard Step Indicator */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        {[
          { num: 1, label: 'Intake Details' },
          { num: 2, label: 'Infrastructure & Land' },
          { num: 3, label: 'Faculty & Finance' },
          { num: 4, label: 'Review & Verify' },
        ].map((step) => {
          const isDone = step.num < currentStep;
          const isCurrent = step.num === currentStep;
          return (
            <div key={step.num} className="flex items-center space-x-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                  isDone
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isDone ? <Check className="w-4 h-4" /> : step.num}
              </div>
              <span
                className={`text-xs hidden sm:inline font-medium ${
                  isCurrent ? 'text-blue-700 font-bold' : isDone ? 'text-slate-800' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Wizard Step Content */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        {/* Step 1: Program Details */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Proposal Identification & Program Stream
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Proposal Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g. Introduction of B.Tech in Artificial Intelligence & Machine Learning (60 Seats)"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Approval Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="NEW_PROGRAM">New Technical Program</option>
                  <option value="INTAKE_MODIFICATION">Intake Expansion / Modification</option>
                  <option value="INSTITUTION_UPDATE">Institutional Information Update</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Academic Year
                </label>
                <input
                  type="text"
                  value={formData.academic_year}
                  onChange={(e) => handleChange('academic_year', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-600"
                  readOnly
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Degree / Program Specialization *
                </label>
                <input
                  type="text"
                  value={formData.program_name}
                  onChange={(e) => handleChange('program_name', e.target.value)}
                  placeholder="e.g. Artificial Intelligence & Machine Learning"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Proposed Student Intake (Seats) *
                </label>
                <input
                  type="number"
                  value={formData.proposed_intake}
                  onChange={(e) => handleChange('proposed_intake', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Infrastructure & Land */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Statutory Land & Built-up Area Requirements
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Total Contiguous Land (Acres) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.land_area_acres}
                  onChange={(e) => handleChange('land_area_acres', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">AICTE Norm: Min 2.5 Acres for Mega/Metro cities</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Instructional Built-up Carpet Area (sq.m) *
                </label>
                <input
                  type="number"
                  value={formData.built_up_area_sqm}
                  onChange={(e) => handleChange('built_up_area_sqm', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">AICTE Norm: At least 4.0 sq.m per total student intake</span>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition">
                <input
                  type="checkbox"
                  checked={formData.has_barrier_free_environment}
                  onChange={(e) => handleChange('has_barrier_free_environment', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-xs text-slate-700 font-medium">
                  Institution possesses barrier-free environment, ramps, and accessible facilities for Divyangjan
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Step 3: Faculty & Finance */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Cadre Ratio, Faculty & Corpus Security Deposit
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Total Approved Student Intake (Total Capacity)
                </label>
                <input
                  type="number"
                  value={formData.total_approved_intake}
                  onChange={(e) => handleChange('total_approved_intake', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full-time Qualified Faculty Count *
                </label>
                <input
                  type="number"
                  value={formData.total_faculty_count}
                  onChange={(e) => handleChange('total_faculty_count', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">AICTE Cadre Norm: 1:20 Faculty-to-Student Ratio</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                FDR / Corpus Reserve Fund (Lakhs INR)
              </label>
              <input
                type="number"
                value={formData.corpus_fund_lakhs}
                onChange={(e) => handleChange('corpus_fund_lakhs', e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Statutory norm: Minimum INR 50 Lakhs joint corpus</span>
            </div>
          </div>
        )}

        {/* Step 4: Verification & Submission */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Pre-Submission Dossier Review
            </h3>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Proposal Title:</span>
                <span className="font-bold text-slate-900 text-right">{formData.title}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Specialization & Intake:</span>
                <span className="font-semibold text-slate-800">{formData.program_name} ({formData.proposed_intake} Seats)</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Land & Built-up Area:</span>
                <span className="font-semibold text-slate-800">{formData.land_area_acres} Acres &bull; {formData.built_up_area_sqm} sq.m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Faculty & Security Fund:</span>
                <span className="font-semibold text-slate-800">{formData.total_faculty_count} Faculty &bull; INR {formData.corpus_fund_lakhs} Lakhs</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-800 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <span>
                You can save this application as a draft to attach supporting PDFs (Land Deeds, Building Plans, Fire NOC) before final submission, or submit directly for automated evaluation.
              </span>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : <div />}

          <div className="flex items-center space-x-3">
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleSubmitDraft(false)}
                  disabled={isSubmitting}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save as Draft</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmitDraft(true)}
                  disabled={isSubmitting}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Dossier</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
