import 'dotenv/config';
import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import multer from 'multer';
import {
  db,
  UPLOAD_DIR,
  hashSecret,
  verifySecret,
  recalculateProfileCompleteness,
  computeEvidenceStrength,
} from './server/db.ts';
import {
  createSession,
  revokeSession,
  requireAuth,
  requireRole,
  type AuthedRequest,
  type UserRole,
} from './server/auth.ts';
import {
  isGeminiConfigured,
  analyzeProfileWithAI,
  analyzeDocumentWithAI,
  runSkillsAssessmentWithAI,
  generateRecognitionPathwayWithAI,
  matchOpportunitiesWithAI,
  generatePortfolioWithAI,
} from './server/gemini.ts';

const app = express();
app.use(express.json({ limit: '2mb' }));

const ALLOWED_MIMES: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'text/plain': '.txt',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIMES[file.mimetype]) {
      cb(new Error('Unsupported file type. Allowed: PDF, PNG, JPG, TXT, DOCX.'));
      return;
    }
    cb(null, true);
  },
});

function createNotification(userId: string, title: string, message: string, type: 'info' | 'ai' | 'pathway' | 'security' = 'info'): void {
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type)
    VALUES (?, ?, ?, ?, ?)
  `).run(`notif-${crypto.randomUUID()}`, userId, title, message, type);
}

// Health & System Config
app.get('/api/health', (_req, res) => {
  const bannerRow = db.prepare("SELECT value FROM app_settings WHERE key = 'demo_mode_banner'").get() as { value: string } | undefined;
  res.json({
    ok: true,
    aiConfigured: isGeminiConfigured(),
    demoBanner: bannerRow?.value ?? 'enabled',
  });
});

// ==================== AUTH ROUTES ====================
app.post('/api/auth/register', (req, res) => {
  const { email, password, fullName, role, recoveryPhrase } = req.body ?? {};
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanName = String(fullName || '').trim();
  const cleanPassword = String(password || '');
  const cleanRecovery = String(recoveryPhrase || '').trim();
  const selectedRole: UserRole = role === 'employer' ? 'employer' : 'candidate';

  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }
  if (cleanName.length < 2) {
    res.status(400).json({ error: 'Full name must be at least 2 characters.' });
    return;
  }
  if (cleanPassword.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    return;
  }
  if (cleanRecovery.length < 4) {
    res.status(400).json({ error: 'Recovery phrase must be at least 4 characters so you can reset your password.' });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists.' });
    return;
  }

  const userId = `usr-${crypto.randomUUID()}`;
  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, role, recovery_phrase_hash, is_demo)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `).run(userId, cleanEmail, hashSecret(cleanPassword), cleanName, selectedRole, hashSecret(cleanRecovery.toLowerCase()));

    if (selectedRole === 'candidate') {
      db.prepare(`
        INSERT INTO profiles (user_id, current_location, languages_json, legal_readiness_json, completeness_score)
        VALUES (?, 'Nairobi, Kenya', '["English"]', '{}', 0)
      `).run(userId);
      db.prepare(`
        INSERT INTO user_consents (user_id, share_with_employers, share_with_mentors, share_documents_summary)
        VALUES (?, 0, 0, 0)
      `).run(userId);
    }

    createNotification(
      userId,
      'Welcome to TalentPath AI',
      selectedRole === 'candidate'
        ? 'Start by completing your profile and uploading supporting evidence in the Document Centre.'
        : 'Employer/Mentor account created. You can review candidates who explicitly enable sharing consent.',
      'info'
    );
  });
  tx();

  const token = createSession(userId);
  res.status(201).json({
    token,
    user: { id: userId, email: cleanEmail, full_name: cleanName, role: selectedRole, is_demo: false },
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body ?? {};
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPassword = String(password || '');

  if (!cleanEmail || !cleanPassword) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail) as {
    id: string;
    email: string;
    password_hash: string;
    full_name: string;
    role: UserRole;
    is_demo: number;
  } | undefined;

  if (!user || !verifySecret(cleanPassword, user.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const token = createSession(user.id);
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_demo: Boolean(user.is_demo),
    },
  });
});

app.post('/api/auth/recover', (req, res) => {
  const { email, recoveryPhrase, newPassword } = req.body ?? {};
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPhrase = String(recoveryPhrase || '').trim().toLowerCase();
  const cleanNewPassword = String(newPassword || '');

  if (!cleanEmail || !cleanPhrase || cleanNewPassword.length < 8) {
    res.status(400).json({ error: 'Email, recovery phrase, and a new password (min 8 chars) are required.' });
    return;
  }

  const user = db.prepare('SELECT id, recovery_phrase_hash FROM users WHERE email = ?').get(cleanEmail) as {
    id: string;
    recovery_phrase_hash: string;
  } | undefined;

  if (!user || !verifySecret(cleanPhrase, user.recovery_phrase_hash)) {
    res.status(401).json({ error: 'Account email or recovery phrase did not match our records.' });
    return;
  }

  db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(hashSecret(cleanNewPassword), user.id);
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);
  createNotification(user.id, 'Password Updated', 'Your account password was reset via recovery phrase verification.', 'security');
  res.json({ ok: true, message: 'Password updated successfully. You may now log in with your new password.' });
});

