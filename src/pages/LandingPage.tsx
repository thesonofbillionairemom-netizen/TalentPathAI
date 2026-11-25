import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  Award,
  Briefcase,
  Compass,
  ExternalLink,
  FileCheck2,
  FileWarning,
  FolderLock,
  Lock,
  Network,
  Route,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { AppRoute } from '../types';
import { IMPACT_STATISTICS } from '../lib/kenyaResources';
import { AnimatedCounter, RevealSection } from '../components/MotionPrimitives';
import { TrustBadge } from '../components/TrustBadge';
import { Footer } from '../components/Footer';

interface LandingPageProps {
  isAuthenticated: boolean;
  onNavigate: (route: AppRoute) => void;
  onDemoLogin: (role: 'candidate' | 'employer' | 'admin') => Promise<void>;
}

export function LandingPage({ isAuthenticated, onNavigate, onDemoLogin }: LandingPageProps) {
  const reduced = useReducedMotion();
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [storyImgFailed, setStoryImgFailed] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleLaunchDemo = async () => {
    setDemoLoading(true);
    try {
      await onDemoLogin('candidate');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F9FC] text-[#0B1F3A]">
      {/* Top Bar Contract: 3 zones (Wordmark — 4 concise links — 1 primary CTA) */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-6">
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="font-display text-xl font-bold tracking-tight text-[#0B1F3A] whitespace-nowrap shrink-0"
          >
            TalentPath AI
          </button>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#475569]" aria-label="Landing Navigation">
            <a href="#problem" className="hover:text-[#0B1F3A] transition-colors whitespace-nowrap shrink-0">
              Challenge
            </a>
            <a href="#how-it-works" className="hover:text-[#0B1F3A] transition-colors whitespace-nowrap shrink-0">
              How It Works
            </a>
            <a href="#features" className="hover:text-[#0B1F3A] transition-colors whitespace-nowrap shrink-0">
              Capabilities
            </a>
            <a href="#responsible-ai" className="hover:text-[#0B1F3A] transition-colors whitespace-nowrap shrink-0">
              Responsible AI
            </a>
            <a href="#impact" className="hover:text-[#0B1F3A] transition-colors whitespace-nowrap shrink-0">
              Impact
            </a>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => onNavigate(isAuthenticated ? 'dashboard' : 'login')}
              className="rounded-xl bg-[#0B1F3A] px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[#12305A] transition-colors whitespace-nowrap shrink-0"
            >
              {isAuthenticated ? 'Open Workspace' : 'Sign In'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-hero-gradient text-white">
          {!reduced && (
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 right-1/4 h-96 w-96 rounded-full bg-[#5ED6CF]/20 blur-3xl"
              animate={{ y: [0, 18, 0], scale: [1, 1.06, 1] }}
              transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}

          <div className="relative mx-auto max-w-7xl px-6 py-16 lg:py-24">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-stretch">
              <div className="lg:col-span-6 flex flex-col justify-center">
                <motion.p
                  initial={reduced ? undefined : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="text-sm font-semibold tracking-wide text-[#5ED6CF]"
                >
                  Your skills crossed borders. Your recognition should too.
                </motion.p>

                <motion.h1
                  initial={reduced ? undefined : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.08 }}
                  className="mt-4 font-display text-balance font-extrabold tracking-tight text-white"
                  style={{ fontSize: 'clamp(2.25rem, 4vw, 3.65rem)', lineHeight: 1.08 }}
                >
                  Turn your experience into recognised opportunity.
                </motion.h1>

                <motion.p
                  initial={reduced ? undefined : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.16 }}
                  className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-slate-200"
                >
                  TalentPath AI helps skilled refugees and displaced professionals prove their skills, find recognition pathways in Kenya, and connect with employers and mentors.
                </motion.p>

                <motion.div
                  initial={reduced ? undefined : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.24 }}
                  className="mt-8 flex flex-wrap items-center gap-4"
                >
                  <button
                    type="button"
                    onClick={() => onNavigate(isAuthenticated ? 'profile' : 'signup')}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0FB5AE] px-6 py-3.5 text-sm font-semibold text-[#0B1F3A] shadow-lg shadow-[#0FB5AE]/20 hover:bg-[#5ED6CF] transition-all whitespace-nowrap"
                  >
                    <span>Build my profile</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <a
                    href="#how-it-works"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/15 transition-colors whitespace-nowrap"
                  >
                    <span>See how it works</span>
                  </a>
                </motion.div>

                <motion.div
                  initial={reduced ? undefined : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.32 }}
                  className="mt-6 flex flex-wrap items-center gap-4 text-xs text-slate-300"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-[#5ED6CF]" />
                    <span>AI-assisted guidance. Never a replacement for official certification.</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleLaunchDemo}
                    disabled={demoLoading}
                    className="font-semibold text-[#5ED6CF] underline underline-offset-4 hover:text-white transition-colors"
                  >
                    {demoLoading ? 'Opening sample journey...' : 'Try the Sample Engineer Journey (DEMO DATA)'}
                  </button>
                </motion.div>
              </div>

              <motion.div
                initial={reduced ? undefined : { opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="lg:col-span-6 flex"
              >
                <div className="relative w-full overflow-hidden rounded-2xl border border-white/15 bg-[#12305A] shadow-2xl min-h-[280px] lg:h-full">
                  {!heroImgFailed ? (
                    <img
                      src="/src/assets/images/hero_nairobi_professionals_1795597181886.jpg"
                      alt="Engineers and displaced professionals collaborating over technical blueprints in a modern Nairobi workspace"
                      referrerPolicy="no-referrer"
                      onError={() => setHeroImgFailed(true)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full min-h-[300px] flex-col items-center justify-center p-8 text-center">
                      <Compass className="h-12 w-12 text-[#5ED6CF]" />
                      <p className="mt-3 font-display text-lg font-semibold text-white">
                        Nairobi Skills & Recognition Hub
                      </p>
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0B1F3A]/90 via-[#0B1F3A]/40 to-transparent p-6">
                    <p className="text-xs font-medium text-[#5ED6CF]">Kenya Qualification Readiness</p>
                    <p className="mt-1 text-sm text-white">
                      Structured KNQA RPL preparation, private evidence storage, and consent-based portfolio sharing.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section id="problem" className="mx-auto max-w-7xl px-6 py-20">
          <RevealSection>
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#0B8A84]">The Challenge</p>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0B1F3A] text-balance">
                Talent doesn&apos;t disappear when people are displaced. The proof does.
              </h2>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                {
                  icon: FileWarning,
                  title: 'Lost documents',
                  body: 'Certificates, academic transcripts, and employment records are often left behind during urgent displacement or cannot be easily verified across borders.',
                },
                {
                  icon: Route,
                  title: 'Unclear pathways',
                  body: 'Skilled professionals struggle to navigate Recognition of Prior Learning (RPL), foreign credential evaluation, and statutory registration requirements in Kenya.',
                },
                {
                  icon: Network,
                  title: 'Closed networks',
                  body: 'Limited local professional references make it difficult for qualified candidates to reach hiring teams, returnships, and industry mentors.',
                },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.title}
                    className="rounded-2xl border border-slate-200 bg-white p-7 transition-all duration-200 hover:-translate-y-1.5 hover:shadow-lg hover:shadow-[#0FB5AE]/10"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0B1F3A]/5 text-[#0FB5AE]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 font-display text-xl font-bold text-[#0B1F3A]">{card.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#475569]">{card.body}</p>
                  </div>
                );
              })}
            </div>
          </RevealSection>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="bg-white border-y border-slate-200/80 py-20">
          <div className="mx-auto max-w-7xl px-6">
            <RevealSection>
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#0B8A84]">How It Works</p>
                <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0B1F3A]">
                  Four practical steps from lived experience to documented readiness
                </h2>
              </div>

              <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    step: '01',
                    title: 'Build your profile',
                    desc: 'Record your work history, education, technical tools, languages, and career goals in Kenya.',
                  },
                  {
                    step: '02',
                    title: 'Upload your evidence',
                    desc: 'Privately store CVs, provisional certificates, site photos, and supervisor references.',
                  },
                  {
                    step: '03',
                    title: 'Get your AI skills assessment',
                    desc: 'Surface transferable skills, calculate evidence strength, and pinpoint missing records.',
                  },
                  {
                    step: '04',
                    title: 'Follow your pathway & opportunities',
                    desc: 'Track KNQA RPL checklists, check legal readiness, and export your PDF portfolio.',
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="rounded-2xl border border-slate-200 bg-[#F6F9FC] p-6 transition-all duration-200 hover:-translate-y-1.5 hover:shadow-lg hover:shadow-[#0FB5AE]/10"
                  >
                    <span className="font-mono-tabular text-sm font-bold text-[#0FB5AE]">{item.step}</span>
                    <h3 className="mt-3 font-display text-lg font-bold text-[#0B1F3A]">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#475569]">{item.desc}</p>
                  </div>
                ))}
              </div>
            </RevealSection>
          </div>
        </section>

        {/* Core Features & Demonstration Story */}
        <section id="features" className="mx-auto max-w-7xl px-6 py-20">
          <RevealSection>
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-5">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  {!storyImgFailed ? (
                    <img
                      src="/src/assets/images/engineer_portfolio_review_1795597181312.jpg"
                      alt="Engineer reviewing technical plans and certification documents in Nairobi"
                      referrerPolicy="no-referrer"
                      onError={() => setStoryImgFailed(true)}
                      className="aspect-[4/3] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center bg-[#12305A] text-white">
                      <FileCheck2 className="h-12 w-12 text-[#5ED6CF]" />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#0B8A84]">Sample Journey Spotlight</span>
                      <TrustBadge variant="demo_data" label="SAMPLE DATA" />
                    </div>
                    <h3 className="mt-2 font-display text-lg font-bold text-[#0B1F3A]">
                      Amina Hassan — Displaced Civil & Solar Engineer
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#475569]">
                      Arriving in Nairobi without original university transcripts, Amina uploads a provisional letter and site supervisor reference, uncovers a 68/100 evidence score, and receives a step-by-step KNQA RPL preparation checklist.
                    </p>
                    <button
                      type="button"
                      onClick={handleLaunchDemo}
                      disabled={demoLoading}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#0B1F3A] hover:text-[#0FB5AE] transition-colors"
                    >
                      <span>{demoLoading ? 'Loading Demo Account...' : 'Inspect interactive sample journey'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#0B8A84]">Platform Capabilities</p>
                <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0B1F3A] text-balance">
                  Purpose-built tools for recognition and readiness
                </h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[
                    {
                      icon: Sparkles,
                      title: 'AI Skills Assessment',
                      desc: 'Discover transferable skills you may not have named yet, paired with explainable rationale.',
                    },
                    {
                      icon: FolderLock,
                      title: 'Evidence Centre',
                      desc: 'Securely store documents in private storage and identify missing evidence categories.',
                    },
                    {
                      icon: Compass,
                      title: 'Recognition Navigator',
                      desc: 'Personalised RPL preparation checklists with official Kenyan resources (KNQA, TVETA, NITA, UQP).',
                    },
                    {
                      icon: Briefcase,
                      title: 'Opportunity Match',
                      desc: 'Discover relevant sample jobs, mentors, training programmes, fellowships, and returnships.',
                    },
                    {
                      icon: Award,
                      title: 'Professional Portfolio',
                      desc: 'Generate, edit, and download a structured, employer-ready PDF portfolio report.',
                    },
                    {
                      icon: Lock,
                      title: 'Consent-First Sharing',
                      desc: 'Employers and mentors only see your profile if you explicitly grant sharing permission.',
                    },
                  ].map((feat) => {
                    const Icon = feat.icon;
                    return (
                      <div
                        key={feat.title}
                        className="rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:shadow-[#0FB5AE]/10"
                      >
                        <Icon className="h-5 w-5 text-[#0FB5AE]" />
                        <h3 className="mt-3 font-display text-base font-bold text-[#0B1F3A]">{feat.title}</h3>
                        <p className="mt-1.5 text-xs leading-relaxed text-[#475569]">{feat.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </RevealSection>
        </section>

        {/* Responsible AI Section */}
        <section id="responsible-ai" className="bg-[#0B1F3A] text-white py-20">
          <div className="mx-auto max-w-7xl px-6">
            <RevealSection>
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#5ED6CF]">Responsible AI & Trust</p>
                <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-balance">
                  Transparent AI guidance that respects human verification
                </h2>
                <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-300">
                  Displaced professionals deserve clear explanations—never opaque black-box scoring or overstated claims. Every insight inside TalentPath AI distinguishes its origin.
                </p>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <TrustBadge variant="officially_verified" />
                  <h3 className="mt-4 font-display text-lg font-bold">Official Recognition Remains Human</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">
                    Green badges are reserved strictly for official institutions and verified external resources. AI never certifies degrees or legal work eligibility.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <TrustBadge variant="ai_suggested" />
                  <h3 className="mt-4 font-display text-lg font-bold">Explainable AI Recommendations</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">
                    Violet markers highlight AI-assisted skills analysis, evidence gaps, and pathway checklists—always accompanied by plain-language reasoning.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <TrustBadge variant="demo_data" />
                  <h3 className="mt-4 font-display text-lg font-bold">Consent, Privacy & Clear Demo Labels</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">
                    Documents stay in private storage with owner-only access. Sample data and offline fallback outputs are always labeled in amber.
                  </p>
                </div>
              </div>
            </RevealSection>
          </div>
        </section>

        {/* Impact Statistics */}
        <section id="impact" className="mx-auto max-w-7xl px-6 py-20">
          <RevealSection>
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#0B8A84]">Context & Official Sources</p>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0B1F3A] text-balance">
                Grounded in real regional displacement and recognition frameworks
              </h2>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {IMPACT_STATISTICS.map((stat) => (
                <div
                  key={stat.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-200 hover:-translate-y-1.5 hover:shadow-lg hover:shadow-[#0FB5AE]/10"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      {stat.isSample ? (
                        <TrustBadge variant="demo_data" label="SAMPLE DATA" />
                      ) : (
                        <TrustBadge variant="official_source" label="Official source" />
                      )}
                    </div>
                    <p className="font-display text-3xl font-extrabold text-[#0B1F3A]">
                      <AnimatedCounter
                        value={stat.numericValue}
                        suffix={stat.suffix}
                        fallbackText={stat.value}
                      />
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#0B1F3A]">{stat.label}</p>
                    <p className="mt-2 text-xs leading-relaxed text-[#475569]">{stat.context}</p>
                  </div>

                  <a
                    href={stat.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B8A84] hover:underline"
                  >
                    <span>Source: {stat.sourceName}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ))}
            </div>
          </RevealSection>
        </section>

        {/* Closing CTA */}
        <section className="mx-auto max-w-7xl px-6 pb-20">
          <RevealSection>
            <div className="rounded-3xl bg-hero-gradient px-8 py-14 text-center text-white sm:px-14">
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-balance">
                Your next chapter starts with what you already know.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-slate-200">
                Create your private TalentPath profile in minutes, organize your evidence, and map your recognition steps in Kenya.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => onNavigate(isAuthenticated ? 'dashboard' : 'signup')}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0FB5AE] px-7 py-3.5 text-sm font-semibold text-[#0B1F3A] hover:bg-[#5ED6CF] transition-colors"
                >
                  <span>Start your TalentPath</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </RevealSection>
        </section>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
