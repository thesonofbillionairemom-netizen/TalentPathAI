import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const STORAGE_ROOT = path.resolve(process.cwd(), 'storage');
export const UPLOAD_DIR = path.resolve(STORAGE_ROOT, 'uploads');
const DB_PATH = path.resolve(STORAGE_ROOT, 'talentpath.db');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function hashSecret(secret: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(secret, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifySecret(secret: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  if (!salt || !keyHex) return false;
  const derived = crypto.scryptSync(secret, salt, 64);
  const storedBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(derived, storedBuf);
}

export function initSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('candidate', 'employer', 'admin')),
      recovery_phrase_hash TEXT NOT NULL,
      is_demo INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

    CREATE TABLE IF NOT EXISTS profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      headline TEXT NOT NULL DEFAULT '',
      bio TEXT NOT NULL DEFAULT '',
      current_location TEXT NOT NULL DEFAULT 'Nairobi, Kenya',
      origin_country TEXT NOT NULL DEFAULT '',
      displacement_status TEXT NOT NULL DEFAULT 'Refugee / Displaced Professional',
      years_experience INTEGER NOT NULL DEFAULT 0 CHECK(years_experience >= 0),
      target_sector TEXT NOT NULL DEFAULT '',
      career_goals TEXT NOT NULL DEFAULT '',
      languages_json TEXT NOT NULL DEFAULT '[]',
      legal_readiness_json TEXT NOT NULL DEFAULT '{}',
      completeness_score INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS qualifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      institution TEXT NOT NULL,
      country TEXT NOT NULL DEFAULT '',
      year_obtained TEXT NOT NULL DEFAULT '',
      level TEXT NOT NULL DEFAULT 'Degree / Diploma',
      status TEXT NOT NULL DEFAULT 'user_provided' CHECK(status IN ('user_provided', 'evidence_extracted', 'officially_verified')),
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_qual_user ON qualifications(user_id);

    CREATE TABLE IF NOT EXISTS work_experience (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      job_title TEXT NOT NULL,
      organization TEXT NOT NULL,
      country TEXT NOT NULL DEFAULT '',
      start_year TEXT NOT NULL DEFAULT '',
      end_year TEXT NOT NULL DEFAULT '',
      is_current INTEGER NOT NULL DEFAULT 0,
      description TEXT NOT NULL DEFAULT '',
      achievements TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_work_user ON work_experience(user_id);

    CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('technical', 'transferable', 'language', 'tool')),
      proficiency TEXT NOT NULL DEFAULT 'Proficient',
      source TEXT NOT NULL DEFAULT 'user_provided' CHECK(source IN ('user_provided', 'extracted', 'ai_suggested', 'officially_verified')),
      evidence_note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_skills_user ON skills(user_id);

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      original_name TEXT NOT NULL,
      stored_filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size INTEGER NOT NULL CHECK(file_size >= 0),
      category TEXT NOT NULL CHECK(category IN (
        'cv', 'academic_certificate', 'professional_certificate',
        'reference_letter', 'employment_record', 'work_sample',
        'training_certificate', 'other'
      )),
      status TEXT NOT NULL DEFAULT 'uploaded' CHECK(status IN ('uploaded', 'analyzed', 'needs_review')),
      extracted_summary TEXT NOT NULL DEFAULT '',
      extracted_skills_json TEXT NOT NULL DEFAULT '[]',
      evidence_gaps_json TEXT NOT NULL DEFAULT '[]',
      confidence_note TEXT NOT NULL DEFAULT '',
      is_demo INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_docs_user ON documents(user_id);

    CREATE TABLE IF NOT EXISTS assessments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      mode TEXT NOT NULL CHECK(mode IN ('gemini', 'demo')),
      summary TEXT NOT NULL,
      evidence_strength_score INTEGER NOT NULL CHECK(evidence_strength_score BETWEEN 0 AND 100),
      profile_analysis_json TEXT NOT NULL DEFAULT '{}',
      career_directions_json TEXT NOT NULL DEFAULT '[]',
      disclaimer TEXT NOT NULL DEFAULT 'AI-assisted assessment only. Not an official qualification verification.',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_assess_user ON assessments(user_id);

    CREATE TABLE IF NOT EXISTS assessment_results (
      id TEXT PRIMARY KEY,
      assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
      result_type TEXT NOT NULL CHECK(result_type IN ('strength', 'transferable_skill', 'missing_evidence', 'recommended_step')),
      title TEXT NOT NULL,
      detail TEXT NOT NULL,
      rationale TEXT NOT NULL DEFAULT '',
      priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('high', 'medium', 'low')),
      source_badge TEXT NOT NULL DEFAULT 'ai_suggested',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_assess_res ON assessment_results(assessment_id);

    CREATE TABLE IF NOT EXISTS recognition_pathways (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      target_occupation TEXT NOT NULL,
      pathway_type TEXT NOT NULL CHECK(pathway_type IN ('rpl', 'foreign_qualification', 'competency', 'bridging', 'licensing')),
      institution_name TEXT NOT NULL,
      official_url TEXT NOT NULL,
      summary TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_pathways_user ON recognition_pathways(user_id);

    CREATE TABLE IF NOT EXISTS pathway_steps (
      id TEXT PRIMARY KEY,
      pathway_id TEXT NOT NULL REFERENCES recognition_pathways(id) ON DELETE CASCADE,
      step_order INTEGER NOT NULL,
      title TEXT NOT NULL,
      action_required TEXT NOT NULL,
      required_documents TEXT NOT NULL,
      authority_name TEXT NOT NULL,
      official_url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_steps_pathway ON pathway_steps(pathway_id);

    CREATE TABLE IF NOT EXISTS opportunities (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      organization TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('job', 'mentorship', 'training', 'fellowship', 'returnship', 'development')),
      location TEXT NOT NULL,
      work_mode TEXT NOT NULL DEFAULT 'Hybrid',
      required_skills_json TEXT NOT NULL DEFAULT '[]',
      description TEXT NOT NULL,
      match_guidance TEXT NOT NULL DEFAULT '',
      is_demo INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS saved_opportunities (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      opportunity_id TEXT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, opportunity_id)
    );
    CREATE INDEX IF NOT EXISTS idx_saved_opp_user ON saved_opportunities(user_id);

    CREATE TABLE IF NOT EXISTS portfolios (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      strengths_json TEXT NOT NULL DEFAULT '[]',
      gaps_json TEXT NOT NULL DEFAULT '[]',
      next_steps_json TEXT NOT NULL DEFAULT '[]',
      included_doc_ids_json TEXT NOT NULL DEFAULT '[]',
      mode TEXT NOT NULL DEFAULT 'demo' CHECK(mode IN ('gemini', 'demo')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_portfolios_user ON portfolios(user_id);

    CREATE TABLE IF NOT EXISTS user_consents (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      share_with_employers INTEGER NOT NULL DEFAULT 0,
      share_with_mentors INTEGER NOT NULL DEFAULT 0,
      share_documents_summary INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info' CHECK(type IN ('info', 'ai', 'pathway', 'security')),
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS mentors_peers (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      role_title TEXT NOT NULL,
      organization TEXT NOT NULL,
      peer_type TEXT NOT NULL CHECK(peer_type IN ('mentor', 'industry_peer')),
      sector_id TEXT NOT NULL,
      sector_label TEXT NOT NULL,
      location TEXT NOT NULL,
      expertise_json TEXT NOT NULL DEFAULT '[]',
      bio TEXT NOT NULL,
      availability_note TEXT NOT NULL,
      is_demo INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_mentors_sector ON mentors_peers(sector_id);

    CREATE TABLE IF NOT EXISTS mentor_connections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      mentor_id TEXT NOT NULL REFERENCES mentors_peers(id) ON DELETE CASCADE,
      target_sector TEXT NOT NULL DEFAULT '',
      message TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'requested' CHECK(status IN ('requested', 'withdrawn')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, mentor_id)
    );
    CREATE INDEX IF NOT EXISTS idx_mentor_conn_user ON mentor_connections(user_id);
  `);
}

export function recalculateProfileCompleteness(userId: string): number {
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId) as Record<string, unknown> | undefined;
  if (!profile) return 0;

  let score = 0;
  if (String(profile.headline || '').trim().length > 4) score += 15;
  if (String(profile.bio || '').trim().length > 20) score += 15;
  if (String(profile.career_goals || '').trim().length > 10) score += 10;
  const langs = JSON.parse(String(profile.languages_json || '[]')) as unknown[];
  if (langs.length > 0) score += 10;

  const qualCount = (db.prepare('SELECT COUNT(*) as c FROM qualifications WHERE user_id = ?').get(userId) as { c: number }).c;
  if (qualCount > 0) score += 15;

  const workCount = (db.prepare('SELECT COUNT(*) as c FROM work_experience WHERE user_id = ?').get(userId) as { c: number }).c;
  if (workCount > 0) score += 15;

  const skillCount = (db.prepare('SELECT COUNT(*) as c FROM skills WHERE user_id = ?').get(userId) as { c: number }).c;
  if (skillCount >= 3) score += 10;
  else if (skillCount > 0) score += 5;

  const docCount = (db.prepare('SELECT COUNT(*) as c FROM documents WHERE user_id = ?').get(userId) as { c: number }).c;
  if (docCount > 0) score += 10;

  const clamped = Math.min(100, score);
  db.prepare("UPDATE profiles SET completeness_score = ?, updated_at = datetime('now') WHERE user_id = ?").run(clamped, userId);
  return clamped;
}

export function computeEvidenceStrength(userId: string): {
  score: number;
  categoriesPresent: string[];
  missingCategories: string[];
} {
  const docs = db.prepare('SELECT category, status FROM documents WHERE user_id = ?').all(userId) as Array<{ category: string; status: string }>;
  const qualCount = (db.prepare('SELECT COUNT(*) as c FROM qualifications WHERE user_id = ?').get(userId) as { c: number }).c;
  const workCount = (db.prepare('SELECT COUNT(*) as c FROM work_experience WHERE user_id = ?').get(userId) as { c: number }).c;

  const present = Array.from(new Set(docs.map((d) => d.category)));
  const essential = ['cv', 'academic_certificate', 'reference_letter', 'employment_record'];
  const missing = essential.filter((c) => !present.includes(c));

  let score = 0;
  if (present.includes('cv')) score += 22;
  if (present.includes('academic_certificate')) score += 22;
  if (present.includes('reference_letter')) score += 18;
  if (present.includes('employment_record')) score += 15;
  if (present.includes('professional_certificate') || present.includes('training_certificate')) score += 10;
  if (present.includes('work_sample')) score += 8;
  if (qualCount > 0 && workCount > 0) score += 5;

  return {
    score: Math.min(100, score),
    categoriesPresent: present,
    missingCategories: missing,
  };
}

export function seedDemoData(): void {
  const existingSetting = db.prepare("SELECT value FROM app_settings WHERE key = 'demo_seeded_v1'").get() as { value: string } | undefined;
  if (existingSetting) return;

  const tx = db.transaction(() => {
    db.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('demo_mode_banner', 'enabled')").run();
    db.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('platform_notice', 'TalentPath AI provides AI-assisted guidance for qualification preparation in Kenya and never replaces official accreditation.')").run();

    // 1. Demo Candidate: Fictional displaced civil & solar engineer (DEMO DATA)
    const candidateId = 'demo-candidate-amina';
    db.prepare(`
      INSERT OR IGNORE INTO users (id, email, password_hash, full_name, role, recovery_phrase_hash, is_demo)
      VALUES (?, ?, ?, ?, 'candidate', ?, 1)
    `).run(
      candidateId,
      'amina.demo@talentpath.example',
      hashSecret('DemoCandidate2026!'),
      'Amina Hassan (SAMPLE DATA)',
      hashSecret('nairobi-solar-bridge')
    );

    db.prepare(`
      INSERT OR IGNORE INTO profiles (
        user_id, headline, bio, current_location, origin_country, displacement_status,
        years_experience, target_sector, career_goals, languages_json, legal_readiness_json, completeness_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      candidateId,
      'Civil & Solar Microgrid Engineer (SAMPLE DATA)',
      'Fictional demonstration profile illustrating a displaced civil and off-grid solar engineer living in Nairobi, Kenya, with 6 years of regional infrastructure project supervision and incomplete original paper transcripts.',
      'Nairobi, Kenya',
      'Regional Displacement Context (Sample)',
      'Registered Refugee (Kenya — SAMPLE DATA)',
      6,
      'Renewable Energy & Civil Infrastructure',
      'Obtain Recognition of Prior Learning (RPL) or foreign qualification evaluation in Kenya and transition into grid-tied solar engineering or humanitarian infrastructure supervision.',
      JSON.stringify(['English (Fluent)', 'Swahili (Conversational)', 'Arabic (Native)', 'Somali (Fluent)']),
      JSON.stringify({
        drs_registration: true,
        refugee_id_card: true,
        kra_pin_prepared: false,
        work_permit_review: false,
        knqa_rpl_dossier: false,
        bank_mobile_money: true,
      }),
      88
    );

    db.prepare(`
      INSERT OR IGNORE INTO user_consents (user_id, share_with_employers, share_with_mentors, share_documents_summary)
      VALUES (?, 1, 1, 1)
    `).run(candidateId);

    // Qualifications (sample)
    db.prepare(`
      INSERT OR IGNORE INTO qualifications (id, user_id, title, institution, country, year_obtained, level, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'user_provided', ?)
    `).run(
      'qual-demo-1',
      candidateId,
      'B.Sc. in Civil & Structural Engineering (SAMPLE DATA)',
      'Khartoum Technical University (Illustrative)',
      'Sudan (Sample)',
      '2018',
      'Bachelor Degree',
      'Original hard-copy transcript left behind during displacement; digital scan of provisional graduation letter available.'
    );
    db.prepare(`
      INSERT OR IGNORE INTO qualifications (id, user_id, title, institution, country, year_obtained, level, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'evidence_extracted', ?)
    `).run(
      'qual-demo-2',
      candidateId,
      'Solar PV System Design & Microgrid Safety Certificate (SAMPLE DATA)',
      'East Africa Energy Skills Initiative (Illustrative)',
      'Kenya (Sample)',
      '2024',
      'Technical Certificate',
      'Completed 120-hour practical solar microgrid installation workshop.'
    );

    // Work experience (sample)
    db.prepare(`
      INSERT OR IGNORE INTO work_experience (id, user_id, job_title, organization, country, start_year, end_year, is_current, description, achievements)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(
      'work-demo-1',
      candidateId,
      'Site Civil & Solar Infrastructure Engineer (SAMPLE DATA)',
      'Horn Community Water & Power Works (Illustrative)',
      'Regional (Sample)',
      '2019',
      '2023',
      'Supervised borehole solar pumping stations, structural foundations, and community distribution lines across 14 rural sites.',
      'Delivered 14 off-grid solar water pumping systems serving ~18,000 residents while reducing diesel generator reliance by 65%.'
    );
    db.prepare(`
      INSERT OR IGNORE INTO work_experience (id, user_id, job_title, organization, country, start_year, end_year, is_current, description, achievements)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(
      'work-demo-2',
      candidateId,
      'Technical Apprentice & Solar CAD Drafter (SAMPLE DATA)',
      'Nairobi CleanTech Community Workshop (Illustrative)',
      'Kenya',
      '2024',
      'Present',
      'Assists local technicians with AutoCAD site layouts, load calculations, and bill-of-quantities preparation.',
      'Standardized safety checklists for 6 community solar installations in informal and peri-urban settlements.'
    );

    // Skills (clearly distinguishing user_provided vs extracted vs ai_suggested)
    const demoSkills = [
      ['skill-demo-1', 'AutoCAD Civil 3D & Site Drafting', 'technical', 'Advanced', 'user_provided', 'Reported in profile and work history'],
      ['skill-demo-2', 'Solar PV Microgrid Sizing', 'technical', 'Advanced', 'extracted', 'Extracted from sample Solar PV certificate'],
      ['skill-demo-3', 'Structural Load & Foundation Inspection', 'technical', 'Proficient', 'extracted', 'Extracted from sample site supervisor reference'],
      ['skill-demo-4', 'Cross-Cultural Site Leadership', 'transferable', 'Advanced', 'ai_suggested', 'AI-identified transferable competency across multi-site roles'],
      ['skill-demo-5', 'Bill of Quantities & Cost Estimation', 'transferable', 'Proficient', 'user_provided', 'Listed under Nairobi workshop experience'],
      ['skill-demo-6', 'Safety Compliance & Risk Auditing', 'transferable', 'Proficient', 'ai_suggested', 'AI-inferred from borehole & solar safety workflows'],
    ];
    for (const [id, name, cat, prof, src, note] of demoSkills) {
      db.prepare(`
        INSERT OR IGNORE INTO skills (id, user_id, name, category, proficiency, source, evidence_note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, candidateId, name, cat, prof, src, note);
    }

    // Create sample private document files on disk so preview/download works cleanly
    const sampleDocs = [
      {
        id: 'doc-demo-1',
        originalName: 'SAMPLE_Amina_Hassan_CV.txt',
        storedFilename: 'demo_amina_cv.txt',
        category: 'cv',
        content: `SAMPLE DATA — FICTIONAL DEMONSTRATION DOCUMENT\nName: Amina Hassan (Sample)\nRole: Civil & Solar Microgrid Engineer\nExperience: 6 years across structural site supervision and off-grid solar pumping.\nTools: AutoCAD, PVsyst, Excel BOQ, Safety Auditing.\n`,
        summary: 'Sample CV outlining 6 years of civil infrastructure and off-grid solar pumping engineering experience.',
        skills: ['AutoCAD', 'Solar PV Sizing', 'Site Supervision', 'Bill of Quantities'],
        gaps: ['Official certified university academic transcript not yet attached'],
      },
      {
        id: 'doc-demo-2',
        originalName: 'SAMPLE_Site_Supervisor_Reference.txt',
        storedFilename: 'demo_reference_letter.txt',
        category: 'reference_letter',
        content: `SAMPLE DATA — FICTIONAL REFERENCE LETTER\nTo Whom It May Concern,\nAmina Hassan served as Site Civil Engineer (2019-2023), leading foundation inspections and 14 solar borehole installations with exemplary safety standards.\n`,
        summary: 'Sample employment reference confirming multi-site supervision and structural foundation inspection duties (2019–2023).',
        skills: ['Structural Foundation Inspection', 'Team Leadership', 'Safety Compliance'],
        gaps: ['Formal HR employment contract or pay ledger not attached'],
      },
      {
        id: 'doc-demo-3',
        originalName: 'SAMPLE_Solar_PV_Training_Record.txt',
        storedFilename: 'demo_solar_cert.txt',
        category: 'training_certificate',
        content: `SAMPLE DATA — FICTIONAL TRAINING RECORD\nCourse: Solar PV System Design & Microgrid Safety (120 Hours, Nairobi 2024)\nCompetencies: Load estimation, inverter sizing, earthing & surge protection.\n`,
        summary: 'Sample 120-hour practical training record covering solar PV load sizing and safety compliance.',
        skills: ['Solar PV Microgrid Sizing', 'Electrical Safety Earthing'],
        gaps: ['Requires KNQA RPL portfolio mapping for formal Kenyan national qualification equivalence'],
      },
    ];

    for (const d of sampleDocs) {
      const targetPath = path.resolve(UPLOAD_DIR, d.storedFilename);
      fs.writeFileSync(targetPath, d.content, 'utf8');
      const size = Buffer.byteLength(d.content, 'utf8');
      db.prepare(`
        INSERT OR IGNORE INTO documents (
          id, user_id, original_name, stored_filename, mime_type, file_size,
          category, status, extracted_summary, extracted_skills_json, evidence_gaps_json, confidence_note, is_demo
        ) VALUES (?, ?, ?, ?, 'text/plain', ?, ?, 'analyzed', ?, ?, ?, ?, 1)
      `).run(
        d.id,
        candidateId,
        d.originalName,
        d.storedFilename,
        size,
        d.category,
        d.summary,
        JSON.stringify(d.skills),
        JSON.stringify(d.gaps),
        'DEMO DATA: Extracted from fictional demonstration document. Not an official verification.'
      );
    }

    // Seed sample assessment
    db.prepare(`
      INSERT OR IGNORE INTO assessments (
        id, user_id, mode, summary, evidence_strength_score, profile_analysis_json, career_directions_json
      ) VALUES (?, ?, 'demo', ?, 68, ?, ?)
    `).run(
      'assess-demo-1',
      candidateId,
      'DEMO ASSESSMENT: Strong applied civil site supervision and off-grid solar engineering competency supported by a sample CV, training record, and reference letter. Evidence strength is 68/100 because certified academic transcripts and a formal employment contract are currently missing.',
      JSON.stringify({
        headline_fit: 'High alignment with Kenya off-grid renewable energy and civil site technician/engineering roles.',
        key_transferable_strengths: ['Multi-site infrastructure coordination', 'Safety & compliance auditing', 'Technical CAD documentation'],
      }),
      JSON.stringify([
        'Solar Microgrid Field Engineer (RPL / KNQF Level 6 Bridge)',
        'Civil Infrastructure Site Supervisor',
        'CAD & Quantity Surveying Specialist',
      ])
    );

    const assessItems = [
      ['ar-demo-1', 'strength', 'Applied Solar PV & Civil Site Supervision', 'Supported by sample reference letter and 120-hour solar training record.', 'Multiple independent sample artifacts corroborate hands-on field engineering.', 'high', 'extracted'],
      ['ar-demo-2', 'transferable_skill', 'Cross-Border Technical Documentation & Safety Compliance', 'Experience translating site conditions into BOQs and safety checklists.', 'AI-identified transferable skill applicable to Kenyan renewable energy employers.', 'medium', 'ai_suggested'],
      ['ar-demo-3', 'missing_evidence', 'Missing Certified Academic Transcript & Qualification Equivalence', 'No certified B.Sc. transcript or KNQA/UNESCO Qualifications Passport evaluation uploaded yet.', 'Kenyan engineering employers and EBK registration pathways typically require formal credential verification or an RPL portfolio.', 'high', 'ai_suggested'],
      ['ar-demo-4', 'recommended_step', 'Prepare KNQA Recognition of Prior Learning (RPL) Evidence Portfolio', 'Compile 3 project drawings, supervisor attestation, and apply via KNQA RPL portal.', 'RPL provides a recognized Kenyan pathway when original foreign academic papers cannot be retrieved.', 'high', 'ai_suggested'],
    ];
    for (const [id, type, title, detail, rationale, prio, badge] of assessItems) {
      db.prepare(`
        INSERT OR IGNORE INTO assessment_results (id, assessment_id, result_type, title, detail, rationale, priority, source_badge)
        VALUES (?, 'assess-demo-1', ?, ?, ?, ?, ?, ?)
      `).run(id, type, title, detail, rationale, prio, badge);
    }

    // Seed sample recognition pathway
    db.prepare(`
      INSERT OR IGNORE INTO recognition_pathways (id, user_id, target_occupation, pathway_type, institution_name, official_url, summary)
      VALUES (?, ?, ?, 'rpl', 'Kenya National Qualifications Authority (KNQA)', 'https://knqa.go.ke', ?)
    `).run(
      'path-demo-1',
      candidateId,
      'Solar PV & Civil Engineering Technician (KNQF Level 6)',
      'Structured preparation pathway combining Kenya Recognition of Prior Learning (RPL), UNESCO Qualifications Passport support, and Engineers Board of Kenya (EBK) readiness.'
    );

    const steps = [
      ['step-demo-1', 1, 'Confirm DRS Refugee Identity & Documentation', 'Ensure your Department of Refugee Services (DRS) Refugee ID or valid documentation is active and accessible.', 'DRS Refugee ID / Asylum Seeker Pass', 'Department of Refugee Services (DRS)', 'https://www.refugees.go.ke', 'completed'],
      ['step-demo-2', 2, 'Compile Evidence Portfolio for KNQA RPL', 'Gather work samples, site drawings, supervisor letters, and training certificates mapped to occupational standards.', 'Portfolio of Evidence (POE), Reference Letters, Work Samples', 'Kenya National Qualifications Authority (KNQA)', 'https://app.rpl.knqa.go.ke', 'in_progress'],
      ['step-demo-3', 3, 'Explore UNESCO Qualifications Passport (UQP) Assessment', 'Check eligibility for UQP structured credential interviews designed for refugees missing academic papers.', 'Identity Document, Any Partial Transcripts, Structured Background Form', 'UNESCO Qualifications Passport', 'https://www.unesco.org/en/higher-education/qualifications-passport', 'pending'],
      ['step-demo-4', 4, 'Complete Practical Assessment at Accredited TVET/NITA Centre', 'Book competency assessment through a KNQA/TVETA accredited assessment center in Nairobi.', 'KNQA RPL Application Receipt & Practical Assessment Fee Info', 'TVETA / NITA Kenya', 'https://www.tveta.go.ke', 'pending'],
      ['step-demo-5', 5, 'Review Professional Engineering Registration Requirements', 'If seeking graduate or professional civil engineer licensing, verify foreign degree equivalence with EBK.', 'Certified Degree Equivalence & Practical Logbook', 'Engineers Board of Kenya (EBK)', 'https://ebk.or.ke', 'pending'],
    ];
    for (const [id, ord, title, action, docs, auth, url, status] of steps) {
      db.prepare(`
        INSERT OR IGNORE INTO pathway_steps (id, pathway_id, step_order, title, action_required, required_documents, authority_name, official_url, status)
        VALUES (?, 'path-demo-1', ?, ?, ?, ?, ?, ?, ?)
      `).run(id, ord, title, action, docs, auth, url, status);
    }

    // Seed sample portfolio
    db.prepare(`
      INSERT OR IGNORE INTO portfolios (id, user_id, title, summary, strengths_json, gaps_json, next_steps_json, included_doc_ids_json, mode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'demo')
    `).run(
      'port-demo-1',
      candidateId,
      'Amina Hassan — Civil & Solar Microgrid Engineering Portfolio (SAMPLE DATA)',
      'Civil and off-grid solar engineer with 6 years of applied infrastructure delivery across borehole pumping stations, structural foundations, and CAD site layouts. Actively preparing a KNQA Recognition of Prior Learning (RPL) portfolio in Nairobi, Kenya.',
      JSON.stringify([
        '6 years supervising rural water & solar microgrid infrastructure (14 sites)',
        'Applied AutoCAD Civil 3D drafting and Bill of Quantities estimation',
        'Verified 120-hour solar PV system safety training in Nairobi (sample record)',
      ]),
      JSON.stringify([
        'Original university academic transcript unavailable due to displacement',
        'Formal KNQA foreign qualification equivalence / RPL certificate in progress',
      ]),
      JSON.stringify([
        'Submit compiled Portfolio of Evidence to KNQA RPL portal',
        'Complete practical competency assessment via TVETA/NITA accredited centre',
        'Apply to clean-energy technical fellowships and solar EPC returnships in Kenya',
      ]),
      JSON.stringify(['doc-demo-1', 'doc-demo-2', 'doc-demo-3'])
    );

    // 2. Demo Employer / Mentor Account
    const employerId = 'demo-employer-nairobi';
    db.prepare(`
      INSERT OR IGNORE INTO users (id, email, password_hash, full_name, role, recovery_phrase_hash, is_demo)
      VALUES (?, ?, ?, ?, 'employer', ?, 1)
    `).run(
      employerId,
      'mentor.demo@talentpath.example',
      hashSecret('DemoEmployer2026!'),
      'Nairobi Green Energy Mentor (SAMPLE DATA)',
      hashSecret('mentor-kenya-2026')
    );

    // 3. Demo Admin Account
    const adminId = 'demo-admin-platform';
    db.prepare(`
      INSERT OR IGNORE INTO users (id, email, password_hash, full_name, role, recovery_phrase_hash, is_demo)
      VALUES (?, ?, ?, ?, 'admin', ?, 1)
    `).run(
      adminId,
      'admin.demo@talentpath.example',
      hashSecret('DemoAdmin2026!'),
      'TalentPath Administrator (SAMPLE DATA)',
      hashSecret('admin-platform-2026')
    );

    // Seed sample opportunities (All explicitly marked is_demo = 1)
    const opps = [
      ['opp-demo-1', 'Junior Solar Microgrid Field Engineer (DEMO DATA)', 'Savannah Off-Grid Demo Collective', 'job', 'Nairobi / Peri-Urban Kenya', 'Hybrid', ['Solar PV Microgrid Sizing', 'AutoCAD Civil 3D & Site Drafting', 'Safety Compliance & Risk Auditing'], 'Demonstration listing for renewable energy engineering graduates and RPL candidates supporting rural solar mini-grid commissioning.', 'Matches your applied solar PV sizing and site supervision background.'],
      ['opp-demo-2', 'Kenyan Engineering RPL & Licensing Mentorship (DEMO DATA)', 'East Africa Infrastructure Mentors Network', 'mentorship', 'Nairobi & Remote', 'Remote', ['Structural Load & Foundation Inspection', 'AutoCAD Civil 3D & Site Drafting'], '1-on-1 mentorship pairing displaced civil engineers with licensed Kenyan engineers to prepare KNQA RPL portfolios and EBK logbooks.', 'Directly addresses your missing formal qualification equivalence pathway.'],
      ['opp-demo-3', 'TVET / NITA Competency Bridging Bootcamp (DEMO DATA)', 'Kenya Technical Skills Bridge Cohort', 'training', 'Nairobi, Kenya', 'On-site', ['Solar PV Microgrid Sizing', 'Bill of Quantities & Cost Estimation'], '6-week competency-based assessment preparation for artisans and engineers seeking formal KNQF certification.', 'Ideal next step before booking your formal KNQA/TVETA practical assessment.'],
      ['opp-demo-4', 'Clean Energy & Water Infrastructure Fellowship (DEMO DATA)', 'East Africa Humanitarian Tech Fellowship', 'fellowship', 'Kakuma & Nairobi', 'Hybrid', ['Cross-Cultural Site Leadership', 'Solar PV Microgrid Sizing'], '6-month paid fellowship placing displaced technical professionals on community solar and WASH infrastructure teams.', 'Strong match with your 14-site solar borehole pumping track record.'],
      ['opp-demo-5', 'CAD & Quantity Surveying Returnship (DEMO DATA)', 'BuildKenya Inclusive Engineering Hub', 'returnship', 'Nairobi, Kenya', 'Hybrid', ['AutoCAD Civil 3D & Site Drafting', 'Bill of Quantities & Cost Estimation'], 'Structured 12-week returnship for engineers whose careers were interrupted by displacement, including workplace onboarding support.', 'Designed specifically to bridge documentation gaps with supervised local project delivery.'],
      ['opp-demo-6', 'Professional Kenyan Workplace & Financial Readiness Clinic (DEMO DATA)', 'Nairobi Livelihoods & Legal Aid Clinic', 'development', 'Nairobi / Online', 'Remote', ['Cross-Cultural Site Leadership'], 'Workshop series covering DRS work authorization documentation, KRA PIN setup, and formal employment contracts in Kenya.', 'Supports legal and financial onboarding readiness for displaced professionals.'],
      ['opp-demo-7', 'Community Health Data & Digital Operations Associate (DEMO DATA)', 'Rift Valley Digital Health Initiative', 'job', 'Nakuru / Remote', 'Remote', ['Data Analysis', 'Project Coordination', 'Cross-Cultural Site Leadership'], 'Sample role for displaced healthcare, operations, or analytical professionals transitioning into digital health coordination.', 'Transferable project coordination and documentation competencies apply.'],
      ['opp-demo-8', 'Hospitality & Multilingual Customer Operations Mentorship (DEMO DATA)', 'Kenya Inclusive Services Guild', 'mentorship', 'Mombasa & Nairobi', 'Hybrid', ['Multilingual Communication', 'Team Supervision'], 'Mentorship for displaced professionals with hospitality, retail, or multilingual client service backgrounds.', 'Transferable communication and client coordination skills match.'],
    ];

    for (const [id, title, org, cat, loc, mode, reqSkills, desc, guidance] of opps) {
      db.prepare(`
        INSERT OR IGNORE INTO opportunities (id, title, organization, category, location, work_mode, required_skills_json, description, match_guidance, is_demo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).run(id, title, org, cat, loc, mode, JSON.stringify(reqSkills), desc, guidance);
    }

    db.prepare(`
      INSERT OR IGNORE INTO saved_opportunities (id, user_id, opportunity_id, notes)
      VALUES ('saved-demo-1', ?, 'opp-demo-2', 'Priority mentor track for KNQA RPL dossier review.')
    `).run(candidateId);

    db.prepare(`
      INSERT OR IGNORE INTO notifications (id, user_id, title, message, type)
      VALUES
        ('notif-demo-1', ?, 'Welcome to the Sample Engineer Journey', 'This SAMPLE DATA account demonstrates how a displaced engineer prepares evidence and KNQA RPL steps.', 'info'),
        ('notif-demo-2', ?, 'Missing Evidence Detected', 'Your sample assessment flagged a missing certified university transcript. Check the Recognition Navigator for RPL options.', 'pathway')
    `).run(candidateId, candidateId);

    db.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('demo_seeded_v1', '1')").run();
  });

  tx();
}

export function seedKenyanMentors(): void {
  const existing = (db.prepare('SELECT COUNT(*) as c FROM mentors_peers').get() as { c: number }).c;
  if (existing > 0) return;

  const mentors = [
    [
      'mentor-ke-1',
      'Eng. Grace Wanjiku (SAMPLE)',
      'Lead Solar Microgrid Engineer',
      'Savannah Distributed Energy Kenya',
      'mentor',
      'renewable-civil',
      'Renewable Energy & Civil Infrastructure',
      'Nairobi, Kenya',
      ['Solar PV Microgrid Sizing', 'EPRA T3 Licensing', 'KNQA RPL Portfolio Review', 'Site Safety'],
      'Licensed Kenyan solar & civil engineer mentoring displaced and transitioning engineers through KNQA RPL portfolios and EPRA compliance.',
      '2 sessions/month · Virtual or Westlands, Nairobi',
    ],
    [
      'mentor-ke-2',
      'Samuel Otieno (SAMPLE)',
      'Civil Site Peer & RPL Graduate',
      'Turkana Water & Solar Works',
      'industry_peer',
      'renewable-civil',
      'Renewable Energy & Civil Infrastructure',
      'Kakuma / Nairobi, Kenya',
      ['AutoCAD Civil 3D', 'BOQ & Costing', 'Solar Borehole Pumping'],
      'Completed KNQA RPL Level 6 civil & solar certification in 2025; shares practical tips on compiling work drawings and supervisor references.',
      'Async peer Q&A · WhatsApp / Video check-ins',
    ],
    [
      'mentor-ke-3',
      'Faith Muthoni (SAMPLE)',
      'Senior Full-Stack Engineer',
      'Kilimani Fintech Collective',
      'mentor',
      'software-digital',
      'Software & Digital Operations',
      'Nairobi, Kenya',
      ['Software Engineering & Web Systems', 'TypeScript & SQL', 'Technical Interview Prep'],
      'Engineering manager coaching junior and displaced developers in Kenya on portfolio architecture, code reviews, and remote tech readiness.',
      '1-on-1 code & CV review · Remote across Kenya',
    ],
    [
      'mentor-ke-4',
      'Brian Kiprop (SAMPLE)',
      'Data Operations Analyst',
      'Rift Valley AgriTech Hub',
      'industry_peer',
      'software-digital',
      'Software & Digital Operations',
      'Eldoret / Remote, Kenya',
      ['Data Analysis & SQL', 'Agile Project Delivery', 'ODPC Compliance'],
      'Transitioned from operations into SQL & analytics through Ajira Digital and local tech meetups; open to peer study sprints.',
      'Weekly study buddy · Remote',
    ],
    [
      'mentor-ke-5',
      'Dr. Halima Abdi (SAMPLE)',
      'Community Health Program Advisor',
      'Nairobi Urban Health Consortium',
      'mentor',
      'healthcare-community',
      'Healthcare & Community Health',
      'Nairobi, Kenya',
      ['Clinical / Public Health Ops', 'DHIS2 & M&E', 'NGO Referral Workflows'],
      'Public health specialist supporting displaced clinicians and allied health workers navigating Kenyan NGO roles and credential orientation.',
      '2 slots/month · Nairobi or Zoom',
    ],
    [
      'mentor-ke-6',
      'Mercy Chebet (SAMPLE)',
      'Health Informatics Officer',
      'Nakuru County Outreach Initiative',
      'industry_peer',
      'healthcare-community',
      'Healthcare & Community Health',
      'Nakuru, Kenya',
      ['Health Data & KoboToolbox', 'Multilingual Community Outreach', 'IPC Safety'],
      'Allied health peer working on DHIS2 community monitoring; happy to share local Kenyan M&E templates and interview insights.',
      'Bi-weekly peer chat · Remote',
    ],
    [
      'mentor-ke-7',
      'Peter Kamau (SAMPLE)',
      'Master Electrical & TVET Assessor',
      'NITA Trade Prep Workshop',
      'mentor',
      'construction-trades',
      'Construction & Skilled Trades (TVET / NITA)',
      'Nairobi (Industrial Area), Kenya',
      ['NITA Grade I/II Trade Tests', 'Site Safety & NCA', 'Blueprint Reading'],
      'Accredited practical trade coach helping experienced artisans prepare for NITA Grade tests and KNQA Recognition of Prior Learning.',
      'Workshop walkthroughs · Nairobi',
    ],
    [
      'mentor-ke-8',
      'Hassan Noor (SAMPLE)',
      'Site Foreman & Plumbing Peer',
      'Coastal Builders Cooperative',
      'industry_peer',
      'construction-trades',
      'Construction & Skilled Trades (TVET / NITA)',
      'Mombasa, Kenya',
      ['Core Trade Execution', 'Artisan Crew Supervision', 'Work Log Documentation'],
      'Passed NITA Grade II practical assessment using employer work logs; connects peers with coastal contractor networks.',
      'Weekend phone / site Q&A',
    ],
    [
      'mentor-ke-9',
      'Beatrice Akinyi (SAMPLE)',
      'Hospitality Training Lead',
      'Pwani Inclusive Tourism Guild',
      'mentor',
      'hospitality-services',
      'Hospitality & Multilingual Client Services',
      'Mombasa, Kenya',
      ['Guest Experience Ops', 'Shift Supervision', 'HACCP Hygiene Standards'],
      'Hospitality operations director coaching multilingual professionals for coastal resorts, Nairobi hotels, and international customer desks.',
      'Monthly mock interviews · Mombasa & Remote',
    ],
    [
      'mentor-ke-10',
      'Daniel Mwangi (SAMPLE)',
      'Multilingual CX Team Lead',
      'Nairobi Shared Services Hub',
      'industry_peer',
      'hospitality-services',
      'Hospitality & Multilingual Client Services',
      'Nairobi, Kenya',
      ['CRM & POS Systems', 'Multilingual Support', 'Client Operations'],
      'Supports multilingual peers moving from hospitality into BPO and remote customer operations across Kenya.',
      'Peer resume & CRM tips · Remote',
    ],
    [
      'mentor-ke-11',
      'Caroline Njeri (SAMPLE)',
      'Humanitarian Supply Chain Manager',
      'East Africa Relief Logistics',
      'mentor',
      'logistics-supply',
      'Logistics & Humanitarian Supply Chain',
      'Nairobi, Kenya',
      ['Inventory & Fleet Control', 'Humanitarian Procurement', 'EAC Customs Compliance'],
      '10+ years managing Kenyan and regional relief corridors; advises on NGO procurement terminology and fleet leadership.',
      '2 mentoring calls/month · Nairobi / Remote',
    ],
    [
      'mentor-ke-12',
      'Yusuf Abdullahi (SAMPLE)',
      'Warehouse & Stock Coordinator',
      'Northern Corridor Freight Partners',
      'industry_peer',
      'logistics-supply',
      'Logistics & Humanitarian Supply Chain',
      'Eldoret / Nakuru, Kenya',
      ['Spreadsheets & ERP Stock', 'Dispatch Coordination', 'Cargo Safety'],
      'Logistics peer sharing Excel stock reconciliation workflows and regional transport compliance pointers.',
      'Peer check-ins · Remote',
    ],
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO mentors_peers (
      id, full_name, role_title, organization, peer_type, sector_id, sector_label,
      location, expertise_json, bio, availability_note, is_demo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  const tx = db.transaction(() => {
    for (const row of mentors) {
      const [id, name, roleTitle, org, peerType, sectorId, sectorLabel, location, expertise, bio, avail] = row as [
        string, string, string, string, string, string, string, string, string[], string, string
      ];
      stmt.run(id, name, roleTitle, org, peerType, sectorId, sectorLabel, location, JSON.stringify(expertise), bio, avail);
    }
  });
  tx();
}

initSchema();
seedDemoData();
seedKenyanMentors();