app.post('/api/auth/logout', requireAuth, (req: AuthedRequest, res) => {
  if (req.sessionTokenHash) {
    revokeSession(req.sessionTokenHash);
  }
  res.json({ ok: true });
});

app.get('/api/auth/me', requireAuth, (req: AuthedRequest, res) => {
  res.json({ user: req.user, aiConfigured: isGeminiConfigured() });
});

// ==================== CANDIDATE PROFILE ROUTES ====================
app.get('/api/profile', requireAuth, (req: AuthedRequest, res) => {
  const userId = req.user!.id;
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId) as Record<string, unknown> | undefined;
  const qualifications = db.prepare('SELECT * FROM qualifications WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  const experience = db.prepare('SELECT * FROM work_experience WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  const skills = db.prepare('SELECT * FROM skills WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  const evidence = computeEvidenceStrength(userId);

  res.json({
    profile: profile || null,
    qualifications,
    experience,
    skills,
    evidence,
  });
});

app.put('/api/profile', requireAuth, requireRole('candidate', 'admin'), (req: AuthedRequest, res) => {
  const userId = req.user!.id;
  const {
    fullName,
    headline,
    bio,
    currentLocation,
    originCountry,
    displacementStatus,
    yearsExperience,
    targetSector,
    careerGoals,
    languages,
  } = req.body ?? {};

  if (fullName && String(fullName).trim().length >= 2) {
    db.prepare("UPDATE users SET full_name = ?, updated_at = datetime('now') WHERE id = ?").run(String(fullName).trim(), userId);
  }

  const langsJson = JSON.stringify(Array.isArray(languages) ? languages.map((l) => String(l).trim()).filter(Boolean) : []);
  const years = Math.max(0, Math.min(60, Number(yearsExperience) || 0));

  db.prepare(`
    INSERT INTO profiles (user_id, headline, bio, current_location, origin_country, displacement_status, years_experience, target_sector, career_goals, languages_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      headline = excluded.headline,
      bio = excluded.bio,
      current_location = excluded.current_location,
      origin_country = excluded.origin_country,
      displacement_status = excluded.displacement_status,
      years_experience = excluded.years_experience,
      target_sector = excluded.target_sector,
      career_goals = excluded.career_goals,
      languages_json = excluded.languages_json,
      updated_at = datetime('now')
  `).run(
    userId,
    String(headline || '').trim(),
    String(bio || '').trim(),
    String(currentLocation || 'Nairobi, Kenya').trim(),
    String(originCountry || '').trim(),
    String(displacementStatus || 'Refugee / Displaced Professional').trim(),
    years,
    String(targetSector || '').trim(),
    String(careerGoals || '').trim(),
    langsJson
  );

  const completeness = recalculateProfileCompleteness(userId);
  const updated = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId);
  res.json({ profile: updated, completeness });
});

app.put('/api/profile/legal-readiness', requireAuth, requireRole('candidate', 'admin'), (req: AuthedRequest, res) => {
  const userId = req.user!.id;
  const { checklist } = req.body ?? {};
  const safeObj = checklist && typeof checklist === 'object' ? checklist : {};
  db.prepare("UPDATE profiles SET legal_readiness_json = ?, updated_at = datetime('now') WHERE user_id = ?").run(JSON.stringify(safeObj), userId);
  res.json({ ok: true, checklist: safeObj });
});

app.post('/api/profile/qualifications', requireAuth, requireRole('candidate', 'admin'), (req: AuthedRequest, res) => {
  const { title, institution, country, yearObtained, level, notes } = req.body ?? {};
  if (!String(title || '').trim() || !String(institution || '').trim()) {
    res.status(400).json({ error: 'Qualification title and institution are required.' });
    return;
  }
  const id = `qual-${crypto.randomUUID()}`;
  db.prepare(`
    INSERT INTO qualifications (id, user_id, title, institution, country, year_obtained, level, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'user_provided', ?)
  `).run(
    id,
    req.user!.id,
    String(title).trim(),
    String(institution).trim(),
    String(country || '').trim(),
    String(yearObtained || '').trim(),
    String(level || 'Certificate / Degree').trim(),
    String(notes || '').trim()
  );
  recalculateProfileCompleteness(req.user!.id);
  const item = db.prepare('SELECT * FROM qualifications WHERE id = ?').get(id);
  res.status(201).json({ qualification: item });
});

app.delete('/api/profile/qualifications/:id', requireAuth, (req: AuthedRequest, res) => {
  const info = db.prepare('DELETE FROM qualifications WHERE id = ? AND user_id = ?').run(req.params.id, req.user!.id);
  if (info.changes === 0) {
    res.status(404).json({ error: 'Qualification not found.' });
    return;
  }
  recalculateProfileCompleteness(req.user!.id);
  res.json({ ok: true });
});

