export type UserRole = 'candidate' | 'employer' | 'admin';

export type AppRoute =
  | 'landing'
  | 'signup'
  | 'login'
  | 'recover'
  | 'dashboard'
  | 'profile'
  | 'documents'
  | 'assessment'
  | 'recognition'
  | 'readiness'
  | 'opportunities'
  | 'saved'
  | 'portfolio'
  | 'settings'
  | 'employer'
  | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_demo: boolean;
}

export interface ProfileRecord {
  user_id: string;
  headline: string;
  bio: string;
  current_location: string;
  origin_country: string;
  displacement_status: string;
  years_experience: number;
  target_sector: string;
  career_goals: string;
  languages_json: string;
  legal_readiness_json: string;
  completeness_score: number;
  updated_at: string;
}

export interface QualificationRecord {
  id: string;
  user_id: string;
  title: string;
  institution: string;
  country: string;
  year_obtained: string;
  level: string;
  status: 'user_provided' | 'evidence_extracted' | 'officially_verified';
  notes: string;
  created_at: string;
}

export interface WorkExperienceRecord {
  id: string;
  user_id: string;
  job_title: string;
  organization: string;
  country: string;
  start_year: string;
  end_year: string;
  is_current: number;
  description: string;
  achievements: string;
  created_at: string;
}

export interface SkillRecord {
  id: string;
  user_id: string;
  name: string;
  category: 'technical' | 'transferable' | 'language' | 'tool';
  proficiency: string;
  source: 'user_provided' | 'extracted' | 'ai_suggested' | 'officially_verified';
  evidence_note: string;
  created_at: string;
}

export interface DocumentRecord {
  id: string;
  user_id: string;
  original_name: string;
  stored_filename: string;
  mime_type: string;
  file_size: number;
  category:
    | 'cv'
    | 'academic_certificate'
    | 'professional_certificate'
    | 'reference_letter'
    | 'employment_record'
    | 'work_sample'
    | 'training_certificate'
    | 'other';
  status: 'uploaded' | 'analyzed' | 'needs_review';
  extracted_summary: string;
  extracted_skills_json: string;
  evidence_gaps_json: string;
  confidence_note: string;
  is_demo: number;
  created_at: string;
}

export interface EvidenceSummary {
  score: number;
  categoriesPresent: string[];
  missingCategories: string[];
}

export interface AssessmentResultItem {
  id: string;
  assessment_id: string;
  result_type: 'strength' | 'transferable_skill' | 'missing_evidence' | 'recommended_step';
  title: string;
  detail: string;
  rationale: string;
  priority: 'high' | 'medium' | 'low';
  source_badge: string;
}

export interface AssessmentRecord {
  id: string;
  user_id: string;
  mode: 'gemini' | 'demo';
  summary: string;
  evidence_strength_score: number;
  profile_analysis_json: string;
  career_directions_json: string;
  disclaimer: string;
  created_at: string;
  results: AssessmentResultItem[];
}

export interface PathwayStepRecord {
  id: string;
  pathway_id: string;
  step_order: number;
  title: string;
  action_required: string;
  required_documents: string;
  authority_name: string;
  official_url: string;
  status: 'pending' | 'in_progress' | 'completed';
  updated_at: string;
}

export interface RecognitionPathwayRecord {
  id: string;
  user_id: string;
  target_occupation: string;
  pathway_type: 'rpl' | 'foreign_qualification' | 'competency' | 'bridging' | 'licensing';
  institution_name: string;
  official_url: string;
  summary: string;
  created_at: string;
  steps: PathwayStepRecord[];
}

export interface OpportunityRecord {
  id: string;
  title: string;
  organization: string;
  category: 'job' | 'mentorship' | 'training' | 'fellowship' | 'returnship' | 'development';
  location: string;
  work_mode: string;
  required_skills_json: string;
  description: string;
  match_guidance: string;
  is_demo: number;
  created_at: string;
}

export interface OpportunityMatch {
  opportunityId: string;
  matchScore: number;
  reason: string;
  skillsGaps: string[];
  suggestedImprovement: string;
}

export interface PortfolioRecord {
  id: string;
  user_id: string;
  title: string;
  summary: string;
  strengths_json: string;
  gaps_json: string;
  next_steps_json: string;
  included_doc_ids_json: string;
  mode: 'gemini' | 'demo';
  created_at: string;
  updated_at: string;
}

export interface ConsentRecord {
  user_id: string;
  share_with_employers: number;
  share_with_mentors: number;
  share_documents_summary: number;
  updated_at?: string;
}

export interface NotificationRecord {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'ai' | 'pathway' | 'security';
  is_read: number;
  created_at: string;
}

export interface MicroLearningModule {
  id: string;
  title: string;
  targetSkill: string;
  estimatedDuration: string;
  format: string;
  actionSteps: string[];
  outcomeArtifact: string;
}

export interface LocalTrainingResource {
  id: string;
  name: string;
  provider: string;
  location: string;
  costNote: string;
  officialUrl: string;
  relevantGap: string;
  whyItHelps: string;
}

export interface MicroLearningRecommendationResponse {
  mode: 'gemini' | 'demo';
  demoNotice?: string;
  summary: string;
  microLearningModules: MicroLearningModule[];
  localTrainingResources: LocalTrainingResource[];
}

export interface MentorPeerRecord {
  id: string;
  full_name: string;
  role_title: string;
  organization: string;
  peer_type: 'mentor' | 'industry_peer';
  sector_id: string;
  sector_label: string;
  location: string;
  expertise_json: string;
  bio: string;
  availability_note: string;
  is_demo: number;
  created_at: string;
  connection_id?: string | null;
  connection_status?: 'requested' | 'withdrawn' | null;
  connection_message?: string | null;
  connection_sector?: string | null;
  connected_at?: string | null;
}

export interface MentorConnectionRecord {
  id: string;
  user_id: string;
  mentor_id: string;
  target_sector: string;
  message: string;
  status: 'requested' | 'withdrawn';
  created_at: string;
  updated_at: string;
}
