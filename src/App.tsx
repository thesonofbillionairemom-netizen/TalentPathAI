import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import type {
  AppRoute,
  AssessmentRecord,
  AuthUser,
  ConsentRecord,
  DocumentRecord,
  EvidenceSummary,
  MentorPeerRecord,
  NotificationRecord,
  OpportunityRecord,
  PortfolioRecord,
  ProfileRecord,
  QualificationRecord,
  RecognitionPathwayRecord,
  SkillRecord,
  WorkExperienceRecord,
} from './types';
import { apiRequest, setAuthToken } from './lib/api';
import { AppShell } from './components/AppShell';
import { LandingPage } from './pages/LandingPage';
import { AuthPages } from './pages/AuthPages';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { DocumentsPage } from './pages/DocumentsPage';
import { AssessmentPage } from './pages/AssessmentPage';
import { RecognitionPage } from './pages/RecognitionPage';
import { ReadinessPage } from './pages/ReadinessPage';
import { OpportunitiesPage } from './pages/OpportunitiesPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { SettingsPage } from './pages/SettingsPage';
import { EmployerDashboardPage } from './pages/EmployerDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

const DEMO_CREDENTIALS: Record<'candidate' | 'employer' | 'admin', { email: string; password: string }> = {
  candidate: { email: 'amina.demo@talentpath.example', password: 'DemoCandidate2026!' },
  employer: { email: 'mentor.demo@talentpath.example', password: 'DemoEmployer2026!' },
  admin: { email: 'admin.demo@talentpath.example', password: 'DemoAdmin2026!' },
};