app.post('/api/profile/experience', requireAuth, requireRole('candidate', 'admin'), (req: AuthedRequest, res) => {
  const { jobTitle, organization, country, startYear, endYear, isCurrent, description, achievements } = req.body ?? {};
  if (!String(jobTitle || '').trim() || !String(organization || '').trim()) {
    res.status(400).json({ error: 'Job title and organization are required.' });
    return;
  }
  const id = `work-${crypto.randomUUID()}`;
  db.prepare(`
    INSERT INTO work_experience (id, user_id, job_title, organization, country, start_year, end_year, is_current, description, achievements)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    req.user!.id,
    String(jobTitle).trim(),
    String(organization).trim(),
    String(country || '').trim(),
    String(startYear || '').trim(),
    isCurrent ? 'Present' : String(endYear || '').trim(),
    isCurrent ? 1 : 0,
    String(description || '').trim(),
    String(achievements || '').trim()
  );
  recalculateProfileCompleteness(req.user!.id);
  const item = db.prepare('SELECT * FROM work_experience WHERE id = ?').get(id);
  res.status(201).json({ experience: item });
});

app.delete('/api/profile/experience/:id', requireAuth, (req: AuthedRequest, res) => {
  const info = db.prepare('DELETE FROM work_experience WHERE id = ? AND user_id = ?').run(req.params.id, req.user!.id);
  if (info.changes === 0) {
    res.status(404).json({ error: 'Work experience record not found.' });
    return;
  }
  recalculateProfileCompleteness(req.user!.id);
  res.json({ ok: true });
});

app.post('/api/profile/skills', requireAuth, requireRole('candidate', 'admin'), (req: AuthedRequest, res) => {
  const { name, category, proficiency, evidenceNote } = req.body ?? {};
  if (!String(name || '').trim()) {
    res.status(400).json({ error: 'Skill name is required.' });
    return;
  }
  const validCats = new Set(['technical', 'transferable', 'language', 'tool']);
  const safeCat = validCats.has(String(category)) ? String(category) : 'technical';
  const id = `skill-${crypto.randomUUID()}`;
  db.prepare(`
    INSERT INTO skills (id, user_id, name, category, proficiency, source, evidence_note)
    VALUES (?, ?, ?, ?, ?, 'user_provided', ?)
  `).run(id, req.user!.id, String(name).trim(), safeCat, String(proficiency || 'Proficient').trim(), String(evidenceNote || 'Added by user').trim());
  recalculateProfileCompleteness(req.user!.id);
  const item = db.prepare('SELECT * FROM skills WHERE id = ?').get(id);
  res.status(201).json({ skill: item });
});

app.delete('/api/profile/skills/:id', requireAuth, (req: AuthedRequest, res) => {
  const info = db.prepare('DELETE FROM skills WHERE id = ? AND user_id = ?').run(req.params.id, req.user!.id);
  if (info.changes === 0) {
    res.status(404).json({ error: 'Skill not found.' });
    return;
  }
  recalculateProfileCompleteness(req.user!.id);
  res.json({ ok: true });
});

// ==================== PRIVATE DOCUMENTS & EVIDENCE CENTRE ====================
app.get('/api/documents', requireAuth, (req: AuthedRequest, res) => {
  const docs = db.prepare('SELECT * FROM documents WHERE user_id = ? ORDER BY created_at DESC').all(req.user!.id);
  const evidence = computeEvidenceStrength(req.user!.id);
  res.json({ documents: docs, evidence });
});

app.post('/api/documents', requireAuth, requireRole('candidate', 'admin'), (req: AuthedRequest, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      res.status(400).json({ error: err.message || 'File upload validation failed.' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'Please select a file to upload.' });
      return;
    }

    const validCategories = new Set([
      'cv', 'academic_certificate', 'professional_certificate', 'reference_letter',
      'employment_record', 'work_sample', 'training_certificate', 'other',
    ]);
    const rawCat = String(req.body?.category || 'other');
    const category = validCategories.has(rawCat) ? rawCat : 'other';
    const ext = ALLOWED_MIMES[req.file.mimetype] || '.bin';
    const storedFilename = `${crypto.randomUUID()}${ext}`;
    const targetPath = path.resolve(UPLOAD_DIR, storedFilename);

    if (!targetPath.startsWith(UPLOAD_DIR + path.sep)) {
      res.status(400).json({ error: 'Invalid file destination.' });
      return;
    }

    fs.writeFileSync(targetPath, req.file.buffer);

    const docId = `doc-${crypto.randomUUID()}`;
    const analysis = await analyzeDocumentWithAI({
      originalName: req.file.originalname,
      category,
      mimeType: req.file.mimetype,
      fileBuffer: req.file.buffer,
    });

    db.prepare(`
      INSERT INTO documents (
        id, user_id, original_name, stored_filename, mime_type, file_size,
        category, status, extracted_summary, extracted_skills_json, evidence_gaps_json, confidence_note, is_demo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'analyzed', ?, ?, ?, ?, 0)
    `).run(
      docId,
      req.user!.id,
      req.file.originalname.slice(0, 180),
      storedFilename,
      req.file.mimetype,
      req.file.size,
      category,
      analysis.extractedSummary,
      JSON.stringify(analysis.extractedSkills),
      JSON.stringify(analysis.evidenceGaps),
      analysis.confidenceNote
    );

    recalculateProfileCompleteness(req.user!.id);
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(docId);
    const evidence = computeEvidenceStrength(req.user!.id);
    res.status(201).json({ document: doc, evidence, analysisMode: analysis.mode, demoNotice: analysis.demoNotice });
  });
});

app.get('/api/documents/:id/download', requireAuth, (req: AuthedRequest, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id) as {
    id: string;
    user_id: string;
    original_name: string;
    stored_filename: string;
    mime_type: string;
  } | undefined;

  if (!doc) {
    res.status(404).json({ error: 'Document not found.' });
    return;
  }

  // Strict owner-only access check for private document files
  if (doc.user_id !== req.user!.id) {
    res.status(403).json({ error: 'Access denied: you do not have permission to view this private document.' });
    return;
  }

  const resolvedPath = path.resolve(UPLOAD_DIR, doc.stored_filename);
  if (!resolvedPath.startsWith(UPLOAD_DIR + path.sep) || !fs.existsSync(resolvedPath)) {
    res.status(404).json({ error: 'Document file is missing from private storage.' });
    return;
  }

  res.setHeader('Content-Type', doc.mime_type);
  res.setHeader('Content-Disposition', `inline; filename="${doc.original_name.replace(/[^a-zA-Z0-9._-]/g, '_')}"`);
  fs.createReadStream(resolvedPath).pipe(res);
});

app.post('/api/documents/:id/analyze', requireAuth, async (req: AuthedRequest, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as {
    id: string;
    original_name: string;
    stored_filename: string;
    mime_type: string;
    category: string;
  } | undefined;

  if (!doc) {
    res.status(404).json({ error: 'Document not found.' });
    return;
  }

  const resolvedPath = path.resolve(UPLOAD_DIR, doc.stored_filename);
  const buffer = resolvedPath.startsWith(UPLOAD_DIR + path.sep) && fs.existsSync(resolvedPath)
    ? fs.readFileSync(resolvedPath)
    : null;

  const analysis = await analyzeDocumentWithAI({
    originalName: doc.original_name,
    category: doc.category,
    mimeType: doc.mime_type,
    fileBuffer: buffer,
  });

  db.prepare(`
    UPDATE documents
    SET status = 'analyzed', extracted_summary = ?, extracted_skills_json = ?, evidence_gaps_json = ?, confidence_note = ?
    WHERE id = ? AND user_id = ?
  `).run(
    analysis.extractedSummary,
    JSON.stringify(analysis.extractedSkills),
    JSON.stringify(analysis.evidenceGaps),
    analysis.confidenceNote,
    doc.id,
    req.user!.id
  );

  const updated = db.prepare('SELECT * FROM documents WHERE id = ?').get(doc.id);
  res.json({ document: updated, mode: analysis.mode, demoNotice: analysis.demoNotice });
});

app.delete('/api/documents/:id', requireAuth, (req: AuthedRequest, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as {
    id: string;
    stored_filename: string;
  } | undefined;
  if (!doc) {
    res.status(404).json({ error: 'Document not found.' });
    return;
  }
  const resolvedPath = path.resolve(UPLOAD_DIR, doc.stored_filename);
  if (resolvedPath.startsWith(UPLOAD_DIR + path.sep) && fs.existsSync(resolvedPath)) {
    fs.unlinkSync(resolvedPath);
  }
  db.prepare('DELETE FROM documents WHERE id = ? AND user_id = ?').run(doc.id, req.user!.id);
  recalculateProfileCompleteness(req.user!.id);
  res.json({ ok: true, evidence: computeEvidenceStrength(req.user!.id) });
});

// ==================== AI SKILLS ASSESSMENT ROUTES ====================
app.get('/api/assessments', requireAuth, (req: AuthedRequest, res) => {
  const assessments = db.prepare('SELECT * FROM assessments WHERE user_id = ? ORDER BY created_at DESC').all(req.user!.id) as Array<Record<string, unknown>>;
  const enriched = assessments.map((a) => ({
    ...a,
    results: db.prepare('SELECT * FROM assessment_results WHERE assessment_id = ? ORDER BY created_at ASC').all(String(a.id)),
  }));
  res.json({ assessments: enriched });
});

app.post('/api/assessments/run', requireAuth, requireRole('candidate', 'admin'), async (req: AuthedRequest, res) => {
  const userId = req.user!.id;
  const profile = (db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId) as Record<string, unknown>) || {};
  const qualifications = db.prepare('SELECT * FROM qualifications WHERE user_id = ?').all(userId) as Array<Record<string, unknown>>;
  const experience = db.prepare('SELECT * FROM work_experience WHERE user_id = ?').all(userId) as Array<Record<string, unknown>>;
  const skills = db.prepare('SELECT * FROM skills WHERE user_id = ?').all(userId) as Array<Record<string, unknown>>;
  const documents = db.prepare('SELECT * FROM documents WHERE user_id = ?').all(userId) as Array<Record<string, unknown>>;
  const evidence = computeEvidenceStrength(userId);

  const profileAnalysis = await analyzeProfileWithAI({ profile, qualifications, experience });
  const assessment = await runSkillsAssessmentWithAI({
    profile,
    qualifications,
    experience,
    skills,
    documents,
    baselineEvidenceScore: evidence.score,
    missingDocCategories: evidence.missingCategories,
  });

  const assessmentId = `assess-${crypto.randomUUID()}`;
  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO assessments (id, user_id, mode, summary, evidence_strength_score, profile_analysis_json, career_directions_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      assessmentId,
      userId,
      assessment.mode,
      assessment.summary,
      assessment.evidenceStrengthScore,
      JSON.stringify(profileAnalysis),
      JSON.stringify(assessment.careerDirections)
    );

    for (const r of assessment.results) {
      db.prepare(`
        INSERT INTO assessment_results (id, assessment_id, result_type, title, detail, rationale, priority, source_badge)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(`ar-${crypto.randomUUID()}`, assessmentId, r.resultType, r.title, r.detail, r.rationale, r.priority, r.sourceBadge);
    }

    // Add newly identified AI transferable skills if not already present
    const existingNames = new Set(skills.map((s) => String(s.name).toLowerCase()));
    for (const ts of profileAnalysis.transferableSkills.slice(0, 3)) {
      if (!existingNames.has(ts.toLowerCase())) {
        db.prepare(`
          INSERT INTO skills (id, user_id, name, category, proficiency, source, evidence_note)
          VALUES (?, ?, ?, 'transferable', 'AI Suggested', 'ai_suggested', 'Identified during AI skills assessment')
        `).run(`skill-${crypto.randomUUID()}`, userId, ts);
      }
    }

    createNotification(
      userId,
      assessment.mode === 'gemini' ? 'AI Skills Assessment Complete' : 'Demo Skills Assessment Generated',
      `Evidence strength score: ${assessment.evidenceStrengthScore}/100. Review identified skills and missing evidence.`,
      'ai'
    );
  });
  tx();

  const saved = db.prepare('SELECT * FROM assessments WHERE id = ?').get(assessmentId) as Record<string, unknown>;
  const results = db.prepare('SELECT * FROM assessment_results WHERE assessment_id = ?').all(assessmentId);
  res.status(201).json({
    assessment: { ...saved, results },
    demoNotice: assessment.demoNotice,
  });
});

