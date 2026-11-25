import { useState } from 'react';
import { AlertTriangle, Check, Loader2, Lock, Trash2 } from 'lucide-react';
import type { AuthUser, ConsentRecord } from '../types';
import { apiRequest } from '../lib/api';

interface SettingsPageProps {
  user: AuthUser;
  consent: ConsentRecord;
  onRefresh: () => Promise<void>;
  onAccountDeleted: () => void;
}

export function SettingsPage({ user, consent, onRefresh, onAccountDeleted }: SettingsPageProps) {
  const [shareEmployers, setShareEmployers] = useState(Boolean(consent.share_with_employers));
  const [shareMentors, setShareMentors] = useState(Boolean(consent.share_with_mentors));
  const [shareDocs, setShareDocs] = useState(Boolean(consent.share_documents_summary));
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveConsent = async () => {
    setSaving(true);
    setError(null);
    setSavedMsg(null);
    try {
      await apiRequest('/api/settings/consent', {
        method: 'PUT',
        body: JSON.stringify({
          shareWithEmployers: shareEmployers,
          shareWithMentors: shareMentors,
          shareDocumentsSummary: shareDocs,
        }),
      });
      await onRefresh();
      setSavedMsg('Consent preferences updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update consent settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setError(null);
    try {
      await apiRequest('/api/settings/account', { method: 'DELETE' });
      onAccountDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete account.');
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1F3A]">Privacy &amp; Account Settings</h1>
        <p className="mt-1 text-sm text-[#475569]">
          Control who can view your professional portfolio and manage your personal data retention.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {savedMsg && (
        <div className="rounded-xl border border-[#16A34A]/30 bg-[#16A34A]/10 px-4 py-3 text-sm text-[#15803D]">
          {savedMsg}
        </div>
      )}

      {/* Account Info */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
        <h2 className="font-display text-lg font-bold text-[#0B1F3A]">Account Identity</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-sm">
          <div>
            <p className="text-xs text-[#475569]">Name</p>
            <p className="font-semibold text-[#0B1F3A]">{user.full_name}</p>
          </div>
          <div>
            <p className="text-xs text-[#475569]">Email</p>
            <p className="font-semibold text-[#0B1F3A]">{user.email}</p>
          </div>
          <div>
            <p className="text-xs text-[#475569]">Role</p>
            <p className="font-semibold capitalize text-[#0B1F3A]">{user.role}</p>
          </div>
        </div>
      </div>

      {/* Explicit Consent Controls */}
      {user.role === 'candidate' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-[#0FB5AE]" />
            <h2 className="font-display text-lg font-bold text-[#0B1F3A]">Explicit Sharing Consent</h2>
          </div>
          <p className="text-xs leading-relaxed text-[#475569]">
            By default, your profile and documents are strictly private. Employers and mentors can only inspect your profile and portfolio summary if you opt in below. Raw uploaded document files are never shared automatically.
          </p>

          <div className="space-y-3">
            <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-[#F6F9FC] p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={shareEmployers}
                onChange={(e) => setShareEmployers(e.target.checked)}
                className="mt-1"
              />
              <div>
                <p className="text-sm font-semibold text-[#0B1F3A]">Allow Verified Employers to view my profile &amp; portfolio</p>
                <p className="text-xs text-[#475569]">Employers see your headline, skills, qualifications, work history, and portfolio summary.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-[#F6F9FC] p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={shareMentors}
                onChange={(e) => setShareMentors(e.target.checked)}
                className="mt-1"
              />
              <div>
                <p className="text-sm font-semibold text-[#0B1F3A]">Allow Mentors to review my recognition readiness</p>
                <p className="text-xs text-[#475569]">Enables mentors in the Employer/Mentor portal to advise on KNQA RPL preparation.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-[#F6F9FC] p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={shareDocs}
                onChange={(e) => setShareDocs(e.target.checked)}
                className="mt-1"
              />
              <div>
                <p className="text-sm font-semibold text-[#0B1F3A]">Include non-sensitive document category summaries</p>
                <p className="text-xs text-[#475569]">Shows document titles and AI-extracted summaries without exposing downloadable private files.</p>
              </div>
            </label>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={handleSaveConsent}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0FB5AE] px-5 py-2.5 text-sm font-semibold text-[#0B1F3A] hover:bg-[#5ED6CF] disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            <span>Save Consent Preferences</span>
          </button>
        </div>
      )}

      {/* Data Deletion */}
      <div className="rounded-2xl border border-red-200 bg-white p-6 space-y-4">
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="h-5 w-5" />
          <h2 className="font-display text-lg font-bold">Delete Account &amp; Stored Data</h2>
        </div>
        <p className="text-xs leading-relaxed text-[#475569]">
          Permanently remove your account, profile records, assessments, portfolios, and uploaded private documents from the server.
        </p>

        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-red-300 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            <span>Request Account Deletion</span>
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-3 rounded-xl bg-red-50 p-4">
            <p className="text-xs font-semibold text-red-800 w-full">
              Are you sure? This action cannot be undone.
            </p>
            <button
              type="button"
              disabled={deleting}
              onClick={handleDeleteAccount}
              className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {deleting ? 'Deleting...' : 'Confirm Permanent Deletion'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-[#0B1F3A]"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
