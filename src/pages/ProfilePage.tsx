import { useState, type FormEvent } from 'react';
import { Briefcase, GraduationCap, Loader2, Plus, Save, Sparkles, Trash2 } from 'lucide-react';
import type { ProfileRecord, QualificationRecord, SkillRecord, WorkExperienceRecord } from '../types';
import { apiRequest } from '../lib/api';
import { TrustBadge } from '../components/TrustBadge';

interface ProfilePageProps {
  fullName: string;
  profile: ProfileRecord | null;
  qualifications: QualificationRecord[];
  experience: WorkExperienceRecord[];
  skills: SkillRecord[];
  onRefresh: () => Promise<void>;
}

export function ProfilePage({
  fullName,
  profile,
  qualifications,
  experience,
  skills,
  onRefresh,
}: ProfilePageProps) {
  const [nameInput, setNameInput] = useState(fullName);
  const [headline, setHeadline] = useState(profile?.headline || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [currentLocation, setCurrentLocation] = useState(profile?.current_location || 'Nairobi, Kenya');
  const [originCountry, setOriginCountry] = useState(profile?.origin_country || '');
  const [displacementStatus, setDisplacementStatus] = useState(
    profile?.displacement_status || 'Refugee / Displaced Professional'
  );
  const [yearsExperience, setYearsExperience] = useState(String(profile?.years_experience ?? 0));
  const [targetSector, setTargetSector] = useState(profile?.target_sector || '');
  const [careerGoals, setCareerGoals] = useState(profile?.career_goals || '');
  const [languagesText, setLanguagesText] = useState(() => {
    try {
      return (JSON.parse(profile?.languages_json || '[]') as string[]).join(', ');
    } catch {
      return '';
    }
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Qualification form
  const [qualTitle, setQualTitle] = useState('');
  const [qualInst, setQualInst] = useState('');
  const [qualCountry, setQualCountry] = useState('');
  const [qualYear, setQualYear] = useState('');
  const [qualLevel, setQualLevel] = useState('Bachelor Degree');
  const [qualNotes, setQualNotes] = useState('');

  // Experience form
  const [jobTitle, setJobTitle] = useState('');
  const [org, setOrg] = useState('');
  const [workCountry, setWorkCountry] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);
  const [workDesc, setWorkDesc] = useState('');
  const [achievements, setAchievements] = useState('');

  // Skill form
  const [skillName, setSkillName] = useState('');
  const [skillCategory, setSkillCategory] = useState<'technical' | 'transferable' | 'language' | 'tool'>('technical');
  const [skillProficiency, setSkillProficiency] = useState('Proficient');

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setError(null);
    setMessage(null);
    try {
      const languages = languagesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await apiRequest('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          fullName: nameInput,
          headline,
          bio,
          currentLocation,
          originCountry,
          displacementStatus,
          yearsExperience: Number(yearsExperience) || 0,
          targetSector,
          careerGoals,
          languages,
        }),
      });
      await onRefresh();
      setMessage('Profile saved to database.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddQual = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiRequest('/api/profile/qualifications', {
        method: 'POST',
        body: JSON.stringify({
          title: qualTitle,
          institution: qualInst,
          country: qualCountry,
          yearObtained: qualYear,
          level: qualLevel,
          notes: qualNotes,
        }),
      });
      setQualTitle('');
      setQualInst('');
      setQualCountry('');
      setQualYear('');
      setQualNotes('');
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add qualification.');
    }
  };

  const handleAddWork = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiRequest('/api/profile/experience', {
        method: 'POST',
        body: JSON.stringify({
          jobTitle,
          organization: org,
          country: workCountry,
          startYear,
          endYear,
          isCurrent,
          description: workDesc,
          achievements,
        }),
      });
      setJobTitle('');
      setOrg('');
      setWorkCountry('');
      setStartYear('');
      setEndYear('');
      setIsCurrent(false);
      setWorkDesc('');
      setAchievements('');
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add work experience.');
    }
  };

  const handleAddSkill = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiRequest('/api/profile/skills', {
        method: 'POST',
        body: JSON.stringify({
          name: skillName,
          category: skillCategory,
          proficiency: skillProficiency,
        }),
      });
      setSkillName('');
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add skill.');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1F3A]">Profile Management</h1>
        <p className="mt-1 text-sm text-[#475569]">
          Maintain your professional summary, education, work history, languages, and skills. All changes persist in your private database record.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-xl border border-[#16A34A]/30 bg-[#16A34A]/10 px-4 py-3 text-sm text-[#15803D]">
          {message}
        </div>
      )}

      {/* Personal & Career Overview */}
      <form onSubmit={handleSaveProfile} className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-[#0B1F3A]">Personal & Career Details</h2>
          <TrustBadge variant="user_provided" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-[#0B1F3A]">Full Name</label>
            <input
              type="text"
              required
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0FB5AE] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#0B1F3A]">Professional Headline</label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g., Civil & Solar Energy Engineer"
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0FB5AE] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#0B1F3A]">Current Location in Kenya</label>
            <input
              type="text"
              value={currentLocation}
              onChange={(e) => setCurrentLocation(e.target.value)}
              placeholder="Nairobi, Kenya"
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0FB5AE] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#0B1F3A]">Target Industry / Sector</label>
            <input
              type="text"
              value={targetSector}
              onChange={(e) => setTargetSector(e.target.value)}
              placeholder="e.g., Renewable Energy & Infrastructure"
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0FB5AE] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#0B1F3A]">Years of Experience</label>
            <input
              type="number"
              min={0}
              max={60}
              value={yearsExperience}
              onChange={(e) => setYearsExperience(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0FB5AE] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#0B1F3A]">Languages (comma-separated)</label>
            <input
              type="text"
              value={languagesText}
              onChange={(e) => setLanguagesText(e.target.value)}
              placeholder="English (Fluent), Swahili (Conversational), Arabic"
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0FB5AE] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#0B1F3A]">Origin Country / Prior Context (Optional)</label>
            <input
              type="text"
              value={originCountry}
              onChange={(e) => setOriginCountry(e.target.value)}
              placeholder="Optional"
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0FB5AE] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#0B1F3A]">Status Context (Optional)</label>
            <input
              type="text"
              value={displacementStatus}
              onChange={(e) => setDisplacementStatus(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0FB5AE] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#0B1F3A]">Professional Summary / Bio</label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Describe your background, key responsibilities, and technical strengths..."
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0FB5AE] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#0B1F3A]">Career Interests & Recognition Goals</label>
          <textarea
            rows={2}
            value={careerGoals}
            onChange={(e) => setCareerGoals(e.target.value)}
            placeholder="e.g., Prepare KNQA Recognition of Prior Learning dossier and transition into Kenyan engineering roles."
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0FB5AE] focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={savingProfile}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0B1F3A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#12305A] disabled:opacity-60 transition-colors"
        >
          {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>Save Profile Changes</span>
        </button>
      </form>

      {/* Education & Qualifications */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-[#0FB5AE]" />
          <h2 className="font-display text-lg font-bold text-[#0B1F3A]">Education & Qualifications</h2>
        </div>

        <div className="space-y-3">
          {qualifications.map((q) => (
            <div key={q.id} className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-[#F6F9FC] p-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-[#0B1F3A]">{q.title}</p>
                  <TrustBadge
                    variant={
                      q.status === 'officially_verified'
                        ? 'officially_verified'
                        : q.status === 'evidence_extracted'
                        ? 'extracted'
                        : 'user_provided'
                    }
                  />
                </div>
                <p className="mt-1 text-xs text-[#475569]">
                  {q.institution} · {q.level} · {q.country || 'Unspecified'} ({q.year_obtained || 'Year N/A'})
                </p>
                {q.notes && <p className="mt-1.5 text-xs text-[#475569]">{q.notes}</p>}
              </div>
              <button
                type="button"
                onClick={async () => {
                  await apiRequest(`/api/profile/qualifications/${q.id}`, { method: 'DELETE' });
                  await onRefresh();
                }}
                className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                aria-label="Delete qualification"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddQual} className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
          <input
            type="text"
            required
            value={qualTitle}
            onChange={(e) => setQualTitle(e.target.value)}
            placeholder="Qualification / Degree Title *"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            required
            value={qualInst}
            onChange={(e) => setQualInst(e.target.value)}
            placeholder="Institution *"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={qualLevel}
            onChange={(e) => setQualLevel(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
          >
            <option>Bachelor Degree</option>
            <option>Master Degree</option>
            <option>Diploma / HND</option>
            <option>Technical / TVET Certificate</option>
            <option>Trade Test / Craft Certificate</option>
          </select>
          <input
            type="text"
            value={qualCountry}
            onChange={(e) => setQualCountry(e.target.value)}
            placeholder="Country"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={qualYear}
            onChange={(e) => setQualYear(e.target.value)}
            placeholder="Year Obtained"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={qualNotes}
            onChange={(e) => setQualNotes(e.target.value)}
            placeholder="Document status note (e.g. transcript missing)"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="sm:col-span-3 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0FB5AE] px-4 py-2.5 text-sm font-semibold text-[#0B1F3A] hover:bg-[#5ED6CF]"
          >
            <Plus className="h-4 w-4" />
            <span>Add Qualification</span>
          </button>
        </form>
      </div>

      {/* Work Experience */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-[#0FB5AE]" />
          <h2 className="font-display text-lg font-bold text-[#0B1F3A]">Work Experience</h2>
        </div>

        <div className="space-y-3">
          {experience.map((w) => (
            <div key={w.id} className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-[#F6F9FC] p-4">
              <div>
                <p className="text-sm font-bold text-[#0B1F3A]">{w.job_title}</p>
                <p className="text-xs text-[#475569]">
                  {w.organization} · {w.country || 'Unspecified'} · {w.start_year} – {w.end_year || 'Present'}
                </p>
                {w.description && <p className="mt-1.5 text-xs text-[#475569]">{w.description}</p>}
                {w.achievements && <p className="mt-1 text-xs font-medium text-[#0B1F3A]">Impact: {w.achievements}</p>}
              </div>
              <button
                type="button"
                onClick={async () => {
                  await apiRequest(`/api/profile/experience/${w.id}`, { method: 'DELETE' });
                  await onRefresh();
                }}
                className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                aria-label="Delete work experience"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddWork} className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
          <input
            type="text"
            required
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="Job Title *"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            required
            value={org}
            onChange={(e) => setOrg(e.target.value)}
            placeholder="Organization *"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={workCountry}
            onChange={(e) => setWorkCountry(e.target.value)}
            placeholder="Country"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={startYear}
            onChange={(e) => setStartYear(e.target.value)}
            placeholder="Start Year (e.g. 2020)"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            disabled={isCurrent}
            value={isCurrent ? 'Present' : endYear}
            onChange={(e) => setEndYear(e.target.value)}
            placeholder="End Year"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
          />
          <label className="flex items-center gap-2 text-xs font-medium text-[#0B1F3A] px-2">
            <input type="checkbox" checked={isCurrent} onChange={(e) => setIsCurrent(e.target.checked)} />
            <span>Currently working here</span>
          </label>
          <input
            type="text"
            value={workDesc}
            onChange={(e) => setWorkDesc(e.target.value)}
            placeholder="Key duties & scope"
            className="sm:col-span-2 rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={achievements}
            onChange={(e) => setAchievements(e.target.value)}
            placeholder="Measurable outcome"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="sm:col-span-3 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0FB5AE] px-4 py-2.5 text-sm font-semibold text-[#0B1F3A] hover:bg-[#5ED6CF]"
          >
            <Plus className="h-4 w-4" />
            <span>Add Work Experience</span>
          </button>
        </form>
      </div>

      {/* Skills */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#7C5CFC]" />
          <h2 className="font-display text-lg font-bold text-[#0B1F3A]">Technical & Transferable Skills</h2>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {skills.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-[#F6F9FC] px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#0B1F3A] truncate">{s.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-[#475569] capitalize">{s.category} · {s.proficiency}</span>
                  <TrustBadge
                    variant={
                      s.source === 'officially_verified'
                        ? 'officially_verified'
                        : s.source === 'ai_suggested'
                        ? 'ai_suggested'
                        : s.source === 'extracted'
                        ? 'extracted'
                        : 'user_provided'
                    }
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await apiRequest(`/api/profile/skills/${s.id}`, { method: 'DELETE' });
                  await onRefresh();
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 shrink-0"
                aria-label="Delete skill"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddSkill} className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-4">
          <input
            type="text"
            required
            value={skillName}
            onChange={(e) => setSkillName(e.target.value)}
            placeholder="Skill name *"
            className="sm:col-span-2 rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={skillCategory}
            onChange={(e) => setSkillCategory(e.target.value as 'technical' | 'transferable' | 'language' | 'tool')}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
          >
            <option value="technical">Technical</option>
            <option value="transferable">Transferable</option>
            <option value="tool">Tool / Software</option>
            <option value="language">Language</option>
          </select>
          <select
            value={skillProficiency}
            onChange={(e) => setSkillProficiency(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
          >
            <option>Beginner</option>
            <option>Proficient</option>
            <option>Advanced</option>
            <option>Expert</option>
          </select>
          <button
            type="submit"
            className="sm:col-span-4 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0FB5AE] px-4 py-2.5 text-sm font-semibold text-[#0B1F3A] hover:bg-[#5ED6CF]"
          >
            <Plus className="h-4 w-4" />
            <span>Add Skill</span>
          </button>
        </form>
      </div>
    </div>
  );
}