// ==================== RECOGNITION PATHWAY NAVIGATOR ====================
app.get('/api/pathways', requireAuth, (req: AuthedRequest, res) => {
  const pathways = db.prepare('SELECT * FROM recognition_pathways WHERE user_id = ? ORDER BY created_at DESC').all(req.user!.id) as Array<Record<string, unknown>>;
  const enriched = pathways.map((p) => ({
    ...p,
    steps: db.prepare('SELECT * FROM pathway_steps WHERE pathway_id = ? ORDER BY step_order ASC').all(String(p.id)),
  }));
  res.json({ pathways: enriched });
});

app.post('/api/pathways/generate', requireAuth, requireRole('candidate', 'admin'), async (req: AuthedRequest, res) => {
  const { targetOccupation, pathwayType } = req.body ?? {};
  const occ = String(targetOccupation || '').trim();
  if (occ.length < 2) {
    res.status(400).json({ error: 'Please enter your target occupation or trade.' });
    return;
  }
  const validTypes = new Set(['rpl', 'foreign_qualification', 'competency', 'bridging', 'licensing']);
  const pType = (validTypes.has(String(pathwayType)) ? String(pathwayType) : 'rpl') as 'rpl' | 'foreign_qualification' | 'competency' | 'bridging' | 'licensing';

  const profile = (db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user!.id) as Record<string, unknown>) || {};
  const qualifications = db.prepare('SELECT * FROM qualifications WHERE user_id = ?').all(req.user!.id) as Array<Record<string, unknown>>;

  const generated = await generateRecognitionPathwayWithAI({
    targetOccupation: occ,
    pathwayType: pType,
    profile,
    qualifications,
  });

  const pathwayId = `path-${crypto.randomUUID()}`;
  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO recognition_pathways (id, user_id, target_occupation, pathway_type, institution_name, official_url, summary)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(pathwayId, req.user!.id, occ, pType, generated.institutionName, generated.officialUrl, generated.summary);

    generated.steps.forEach((step, idx) => {
      db.prepare(`
        INSERT INTO pathway_steps (id, pathway_id, step_order, title, action_required, required_documents, authority_name, official_url, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `).run(
        `step-${crypto.randomUUID()}`,
        pathwayId,
        idx + 1,
        step.title,
        step.actionRequired,
        step.requiredDocuments,
        step.authorityName,
        step.officialUrl
      );
    });

    createNotification(req.user!.id, 'Recognition Checklist Ready', `Created Kenyan preparation steps for ${occ}.`, 'pathway');
  });
  tx();

  const pathway = db.prepare('SELECT * FROM recognition_pathways WHERE id = ?').get(pathwayId) as Record<string, unknown>;
  const steps = db.prepare('SELECT * FROM pathway_steps WHERE pathway_id = ? ORDER BY step_order ASC').all(pathwayId);
  res.status(201).json({ pathway: { ...pathway, steps }, mode: generated.mode, demoNotice: generated.demoNotice });
});