export default function App() {
  const reduced = useReducedMotion();
  const [route, setRoute] = useState<AppRoute>('landing');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [aiConfigured, setAiConfigured] = useState(false);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);

  // Workspace Data
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [qualifications, setQualifications] = useState<QualificationRecord[]>([]);
  const [experience, setExperience] = useState<WorkExperienceRecord[]>([]);
  const [skills, setSkills] = useState<SkillRecord[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [evidence, setEvidence] = useState<EvidenceSummary>({
    score: 0,
    categoriesPresent: [],
    missingCategories: ['cv', 'academic_certificate', 'reference_letter', 'employment_record'],
  });
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [pathways, setPathways] = useState<RecognitionPathwayRecord[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityRecord[]>([]);
  const [savedMap, setSavedMap] = useState<Record<string, string>>({});
  const [portfolios, setPortfolios] = useState<PortfolioRecord[]>([]);
  const [consent, setConsent] = useState<ConsentRecord>({
    user_id: '',
    share_with_employers: 0,
    share_with_mentors: 0,
    share_documents_summary: 0,
  });
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [mentors, setMentors] = useState<MentorPeerRecord[]>([]);

  useEffect(() => {
    apiRequest<{ aiConfigured: boolean }>('/api/health')
      .then((h) => setAiConfigured(Boolean(h.aiConfigured)))
      .catch(() => setAiConfigured(false));
  }, []);

  const refreshWorkspace = useCallback(async (activeUser?: AuthUser | null) => {
    const targetUser = activeUser ?? user;
    if (!targetUser) return;

    const [
      profileRes,
      docsRes,
      assessRes,
      pathRes,
      oppRes,
      portRes,
      consentRes,
      notifRes,
      mentorsRes,
    ] = await Promise.all([
      apiRequest<{
        profile: ProfileRecord | null;
        qualifications: QualificationRecord[];
        experience: WorkExperienceRecord[];
        skills: SkillRecord[];
        evidence: EvidenceSummary;
      }>('/api/profile'),
      apiRequest<{ documents: DocumentRecord[]; evidence: EvidenceSummary }>('/api/documents'),
      apiRequest<{ assessments: AssessmentRecord[] }>('/api/assessments'),
      apiRequest<{ pathways: RecognitionPathwayRecord[] }>('/api/pathways'),
      apiRequest<{ opportunities: OpportunityRecord[]; savedMap: Record<string, string> }>('/api/opportunities'),
      apiRequest<{ portfolios: PortfolioRecord[] }>('/api/portfolios'),
      apiRequest<{ consent: ConsentRecord }>('/api/settings/consent'),
      apiRequest<{ notifications: NotificationRecord[] }>('/api/notifications'),
      apiRequest<{ mentors: MentorPeerRecord[] }>('/api/mentors'),
    ]);

    setProfile(profileRes.profile);
    setQualifications(profileRes.qualifications);
    setExperience(profileRes.experience);
    setSkills(profileRes.skills);
    setDocuments(docsRes.documents);
    setEvidence(docsRes.evidence);
    setAssessments(assessRes.assessments);
    setPathways(pathRes.pathways);
    setOpportunities(oppRes.opportunities);
    setSavedMap(oppRes.savedMap);
    setPortfolios(portRes.portfolios);
    setConsent(consentRes.consent);
    setNotifications(notifRes.notifications);
    setMentors(mentorsRes.mentors);
  }, [user]);

  const handleAuthenticated = async (authedUser: AuthUser) => {
    setUser(authedUser);
    setLoadingWorkspace(true);
    try {
      await refreshWorkspace(authedUser);
      if (authedUser.role === 'admin') setRoute('admin');
      else if (authedUser.role === 'employer') setRoute('employer');
      else setRoute('dashboard');
    } finally {
      setLoadingWorkspace(false);
    }
  };

  const handleDemoLogin = async (role: 'candidate' | 'employer' | 'admin') => {
    const creds = DEMO_CREDENTIALS[role];
    const res = await apiRequest<{ token: string; user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(creds),
    });
    setAuthToken(res.token);
    await handleAuthenticated(res.user);
  };

  const handleLogout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore logout network errors on cleanup
    }
    setAuthToken(null);
    setUser(null);
    setRoute('landing');
  };

  const handleMarkNotificationRead = async (id: string) => {
    await apiRequest(`/api/notifications/${id}/read`, { method: 'PATCH' });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
  };

  const handleNavigate = (target: AppRoute) => {
    const publicRoutes: AppRoute[] = ['landing', 'signup', 'login', 'recover'];
    if (!user && !publicRoutes.includes(target)) {
      setRoute('login');
      return;
    }
    setRoute(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPublicOrWorkspace = () => {
    if (route === 'landing') {
      return (
        <LandingPage
          isAuthenticated={Boolean(user)}
          onNavigate={handleNavigate}
          onDemoLogin={handleDemoLogin}
        />
      );
    }

    if (route === 'signup' || route === 'login' || route === 'recover') {
      return (
        <AuthPages
          mode={route}
          onNavigate={handleNavigate}
          onAuthenticated={handleAuthenticated}
          onDemoLogin={handleDemoLogin}
        />
      );
    }

    if (!user) {
      return (
        <AuthPages
          mode="login"
          onNavigate={handleNavigate}
          onAuthenticated={handleAuthenticated}
          onDemoLogin={handleDemoLogin}
        />
      );
    }

    if (loadingWorkspace) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F6F9FC] text-[#0B1F3A] gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-[#0FB5AE]" />
          <p className="text-sm font-medium text-[#475569]">Loading your TalentPath workspace...</p>
        </div>
      );
    }

    return (
      <AppShell
        user={user}
        route={route}
        aiConfigured={aiConfigured}
        notifications={notifications}
        onNavigate={handleNavigate}
        onMarkNotificationRead={handleMarkNotificationRead}
        onLogout={handleLogout}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={route}
            initial={reduced ? undefined : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {route === 'dashboard' && (
              <DashboardPage
                fullName={user.full_name}
                profile={profile}
                documents={documents}
                skills={skills}
                evidence={evidence}
                latestAssessment={assessments[0] || null}
                pathways={pathways}
                opportunities={opportunities}
                mentors={mentors}
                shareWithMentors={Boolean(consent.share_with_mentors)}
                onRefreshWorkspace={() => refreshWorkspace()}
                onNavigate={handleNavigate}
              />
            )}

            {route === 'profile' && (
              <ProfilePage
                fullName={user.full_name}
                profile={profile}
                qualifications={qualifications}
                experience={experience}
                skills={skills}
                onRefresh={() => refreshWorkspace()}
              />
            )}

            {route === 'documents' && (
              <DocumentsPage
                documents={documents}
                evidence={evidence}
                onRefresh={() => refreshWorkspace()}
              />
            )}

            {route === 'assessment' && (
              <AssessmentPage
                assessments={assessments}
                skills={skills}
                aiConfigured={aiConfigured}
                onRefresh={() => refreshWorkspace()}
              />
            )}

            {route === 'recognition' && (
              <RecognitionPage
                pathways={pathways}
                defaultOccupation={profile?.target_sector || profile?.headline || ''}
                onRefresh={() => refreshWorkspace()}
              />
            )}

            {route === 'readiness' && (
              <ReadinessPage profile={profile} onRefresh={() => refreshWorkspace()} />
            )}

            {(route === 'opportunities' || route === 'saved') && (
              <OpportunitiesPage
                mode={route === 'saved' ? 'saved' : 'all'}
                opportunities={opportunities}
                savedMap={savedMap}
                onRefresh={() => refreshWorkspace()}
              />
            )}

            {route === 'portfolio' && (
              <PortfolioPage
                fullName={user.full_name}
                profile={profile}
                qualifications={qualifications}
                experience={experience}
                skills={skills}
                documents={documents}
                pathways={pathways}
                portfolios={portfolios}
                onRefresh={() => refreshWorkspace()}
              />
            )}

            {route === 'settings' && (
              <SettingsPage
                user={user}
                consent={consent}
                onRefresh={() => refreshWorkspace()}
                onAccountDeleted={() => {
                  setAuthToken(null);
                  setUser(null);
                  setRoute('landing');
                }}
              />
            )}

            {route === 'employer' && <EmployerDashboardPage />}

            {route === 'admin' && (
              <AdminDashboardPage onOpportunitiesChanged={() => refreshWorkspace()} />
            )}
          </motion.div>
        </AnimatePresence>
      </AppShell>
    );
  };

  return renderPublicOrWorkspace();
}
