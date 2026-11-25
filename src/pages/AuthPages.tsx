import { useState, type FormEvent } from 'react';
import { ArrowLeft, Compass, KeyRound, Loader2, Shield, UserCheck, Users } from 'lucide-react';
import type { AppRoute, AuthUser } from '../types';
import { apiRequest, setAuthToken } from '../lib/api';
import { TrustBadge } from '../components/TrustBadge';
import { Footer } from '../components/Footer';

interface AuthPagesProps {
  mode: 'signup' | 'login' | 'recover';
  onNavigate: (route: AppRoute) => void;
  onAuthenticated: (user: AuthUser) => Promise<void>;
  onDemoLogin: (role: 'candidate' | 'employer' | 'admin') => Promise<void>;
}

export function AuthPages({ mode, onNavigate, onAuthenticated, onDemoLogin }: AuthPagesProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'candidate' | 'employer'>('candidate');
  const [recoveryPhrase, setRecoveryPhrase] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoadingRole, setDemoLoadingRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const res = await apiRequest<{ token: string; user: AuthUser }>('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email, password, fullName, role, recoveryPhrase }),
        });
        setAuthToken(res.token);
        await onAuthenticated(res.user);
      } else if (mode === 'login') {
        const res = await apiRequest<{ token: string; user: AuthUser }>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        setAuthToken(res.token);
        await onAuthenticated(res.user);
      } else {
        const res = await apiRequest<{ message: string }>('/api/auth/recover', {
          method: 'POST',
          body: JSON.stringify({ email, recoveryPhrase, newPassword }),
        });
        setSuccessMsg(res.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const triggerDemo = async (demoRole: 'candidate' | 'employer' | 'admin') => {
    setError(null);
    setDemoLoadingRole(demoRole);
    try {
      await onDemoLogin(demoRole);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign into demo account.');
    } finally {
      setDemoLoadingRole(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F9FC] text-[#0B1F3A]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="inline-flex items-center gap-2 font-display text-lg font-bold text-[#0B1F3A]"
          >
            <Compass className="h-5 w-5 text-[#0FB5AE]" />
            <span>TalentPath AI</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#475569] hover:text-[#0B1F3A]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to home</span>
          </button>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* Primary Auth Form */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-8 shadow-xs">
            <h1 className="font-display text-2xl font-bold text-[#0B1F3A]">
              {mode === 'signup' && 'Create your TalentPath account'}
              {mode === 'login' && 'Sign in to TalentPath AI'}
              {mode === 'recover' && 'Recover your account password'}
            </h1>
            <p className="mt-2 text-sm text-[#475569]">
              {mode === 'signup' && 'Keep your professional history and documents private under your control.'}
              {mode === 'login' && 'Access your profile, private evidence centre, and recognition pathways.'}
              {mode === 'recover' && 'Enter your registered email and the security recovery phrase you set during registration.'}
            </p>

            {error && (
              <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="mt-5 rounded-xl border border-[#16A34A]/30 bg-[#16A34A]/10 px-4 py-3 text-sm text-[#15803D]">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {mode === 'signup' && (
                <>
                  <div>
                    <label htmlFor="auth-fullname" className="block text-xs font-semibold text-[#0B1F3A]">
                      Full Name
                    </label>
                    <input
                      id="auth-fullname"
                      type="text"
                      required
                      minLength={2}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g., Amina Hassan"
                      className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0FB5AE] focus:outline-none focus:ring-2 focus:ring-[#0FB5AE]/20"
                    />
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-[#0B1F3A]">Account Role</span>
                    <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRole('candidate')}
                        className={`flex items-center gap-2.5 rounded-xl border p-3 text-left text-sm transition-colors ${
                          role === 'candidate'
                            ? 'border-[#0FB5AE] bg-[#0FB5AE]/10 font-semibold text-[#0B1F3A]'
                            : 'border-slate-200 text-[#475569] hover:bg-slate-50'
                        }`}
                      >
                        <UserCheck className="h-4 w-4 text-[#0FB5AE] shrink-0" />
                        <div>
                          <p>Professional / Candidate</p>
                          <p className="text-[11px] font-normal text-[#475569]">Build profile, assess skills & RPL</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRole('employer')}
                        className={`flex items-center gap-2.5 rounded-xl border p-3 text-left text-sm transition-colors ${
                          role === 'employer'
                            ? 'border-[#0FB5AE] bg-[#0FB5AE]/10 font-semibold text-[#0B1F3A]'
                            : 'border-slate-200 text-[#475569] hover:bg-slate-50'
                        }`}
                      >
                        <Users className="h-4 w-4 text-[#0FB5AE] shrink-0" />
                        <div>
                          <p>Employer / Mentor</p>
                          <p className="text-[11px] font-normal text-[#475569]">View consented portfolios</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label htmlFor="auth-email" className="block text-xs font-semibold text-[#0B1F3A]">
                  Email Address
                </label>
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0FB5AE] focus:outline-none focus:ring-2 focus:ring-[#0FB5AE]/20"
                />
              </div>

              {mode !== 'recover' && (
                <div>
                  <label htmlFor="auth-password" className="block text-xs font-semibold text-[#0B1F3A]">
                    Password (minimum 8 characters)
                  </label>
                  <input
                    id="auth-password"
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0FB5AE] focus:outline-none focus:ring-2 focus:ring-[#0FB5AE]/20"
                  />
                </div>
              )}

              {(mode === 'signup' || mode === 'recover') && (
                <div>
                  <label htmlFor="auth-recovery" className="block text-xs font-semibold text-[#0B1F3A]">
                    {mode === 'signup'
                      ? 'Account Recovery Phrase (used if you forget your password)'
                      : 'Your Account Recovery Phrase'}
                  </label>
                  <input
                    id="auth-recovery"
                    type="text"
                    required
                    minLength={4}
                    value={recoveryPhrase}
                    onChange={(e) => setRecoveryPhrase(e.target.value)}
                    placeholder="e.g., nairobi-bridge-2026"
                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0FB5AE] focus:outline-none focus:ring-2 focus:ring-[#0FB5AE]/20"
                  />
                </div>
              )}

              {mode === 'recover' && (
                <div>
                  <label htmlFor="auth-new-password" className="block text-xs font-semibold text-[#0B1F3A]">
                    New Password (minimum 8 characters)
                  </label>
                  <input
                    id="auth-new-password"
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0FB5AE] focus:outline-none focus:ring-2 focus:ring-[#0FB5AE]/20"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B1F3A] px-5 py-3 text-sm font-semibold text-white hover:bg-[#12305A] disabled:opacity-60 transition-colors"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'login' && 'Sign In'}
                  {mode === 'recover' && 'Reset Password'}
                </span>
              </button>
            </form>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-[#475569]">
              {mode === 'login' && (
                <>
                  <button type="button" onClick={() => onNavigate('signup')} className="font-semibold text-[#0B8A84] hover:underline">
                    Need an account? Sign up
                  </button>
                  <button type="button" onClick={() => onNavigate('recover')} className="inline-flex items-center gap-1 hover:text-[#0B1F3A]">
                    <KeyRound className="h-3.5 w-3.5" />
                    <span>Forgot password?</span>
                  </button>
                </>
              )}
              {mode === 'signup' && (
                <button type="button" onClick={() => onNavigate('login')} className="font-semibold text-[#0B8A84] hover:underline">
                  Already have an account? Sign in
                </button>
              )}
              {mode === 'recover' && (
                <button type="button" onClick={() => onNavigate('login')} className="font-semibold text-[#0B8A84] hover:underline">
                  Return to Sign In
                </button>
              )}
            </div>
          </div>

          {/* Interactive Demonstration Journey Accounts */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-7 space-y-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold text-[#0B1F3A]">Interactive Demo Accounts</h2>
              <TrustBadge variant="demo_data" label="DEMO DATA" />
            </div>
            <p className="text-xs leading-relaxed text-[#475569]">
              Explore TalentPath AI immediately using fictional demonstration accounts. No real refugee personal data is used.
            </p>

            <div className="space-y-3">
              <button
                type="button"
                disabled={demoLoadingRole !== null}
                onClick={() => triggerDemo('candidate')}
                className="w-full rounded-xl border border-slate-200 bg-[#F6F9FC] p-4 text-left hover:border-[#0FB5AE] transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-sm font-bold text-[#0B1F3A]">
                    Displaced Engineer Journey (Candidate)
                  </span>
                  {demoLoadingRole === 'candidate' && <Loader2 className="h-4 w-4 animate-spin text-[#0FB5AE]" />}
                </div>
                <p className="mt-1 text-xs text-[#475569]">
                  Amina Hassan (SAMPLE DATA) — 6 yrs civil & solar experience, sample evidence, KNQA RPL checklist & PDF portfolio.
                </p>
              </button>

              <button
                type="button"
                disabled={demoLoadingRole !== null}
                onClick={() => triggerDemo('employer')}
                className="w-full rounded-xl border border-slate-200 bg-[#F6F9FC] p-4 text-left hover:border-[#0FB5AE] transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-sm font-bold text-[#0B1F3A]">
                    Employer / Mentor Portal
                  </span>
                  {demoLoadingRole === 'employer' && <Loader2 className="h-4 w-4 animate-spin text-[#0FB5AE]" />}
                </div>
                <p className="mt-1 text-xs text-[#475569]">
                  Inspect only candidate portfolios where explicit sharing consent has been granted.
                </p>
              </button>

              <button
                type="button"
                disabled={demoLoadingRole !== null}
                onClick={() => triggerDemo('admin')}
                className="w-full rounded-xl border border-slate-200 bg-[#F6F9FC] p-4 text-left hover:border-[#0FB5AE] transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-sm font-bold text-[#0B1F3A]">
                    Administrator Console
                  </span>
                  {demoLoadingRole === 'admin' && <Loader2 className="h-4 w-4 animate-spin text-[#0FB5AE]" />}
                </div>
                <p className="mt-1 text-xs text-[#475569]">
                  Manage demonstration opportunity listings, platform counts, and configuration notices.
                </p>
              </button>
            </div>

            <div className="rounded-xl bg-[#0B1F3A]/5 p-3.5 text-[11px] leading-relaxed text-[#475569] flex gap-2.5">
              <Shield className="h-4 w-4 text-[#0B1F3A] shrink-0 mt-0.5" />
              <span>
                Session tokens are held securely in memory; all private uploads and database records enforce backend role and owner checks.
              </span>
            </div>
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