app.patch('/api/pathways/steps/:stepId', requireAuth, (req: AuthedRequest, res) => {
  const { status } = req.body ?? {};
  const valid = new Set(['pending', 'in_progress', 'completed']);
  if (!valid.has(String(status))) {
    res.status(400).json({ error: 'Invalid step status.' });
    return;
  }

  const owned = db.prepare(`
    SELECT ps.id
    FROM pathway_steps ps
    JOIN recognition_pathways rp ON rp.id = ps.pathway_id
    WHERE ps.id = ? AND rp.user_id = ?
  `).get(req.params.stepId, req.user!.id);

  if (!owned) {
    res.status(404).json({ error: 'Pathway step not found.' });
    return;
  }

  db.prepare("UPDATE pathway_steps SET status = ?, updated_at = datetime('now') WHERE id = ?").run(String(status), req.params.stepId);
  const updated = db.prepare('SELECT * FROM pathway_steps WHERE id = ?').get(req.params.stepId);
  res.json({ step: updated });
});

// ==================== OPPORTUNITIES & SAVED OPPORTUNITIES ====================
app.get('/api/opportunities', requireAuth, (req: AuthedRequest, res) => {
  const all = db.prepare('SELECT * FROM opportunities ORDER BY created_at DESC').all();
  const savedRows = db.prepare('SELECT opportunity_id, notes FROM saved_opportunities WHERE user_id = ?').all(req.user!.id) as Array<{ opportunity_id: string; notes: string }>;
  const savedMap = Object.fromEntries(savedRows.map((s) => [s.opportunity_id, s.notes]));
  res.json({ opportunities: all, savedMap });
});

