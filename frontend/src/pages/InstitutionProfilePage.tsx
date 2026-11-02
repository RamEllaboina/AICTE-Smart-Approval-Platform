import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Building, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export const InstitutionProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await api.institutions.getMyInstitution();
        setProfile(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      const updated = await api.institutions.updateMyInstitution({
        name: profile.name,
        address: profile.address,
        state: profile.state,
        district: profile.district,
        pin_code: profile.pin_code,
        contact_phone: profile.contact_phone,
      });
      setProfile(updated);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to update institution profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-xs animate-pulse">Loading institution profile...</div>;
  }

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Institutional Profile & Accreditation</h1>
        <p className="text-xs text-slate-500 mt-1">
          Verified administrative records, statutory AICTE registration identifier, and campus address
        </p>
      </div>

      {success && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Institution profile updated successfully and logged in audit trail.</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              AICTE Institution ID (Permanent)
            </label>
            <input
              type="text"
              value={profile?.aicte_id || ''}
              readOnly
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 font-mono text-slate-600 font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Approval Category
            </label>
            <input
              type="text"
              value={profile?.category?.replace(/_/g, ' ') || ''}
              readOnly
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-600"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Institution Official Name *
          </label>
          <input
            type="text"
            required
            value={profile?.name || ''}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Campus Physical Address *
          </label>
          <input
            type="text"
            required
            value={profile?.address || ''}
            onChange={(e) => setProfile({ ...profile, address: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              State *
            </label>
            <input
              type="text"
              required
              value={profile?.state || ''}
              onChange={(e) => setProfile({ ...profile, state: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              District *
            </label>
            <input
              type="text"
              required
              value={profile?.district || ''}
              onChange={(e) => setProfile({ ...profile, district: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              PIN Code *
            </label>
            <input
              type="text"
              required
              value={profile?.pin_code || ''}
              onChange={(e) => setProfile({ ...profile, pin_code: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Contact Email
            </label>
            <input
              type="email"
              value={profile?.contact_email || ''}
              readOnly
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Contact Phone *
            </label>
            <input
              type="text"
              required
              value={profile?.contact_phone || ''}
              onChange={(e) => setProfile({ ...profile, contact_phone: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-sm transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Updating...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