app.post('/api/opportunities/:id/save', requireAuth, (req: AuthedRequest, res) => {
  const opp = db.prepare('SELECT id FROM opportunities WHERE id = ?').get(req.params.id);
  if (!opp) {
    res.status(404).json({ error: 'Opportunity not found.' });
    return;
  }
  const notes = String(req.body?.notes || '').trim();
  db.prepare(`
    INSERT INTO saved_opportunities (id, user_id, opportunity_id, notes)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, opportunity_id) DO UPDATE SET notes = excluded.notes
  `).run(`saved-${crypto.randomUUID()}`, req.user!.id, req.params.id, notes);
  res.json({ ok: true });
});

app.delete('/api/opportunities/:id/save', requireAuth, (req: AuthedRequest, res) => {
  db.prepare('DELETE FROM saved_opportunities WHERE user_id = ? AND opportunity_id = ?').run(req.user!.id, req.params.id);
  res.json({ ok: true });
});

app.post('/api/opportunities/match', requireAuth, async (req: AuthedRequest, res) => {
  const profile = (db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user!.id) as Record<string, unknown>) || {};
  const skills = db.prepare('SELECT * FROM skills WHERE user_id = ?').all(req.user!.id) as Array<Record<string, unknown>>;
  const opportunities = db.prepare('SELECT * FROM opportunities').all() as Array<Record<string, unknown>>;

  const result = await matchOpportunitiesWithAI({ profile, skills, opportunities });
  res.json(result);
});

// ==================== PROFESSIONAL PORTFOLIO ====================
app.get('/api/portfolios', requireAuth, (req: AuthedRequest, res) => {
  const portfolios = db.prepare('SELECT * FROM portfolios WHERE user_id = ? ORDER BY updated_at DESC').all(req.user!.id);
  res.json({ portfolios });
});

app.post('/api/portfolios/generate', requireAuth, requireRole('candidate', 'admin'), async (req: AuthedRequest, res) => {
  const userId = req.user!.id;
  const profile = (db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId) as Record<string, unknown>) || {};
  const qualifications = db.prepare('SELECT * FROM qualifications WHERE user_id = ?').all(userId) as Array<Record<string, unknown>>;
  const experience = db.prepare('SELECT * FROM work_experience WHERE user_id = ?').all(userId) as Array<Record<string, unknown>>;
  const skills = db.prepare('SELECT * FROM skills WHERE user_id = ?').all(userId) as Array<Record<string, unknown>>;
  const documents = db.prepare('SELECT * FROM documents WHERE user_id = ?').all(userId) as Array<Record<string, unknown>>;
  const pathways = db.prepare('SELECT * FROM recognition_pathways WHERE user_id = ?').all(userId) as Array<Record<string, unknown>>;

  const generated = await generatePortfolioWithAI({
    fullName: req.user!.full_name,
    profile,
    qualifications,
    experience,
    skills,
    documents,
    pathways,
  });

  const portfolioId = `port-${crypto.randomUUID()}`;
  db.prepare(`
    INSERT INTO portfolios (id, user_id, title, summary, strengths_json, gaps_json, next_steps_json, included_doc_ids_json, mode)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    portfolioId,
    userId,
    generated.title,
    generated.summary,
    JSON.stringify(generated.strengths),
    JSON.stringify(generated.gaps),
    JSON.stringify(generated.nextSteps),
    JSON.stringify(documents.map((d) => d.id)),
    generated.mode
  );

  createNotification(userId, 'Professional Portfolio Generated', 'Your structured portfolio is ready for preview and PDF export.', 'ai');
  const portfolio = db.prepare('SELECT * FROM portfolios WHERE id = ?').get(portfolioId);
  res.status(201).json({ portfolio, mode: generated.mode, demoNotice: generated.demoNotice });
});

app.put('/api/portfolios/:id', requireAuth, (req: AuthedRequest, res) => {
  const { title, summary, strengths, gaps, nextSteps } = req.body ?? {};
  const existing = db.prepare('SELECT id FROM portfolios WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id);
  if (!existing) {
    res.status(404).json({ error: 'Portfolio not found.' });
    return;
  }

  db.prepare(`
    UPDATE portfolios
    SET title = ?, summary = ?, strengths_json = ?, gaps_json = ?, next_steps_json = ?, updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `).run(
    String(title || '').trim(),
    String(summary || '').trim(),
    JSON.stringify(Array.isArray(strengths) ? strengths : []),
    JSON.stringify(Array.isArray(gaps) ? gaps : []),
    JSON.stringify(Array.isArray(nextSteps) ? nextSteps : []),
    req.params.id,
    req.user!.id
  );

  const updated = db.prepare('SELECT * FROM portfolios WHERE id = ?').get(req.params.id);
  res.json({ portfolio: updated });
});

// ==================== USER SETTINGS, CONSENT & NOTIFICATIONS ====================
app.get('/api/settings/consent', requireAuth, (req: AuthedRequest, res) => {
  const consent = db.prepare('SELECT * FROM user_consents WHERE user_id = ?').get(req.user!.id);
  res.json({
    consent: consent || {
      user_id: req.user!.id,
      share_with_employers: 0,
      share_with_mentors: 0,
      share_documents_summary: 0,
    },
  });
});

app.put('/api/settings/consent', requireAuth, (req: AuthedRequest, res) => {
  const { shareWithEmployers, shareWithMentors, shareDocumentsSummary } = req.body ?? {};
  db.prepare(`
    INSERT INTO user_consents (user_id, share_with_employers, share_with_mentors, share_documents_summary)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      share_with_employers = excluded.share_with_employers,
      share_with_mentors = excluded.share_with_mentors,
      share_documents_summary = excluded.share_documents_summary,
      updated_at = datetime('now')
  `).run(
    req.user!.id,
    shareWithEmployers ? 1 : 0,
    shareWithMentors ? 1 : 0,
    shareDocumentsSummary ? 1 : 0
  );

  const updated = db.prepare('SELECT * FROM user_consents WHERE user_id = ?').get(req.user!.id);
  res.json({ consent: updated });
});

app.delete('/api/settings/account', requireAuth, (req: AuthedRequest, res) => {
  if (req.user!.is_demo) {
    res.status(400).json({ error: 'Shared demonstration accounts cannot be deleted. Register a personal account to test full deletion.' });
    return;
  }
  const docs = db.prepare('SELECT stored_filename FROM documents WHERE user_id = ?').all(req.user!.id) as Array<{ stored_filename: string }>;
  for (const d of docs) {
    const resolved = path.resolve(UPLOAD_DIR, d.stored_filename);
    if (resolved.startsWith(UPLOAD_DIR + path.sep) && fs.existsSync(resolved)) {
      fs.unlinkSync(resolved);
    }
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(req.user!.id);
  res.json({ ok: true });
});

app.get('/api/notifications', requireAuth, (req: AuthedRequest, res) => {
  const rows = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 25').all(req.user!.id);
  res.json({ notifications: rows });
});

app.patch('/api/notifications/:id/read', requireAuth, (req: AuthedRequest, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user!.id);
  res.json({ ok: true });
});

// ==================== EMPLOYER / MENTOR CONSENT-GATED ROUTES ====================
app.get('/api/employer/candidates', requireAuth, requireRole('employer', 'admin'), (_req, res) => {
  const rows = db.prepare(`
    SELECT u.id, u.full_name, u.is_demo, p.headline, p.current_location, p.target_sector, p.years_experience,
           p.completeness_score, c.share_with_employers, c.share_with_mentors, c.share_documents_summary
    FROM users u
    JOIN profiles p ON p.user_id = u.id
    JOIN user_consents c ON c.user_id = u.id
    WHERE u.role = 'candidate' AND (c.share_with_employers = 1 OR c.share_with_mentors = 1)
    ORDER BY p.updated_at DESC
  `).all();
  res.json({ candidates: rows });
});

app.get('/api/employer/candidates/:id', requireAuth, requireRole('employer', 'admin'), (req, res) => {
  const candidateId = req.params.id;
  const consent = db.prepare('SELECT * FROM user_consents WHERE user_id = ?').get(candidateId) as {
    share_with_employers: number;
    share_with_mentors: number;
    share_documents_summary: number;
  } | undefined;

  if (!consent || (!consent.share_with_employers && !consent.share_with_mentors)) {
    res.status(403).json({ error: 'This candidate has not consented to share their portfolio.' });
    return;
  }

  const candidate = db.prepare('SELECT id, full_name, is_demo FROM users WHERE id = ? AND role = ?').get(candidateId, 'candidate');
  const profile = db.prepare('SELECT headline, bio, current_location, years_experience, target_sector, career_goals, languages_json FROM profiles WHERE user_id = ?').get(candidateId);
  const skills = db.prepare('SELECT id, name, category, proficiency, source FROM skills WHERE user_id = ?').all(candidateId);
  const qualifications = db.prepare('SELECT id, title, institution, year_obtained, level, status FROM qualifications WHERE user_id = ?').all(candidateId);
  const experience = db.prepare('SELECT id, job_title, organization, start_year, end_year, description FROM work_experience WHERE user_id = ?').all(candidateId);
  const portfolio = db.prepare('SELECT id, title, summary, strengths_json, gaps_json, next_steps_json, mode, updated_at FROM portfolios WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1').get(candidateId);
  const documentSummaries = consent.share_documents_summary
    ? db.prepare('SELECT id, original_name, category, status, extracted_summary FROM documents WHERE user_id = ?').all(candidateId)
    : [];

  res.json({
    candidate,
    profile,
    skills,
    qualifications,
    experience,
    portfolio: portfolio || null,
    documentSummaries,
  });
});

// ==================== ADMIN ROUTES ====================
app.get('/api/admin/overview', requireAuth, requireRole('admin'), (_req, res) => {
  const counts = {
    users: (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c,
    candidates: (db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'candidate'").get() as { c: number }).c,
    employers: (db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'employer'").get() as { c: number }).c,
    documents: (db.prepare('SELECT COUNT(*) as c FROM documents').get() as { c: number }).c,
    assessments: (db.prepare('SELECT COUNT(*) as c FROM assessments').get() as { c: number }).c,
    pathways: (db.prepare('SELECT COUNT(*) as c FROM recognition_pathways').get() as { c: number }).c,
    opportunities: (db.prepare('SELECT COUNT(*) as c FROM opportunities').get() as { c: number }).c,
    portfolios: (db.prepare('SELECT COUNT(*) as c FROM portfolios').get() as { c: number }).c,
  };
  const settings = db.prepare('SELECT * FROM app_settings').all();
  const opportunities = db.prepare('SELECT * FROM opportunities ORDER BY created_at DESC').all();
  res.json({ counts, settings, opportunities, aiConfigured: isGeminiConfigured() });
});

app.post('/api/admin/opportunities', requireAuth, requireRole('admin'), (req, res) => {
  const { title, organization, category, location, workMode, requiredSkills, description, matchGuidance } = req.body ?? {};
  if (!String(title || '').trim() || !String(organization || '').trim()) {
    res.status(400).json({ error: 'Title and organization are required.' });
    return;
  }
  const validCats = new Set(['job', 'mentorship', 'training', 'fellowship', 'returnship', 'development']);
  const cat = validCats.has(String(category)) ? String(category) : 'job';
  const id = `opp-${crypto.randomUUID()}`;
  const skillsArr = Array.isArray(requiredSkills)
    ? requiredSkills.map((s) => String(s).trim()).filter(Boolean)
    : String(requiredSkills || '').split(',').map((s) => s.trim()).filter(Boolean);

  db.prepare(`
    INSERT INTO opportunities (id, title, organization, category, location, work_mode, required_skills_json, description, match_guidance, is_demo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(
    id,
    String(title).trim(),
    String(organization).trim(),
    cat,
    String(location || 'Nairobi, Kenya').trim(),
    String(workMode || 'Hybrid').trim(),
    JSON.stringify(skillsArr),
    String(description || '').trim(),
    String(matchGuidance || '').trim()
  );

  const created = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(id);
  res.status(201).json({ opportunity: created });
});

app.delete('/api/admin/opportunities/:id', requireAuth, requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM opportunities WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.put('/api/admin/settings', requireAuth, requireRole('admin'), (req, res) => {
  const { demoModeBanner, platformNotice } = req.body ?? {};
  if (demoModeBanner !== undefined) {
    db.prepare("INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('demo_mode_banner', ?, datetime('now'))").run(String(demoModeBanner));
  }
  if (platformNotice !== undefined) {
    db.prepare("INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('platform_notice', ?, datetime('now'))").run(String(platformNotice));
  }
  const settings = db.prepare('SELECT * FROM app_settings').all();
  res.json({ settings });
});

// ==================== FRONTEND SERVING ====================
async function startServer(): Promise<void> {
  const port = Number(process.env.PORT || 3000);
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: { server: httpServer },
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`TalentPath AI server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
