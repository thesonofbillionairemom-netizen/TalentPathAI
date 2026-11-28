import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const MODEL_NAME = 'gemini-4-hydrogen';

function getClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export function isGeminiConfigured(): boolean {
  return getClient() !== null;
}

const RESPONSIBLE_AI_SYSTEM = `You are TalentPath AI, an ethical career and qualification-recognition preparation assistant focused on helping displaced professionals and refugees in Kenya.
CRITICAL RULES:
1. Never claim you have officially verified any document, degree, or legal work eligibility.
2. Never provide definitive legal advice or guarantee employment or qualification recognition.
3. Always distinguish between facts directly observed in user-provided documents/profile and AI-suggested transferable skills or next steps.
4. Keep guidance practical, respectful, concise, and grounded in Kenya's recognition ecosystem (KNQA Recognition of Prior Learning, TVETA, NITA, KNEC, UNESCO Qualifications Passport, DRS).`;

// A. Profile Analysis
export async function analyzeProfileWithAI(input: {
  profile: Record<string, unknown>;
  qualifications: Array<Record<string, unknown>>;
  experience: Array<Record<string, unknown>>;
}): Promise<{
  mode: 'gemini' | 'demo';
  demoNotice?: string;
  professionalSummary: string;
  coreSkills: string[];
  transferableSkills: string[];
  careerDirections: string[];
}> {
  const client = getClient();
  if (!client) {
    return buildDemoProfileAnalysis(input);
  }

  try {
    const response = await client.models.generateContent({
      model: MODEL_NAME,
      contents: `Analyze this displaced professional's profile, qualifications, and work experience:\n${JSON.stringify(input)}`,
      config: {
        systemInstruction: RESPONSIBLE_AI_SYSTEM,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            professionalSummary: { type: Type.STRING },
            coreSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            transferableSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            careerDirections: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['professionalSummary', 'coreSkills', 'transferableSkills', 'careerDirections'],
        },
      },
    });
    const parsed = JSON.parse((response.text ?? '{}').trim());
    return {
      mode: 'gemini',
      professionalSummary: String(parsed.professionalSummary || ''),
      coreSkills: Array.isArray(parsed.coreSkills) ? parsed.coreSkills.map(String) : [],
      transferableSkills: Array.isArray(parsed.transferableSkills) ? parsed.transferableSkills.map(String) : [],
      careerDirections: Array.isArray(parsed.careerDirections) ? parsed.careerDirections.map(String) : [],
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Gemini request failed';
    return buildDemoProfileAnalysis(input, `Live Gemini API unavailable (${msg}). Showing clearly labeled Demo Mode output.`);
  }
}

function buildDemoProfileAnalysis(
  input: { profile: Record<string, unknown>; qualifications: Array<Record<string, unknown>>; experience: Array<Record<string, unknown>> },
  demoNotice = 'GEMINI_API_KEY is not configured. Running in transparent Demo Mode (no live AI model call occurred).'
) {
  const sector = String(input.profile.target_sector || 'Technical & Professional Services');
  const expCount = input.experience.length;
  const qualCount = input.qualifications.length;
  return {
    mode: 'demo' as const,
    demoNotice,
    professionalSummary: `DEMO MODE SUMMARY: Professional targeting ${sector} with ${expCount} recorded work role(s) and ${qualCount} academic/training record(s). Ready to map applied competencies toward Kenyan Recognition of Prior Learning (RPL) or bridging opportunities.`,
    coreSkills: ['Technical Execution', 'Project Documentation', 'Quality & Safety Compliance'],
    transferableSkills: ['Cross-Cultural Team Coordination', 'Problem Solving in Resource-Constrained Environments', 'Structured Reporting'],
    careerDirections: [`${sector} Specialist (RPL Track)`, 'Project & Operations Coordinator', 'Technical Mentor / Community Trainer'],
  };
}

// B. Document Analysis
export async function analyzeDocumentWithAI(input: {
  originalName: string;
  category: string;
  mimeType: string;
  fileBuffer: Buffer | null;
}): Promise<{
  mode: 'gemini' | 'demo';
  demoNotice?: string;
  documentType: string;
  extractedSummary: string;
  extractedSkills: string[];
  evidenceGaps: string[];
  confidenceNote: string;
}> {
  const client = getClient();
  if (!client || !input.fileBuffer) {
    return buildDemoDocumentAnalysis(input);
  }

  try {
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
    const supportedInline = ['application/pdf', 'image/png', 'image/jpeg', 'text/plain'];
    if (supportedInline.includes(input.mimeType)) {
      if (input.mimeType === 'text/plain') {
        parts.push({ text: `Document filename: ${input.originalName}\nDeclared category: ${input.category}\nContent:\n${input.fileBuffer.toString('utf8').slice(0, 15000)}` });
      } else {
        parts.push({
          inlineData: {
            mimeType: input.mimeType,
            data: input.fileBuffer.toString('base64'),
          },
        });
        parts.push({ text: `Extract relevant qualification, work, and skills details from this uploaded document (${input.originalName}, category: ${input.category}). Do not claim official verification.` });
      }
    } else {
      parts.push({ text: `Document metadata: filename=${input.originalName}, mime=${input.mimeType}, category=${input.category}. Binary format cannot be parsed directly; provide cautious guidance on what supporting evidence is typically needed for this category.` });
    }

    const response = await client.models.generateContent({
      model: MODEL_NAME,
      contents: { parts },
      config: {
        systemInstruction: RESPONSIBLE_AI_SYSTEM,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            documentType: { type: Type.STRING },
            extractedSummary: { type: Type.STRING },
            extractedSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            evidenceGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
            confidenceNote: { type: Type.STRING },
          },
          required: ['documentType', 'extractedSummary', 'extractedSkills', 'evidenceGaps', 'confidenceNote'],
        },
      },
    });
    const parsed = JSON.parse((response.text ?? '{}').trim());
    return {
      mode: 'gemini',
      documentType: String(parsed.documentType || input.category),
      extractedSummary: String(parsed.extractedSummary || ''),
      extractedSkills: Array.isArray(parsed.extractedSkills) ? parsed.extractedSkills.map(String) : [],
      evidenceGaps: Array.isArray(parsed.evidenceGaps) ? parsed.evidenceGaps.map(String) : [],
      confidenceNote: String(parsed.confidenceNote || 'AI-extracted summary; human/institutional verification still required.'),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Gemini request failed';
    return buildDemoDocumentAnalysis(input, `Live Gemini API unavailable (${msg}). Showing Demo Mode extraction.`);
  }
}

function buildDemoDocumentAnalysis(
  input: { originalName: string; category: string; mimeType: string; fileBuffer: Buffer | null },
  demoNotice = 'GEMINI_API_KEY is not configured. Running in transparent Demo Mode.'
) {
  let snippet = '';
  if (input.fileBuffer && input.mimeType === 'text/plain') {
    snippet = input.fileBuffer.toString('utf8').slice(0, 220).replace(/\s+/g, ' ').trim();
  }
  return {
    mode: 'demo' as const,
    demoNotice,
    documentType: input.category.replace(/_/g, ' '),
    extractedSummary: snippet
      ? `DEMO EXTRACTION (${input.originalName}): ${snippet}`
      : `DEMO EXTRACTION: Stored "${input.originalName}" under category "${input.category.replace(/_/g, ' ')}". Upload a readable PDF/image with live Gemini API configured for automated text extraction.`,
    extractedSkills: ['Documented Domain Experience', 'Structured Record Keeping'],
    evidenceGaps: ['Requires corroborating official institutional seal or supervisor contact verification where applicable'],
    confidenceNote: 'DEMO MODE: Simulated metadata summary. Not an official qualification verification.',
  };
}

// C. Comprehensive Skills Assessment
export async function runSkillsAssessmentWithAI(input: {
  profile: Record<string, unknown>;
  qualifications: Array<Record<string, unknown>>;
  experience: Array<Record<string, unknown>>;
  skills: Array<Record<string, unknown>>;
  documents: Array<Record<string, unknown>>;
  baselineEvidenceScore: number;
  missingDocCategories: string[];
}): Promise<{
  mode: 'gemini' | 'demo';
  demoNotice?: string;
  summary: string;
  evidenceStrengthScore: number;
  careerDirections: string[];
  results: Array<{
    resultType: 'strength' | 'transferable_skill' | 'missing_evidence' | 'recommended_step';
    title: string;
    detail: string;
    rationale: string;
    priority: 'high' | 'medium' | 'low';
    sourceBadge: 'extracted' | 'ai_suggested';
  }>;
}> {
  const client = getClient();
  if (!client) {
    return buildDemoSkillsAssessment(input);
  }

  try {
    const response = await client.models.generateContent({
      model: MODEL_NAME,
      contents: `Conduct a comprehensive skills and evidence-gap assessment for this professional in Kenya.\nBaseline evidence completeness score: ${input.baselineEvidenceScore}/100.\nMissing document categories: ${input.missingDocCategories.join(', ') || 'None'}.\nData:\n${JSON.stringify({
        profile: input.profile,
        qualifications: input.qualifications,
        experience: input.experience,
        skills: input.skills,
        documents: input.documents.map((d) => ({ name: d.original_name, category: d.category, summary: d.extracted_summary })),
      })}`,
      config: {
        systemInstruction: RESPONSIBLE_AI_SYSTEM,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            evidenceStrengthScore: { type: Type.INTEGER },
            careerDirections: { type: Type.ARRAY, items: { type: Type.STRING } },
            results: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  resultType: { type: Type.STRING },
                  title: { type: Type.STRING },
                  detail: { type: Type.STRING },
                  rationale: { type: Type.STRING },
                  priority: { type: Type.STRING },
                  sourceBadge: { type: Type.STRING },
                },
                required: ['resultType', 'title', 'detail', 'rationale', 'priority', 'sourceBadge'],
              },
            },
          },
          required: ['summary', 'evidenceStrengthScore', 'careerDirections', 'results'],
        },
      },
    });
    const parsed = JSON.parse((response.text ?? '{}').trim());
    const validTypes = new Set(['strength', 'transferable_skill', 'missing_evidence', 'recommended_step']);
    const validPrio = new Set(['high', 'medium', 'low']);
    const results = (Array.isArray(parsed.results) ? parsed.results : []).map((r: Record<string, unknown>) => ({
      resultType: (validTypes.has(String(r.resultType)) ? String(r.resultType) : 'recommended_step') as 'strength' | 'transferable_skill' | 'missing_evidence' | 'recommended_step',
      title: String(r.title || 'Assessment Finding'),
      detail: String(r.detail || ''),
      rationale: String(r.rationale || ''),
      priority: (validPrio.has(String(r.priority)) ? String(r.priority) : 'medium') as 'high' | 'medium' | 'low',
      sourceBadge: (String(r.sourceBadge) === 'extracted' ? 'extracted' : 'ai_suggested') as 'extracted' | 'ai_suggested',
    }));

    return {
      mode: 'gemini',
      summary: String(parsed.summary || ''),
      evidenceStrengthScore: Math.max(0, Math.min(100, Number(parsed.evidenceStrengthScore ?? input.baselineEvidenceScore))),
      careerDirections: Array.isArray(parsed.careerDirections) ? parsed.careerDirections.map(String) : [],
      results,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Gemini request failed';
    return buildDemoSkillsAssessment(input, `Live Gemini API unavailable (${msg}). Running in Demo Mode.`);
  }
}

function buildDemoSkillsAssessment(
  input: {
    profile: Record<string, unknown>;
    qualifications: Array<Record<string, unknown>>;
    experience: Array<Record<string, unknown>>;
    skills: Array<Record<string, unknown>>;
    documents: Array<Record<string, unknown>>;
    baselineEvidenceScore: number;
    missingDocCategories: string[];
  },
  demoNotice = 'GEMINI_API_KEY is not configured. Showing clearly labeled Demo Mode assessment.'
) {
  const sector = String(input.profile.target_sector || 'Applied Technical & Professional Work');
  const results: Array<{
    resultType: 'strength' | 'transferable_skill' | 'missing_evidence' | 'recommended_step';
    title: string;
    detail: string;
    rationale: string;
    priority: 'high' | 'medium' | 'low';
    sourceBadge: 'extracted' | 'ai_suggested';
  }> = [
    {
      resultType: 'strength',
      title: `${sector} Practical Foundation`,
      detail: `Profile reflects ${input.experience.length} work role(s), ${input.qualifications.length} qualification(s), and ${input.documents.length} uploaded evidence file(s).`,
      rationale: 'Calculated from your saved profile records and uploaded evidence categories.',
      priority: 'high',
      sourceBadge: input.documents.length > 0 ? 'extracted' : 'ai_suggested',
    },
    {
      resultType: 'transferable_skill',
      title: 'Adaptability & Cross-Border Operational Coordination',
      detail: 'Experience operating across diverse standards, teams, and languages transfers directly to Kenyan NGOs, SMEs, and technical teams.',
      rationale: 'AI-suggested transferable competency based on displacement and multi-context experience.',
      priority: 'medium',
      sourceBadge: 'ai_suggested',
    },
  ];

  if (input.missingDocCategories.length > 0) {
    results.push({
      resultType: 'missing_evidence',
      title: `Missing Supporting Categories: ${input.missingDocCategories.map((c) => c.replace(/_/g, ' ')).join(', ')}`,
      detail: 'Uploading corroborating documents or requesting written references strengthens your readiness for KNQA RPL or employer screening.',
      rationale: 'Evidence strength drops when core categories (CV, academic record, reference letter, employment proof) are absent.',
      priority: 'high',
      sourceBadge: 'ai_suggested',
    });
  }

  results.push({
    resultType: 'recommended_step',
    title: 'Prepare a KNQA Recognition of Prior Learning (RPL) Dossier',
    detail: 'Use the Recognition Navigator to map your work samples and references to an accredited Kenyan occupational standard.',
    rationale: 'RPL enables formal skill recognition in Kenya even when original foreign certificates were lost during displacement.',
    priority: 'high',
    sourceBadge: 'ai_suggested',
  });

  return {
    mode: 'demo' as const,
    demoNotice,
    summary: `DEMO ASSESSMENT: Calculated evidence strength at ${input.baselineEvidenceScore}/100 for ${sector}. Review missing evidence items and follow the Kenyan RPL preparation checklist below.`,
    evidenceStrengthScore: input.baselineEvidenceScore,
    careerDirections: [sector, `${sector} — Apprenticeship / Returnship`, 'Community Technical Coordinator'],
    results,
  };
}

// D. Recognition Preparation Pathway
export async function generateRecognitionPathwayWithAI(input: {
  targetOccupation: string;
  pathwayType: 'rpl' | 'foreign_qualification' | 'competency' | 'bridging' | 'licensing';
  profile: Record<string, unknown>;
  qualifications: Array<Record<string, unknown>>;
}): Promise<{
  mode: 'gemini' | 'demo';
  demoNotice?: string;
  institutionName: string;
  officialUrl: string;
  summary: string;
  steps: Array<{
    title: string;
    actionRequired: string;
    requiredDocuments: string;
    authorityName: string;
    officialUrl: string;
  }>;
}> {
  const client = getClient();
  if (!client) {
    return buildDemoRecognitionPathway(input);
  }

  try {
    const response = await client.models.generateContent({
      model: MODEL_NAME,
      contents: `Create a practical Kenyan qualification-recognition preparation pathway for occupation "${input.targetOccupation}" (pathway type: ${input.pathwayType}).
Only cite real Kenyan or international official portals such as:
- KNQA: https://knqa.go.ke and https://app.rpl.knqa.go.ke
- TVETA: https://www.tveta.go.ke
- NITA: https://www.nita.go.ke
- KNEC: https://www.knec.ac.ke
- DRS Kenya: https://www.refugees.go.ke
- UNESCO Qualifications Passport: https://www.unesco.org/en/higher-education/qualifications-passport
- Engineers Board of Kenya (if engineering): https://ebk.or.ke
Profile summary: ${JSON.stringify({ qualifications: input.qualifications, location: input.profile.current_location, sector: input.profile.target_sector })}`,
      config: {
        systemInstruction: RESPONSIBLE_AI_SYSTEM,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            institutionName: { type: Type.STRING },
            officialUrl: { type: Type.STRING },
            summary: { type: Type.STRING },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  actionRequired: { type: Type.STRING },
                  requiredDocuments: { type: Type.STRING },
                  authorityName: { type: Type.STRING },
                  officialUrl: { type: Type.STRING },
                },
                required: ['title', 'actionRequired', 'requiredDocuments', 'authorityName', 'officialUrl'],
              },
            },
          },
          required: ['institutionName', 'officialUrl', 'summary', 'steps'],
        },
      },
    });
    const parsed = JSON.parse((response.text ?? '{}').trim());
    return {
      mode: 'gemini',
      institutionName: String(parsed.institutionName || 'Kenya National Qualifications Authority (KNQA)'),
      officialUrl: String(parsed.officialUrl || 'https://knqa.go.ke'),
      summary: String(parsed.summary || ''),
      steps: Array.isArray(parsed.steps)
        ? parsed.steps.map((s: Record<string, unknown>) => ({
            title: String(s.title || 'Preparation Step'),
            actionRequired: String(s.actionRequired || ''),
            requiredDocuments: String(s.requiredDocuments || ''),
            authorityName: String(s.authorityName || 'KNQA'),
            officialUrl: String(s.officialUrl || 'https://knqa.go.ke'),
          }))
        : [],
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Gemini request failed';
    return buildDemoRecognitionPathway(input, `Live Gemini API unavailable (${msg}). Using Demo Mode pathway template.`);
  }
}

function buildDemoRecognitionPathway(
  input: { targetOccupation: string; pathwayType: string },
  demoNotice = 'GEMINI_API_KEY is not configured. Generating structured Demo Mode pathway using official Kenyan resources.'
) {
  return {
    mode: 'demo' as const,
    demoNotice,
    institutionName: 'Kenya National Qualifications Authority (KNQA)',
    officialUrl: 'https://knqa.go.ke',
    summary: `DEMO PATHWAY: Preparation checklist for ${input.targetOccupation} via ${input.pathwayType.toUpperCase()} in Kenya. TalentPath AI does not issue official certifications; submit applications directly to the listed Kenyan authorities.`,
    steps: [
      {
        title: 'Verify Refugee Identity & Legal Documentation',
        actionRequired: 'Ensure your Department of Refugee Services (DRS) Refugee ID or valid pass is current before booking formal assessments.',
        requiredDocuments: 'DRS Refugee ID / Asylum Seeker Pass',
        authorityName: 'Department of Refugee Services (DRS)',
        officialUrl: 'https://www.refugees.go.ke',
      },
      {
        title: 'Assemble Portfolio of Evidence (POE)',
        actionRequired: `Collect work samples, reference letters, photos/blueprints of past projects, and training certificates related to ${input.targetOccupation}.`,
        requiredDocuments: 'Portfolio of Evidence, Supervisor Reference Letters, CV',
        authorityName: 'KNQA RPL Portal',
        officialUrl: 'https://app.rpl.knqa.go.ke',
      },
      {
        title: 'Check UNESCO Qualifications Passport Eligibility',
        actionRequired: 'If academic certificates were lost during displacement, check UQP assessment windows in Kenya.',
        requiredDocuments: 'Identity Document & Structured Education Interview Form',
        authorityName: 'UNESCO Qualifications Passport',
        officialUrl: 'https://www.unesco.org/en/higher-education/qualifications-passport',
      },
      {
        title: 'Book Competency Assessment with Accredited Centre',
        actionRequired: 'Register for practical skills verification or equation of foreign qualifications via TVETA / NITA / KNQA.',
        requiredDocuments: 'RPL Application Form, Evidence Portfolio, Assessment Fee Guidance',
        authorityName: 'TVETA Kenya',
        officialUrl: 'https://www.tveta.go.ke',
      },
    ],
  };
}

// E. Opportunity Matching
export async function matchOpportunitiesWithAI(input: {
  profile: Record<string, unknown>;
  skills: Array<Record<string, unknown>>;
  opportunities: Array<Record<string, unknown>>;
}): Promise<{
  mode: 'gemini' | 'demo';
  demoNotice?: string;
  matches: Array<{
    opportunityId: string;
    matchScore: number;
    reason: string;
    skillsGaps: string[];
    suggestedImprovement: string;
  }>;
}> {
  const client = getClient();
  if (!client) {
    return buildDemoOpportunityMatches(input);
  }

  try {
    const response = await client.models.generateContent({
      model: MODEL_NAME,
      contents: `Match this candidate's profile and skills to these sample opportunities. Explain why each matches and note any skills gaps.\nCandidate: ${JSON.stringify({
        sector: input.profile.target_sector,
        goals: input.profile.career_goals,
        skills: input.skills.map((s) => s.name),
      })}\nOpportunities: ${JSON.stringify(
        input.opportunities.map((o) => ({ id: o.id, title: o.title, category: o.category, required_skills: o.required_skills_json }))
      )}`,
      config: {
        systemInstruction: RESPONSIBLE_AI_SYSTEM,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matches: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  opportunityId: { type: Type.STRING },
                  matchScore: { type: Type.INTEGER },
                  reason: { type: Type.STRING },
                  skillsGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
                  suggestedImprovement: { type: Type.STRING },
                },
                required: ['opportunityId', 'matchScore', 'reason', 'skillsGaps', 'suggestedImprovement'],
              },
            },
          },
          required: ['matches'],
        },
      },
    });
    const parsed = JSON.parse((response.text ?? '{}').trim());
    return {
      mode: 'gemini',
      matches: Array.isArray(parsed.matches)
        ? parsed.matches.map((m: Record<string, unknown>) => ({
            opportunityId: String(m.opportunityId),
            matchScore: Math.max(0, Math.min(100, Number(m.matchScore ?? 50))),
            reason: String(m.reason || ''),
            skillsGaps: Array.isArray(m.skillsGaps) ? m.skillsGaps.map(String) : [],
            suggestedImprovement: String(m.suggestedImprovement || ''),
          }))
        : [],
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Gemini request failed';
    return buildDemoOpportunityMatches(input, `Live Gemini API unavailable (${msg}). Using keyword-based Demo Mode matching.`);
  }
}

function buildDemoOpportunityMatches(
  input: { skills: Array<Record<string, unknown>>; opportunities: Array<Record<string, unknown>> },
  demoNotice = 'GEMINI_API_KEY is not configured. Using transparent Demo Mode skill-overlap matching.'
) {
  const userSkillNames = input.skills.map((s) => String(s.name).toLowerCase());
  const matches = input.opportunities.map((opp) => {
    const req = JSON.parse(String(opp.required_skills_json || '[]')) as string[];
    const overlapping = req.filter((r) => userSkillNames.some((u) => u.includes(r.toLowerCase()) || r.toLowerCase().includes(u)));
    const gaps = req.filter((r) => !overlapping.includes(r));
    const score = req.length === 0 ? 60 : Math.min(96, Math.round(45 + (overlapping.length / req.length) * 50));
    return {
      opportunityId: String(opp.id),
      matchScore: score,
      reason:
        overlapping.length > 0
          ? `DEMO MATCH: Overlaps with your recorded skills (${overlapping.join(', ')}).`
          : `DEMO MATCH: General transferable alignment for career readiness in Kenya.`,
      skillsGaps: gaps,
      suggestedImprovement:
        gaps.length > 0
          ? `Add evidence or training notes demonstrating ${gaps[0]}.`
          : 'Attach supporting project samples to strengthen your application.',
    };
  });
  return { mode: 'demo' as const, demoNotice, matches };
}

// F. Portfolio Generation
export async function generatePortfolioWithAI(input: {
  fullName: string;
  profile: Record<string, unknown>;
  qualifications: Array<Record<string, unknown>>;
  experience: Array<Record<string, unknown>>;
  skills: Array<Record<string, unknown>>;
  documents: Array<Record<string, unknown>>;
  pathways: Array<Record<string, unknown>>;
}): Promise<{
  mode: 'gemini' | 'demo';
  demoNotice?: string;
  title: string;
  summary: string;
  strengths: string[];
  gaps: string[];
  nextSteps: string[];
}> {
  const client = getClient();
  if (!client) {
    return buildDemoPortfolio(input);
  }

  try {
    const response = await client.models.generateContent({
      model: MODEL_NAME,
      contents: `Generate a structured, employer-ready professional portfolio summary for ${input.fullName} based ONLY on confirmed profile records and uploaded evidence metadata:\n${JSON.stringify({
        headline: input.profile.headline,
        bio: input.profile.bio,
        location: input.profile.current_location,
        goals: input.profile.career_goals,
        qualifications: input.qualifications,
        experience: input.experience,
        skills: input.skills,
        documents: input.documents.map((d) => ({ name: d.original_name, category: d.category })),
        pathways: input.pathways.map((p) => ({ occupation: p.target_occupation, institution: p.institution_name })),
      })}`,
      config: {
        systemInstruction: RESPONSIBLE_AI_SYSTEM,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            gaps: { type: Type.ARRAY, items: { type: Type.STRING } },
            nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['title', 'summary', 'strengths', 'gaps', 'nextSteps'],
        },
      },
    });
    const parsed = JSON.parse((response.text ?? '{}').trim());
    return {
      mode: 'gemini',
      title: String(parsed.title || `${input.fullName} — Professional Portfolio`),
      summary: String(parsed.summary || ''),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
      gaps: Array.isArray(parsed.gaps) ? parsed.gaps.map(String) : [],
      nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps.map(String) : [],
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Gemini request failed';
    return buildDemoPortfolio(input, `Live Gemini API unavailable (${msg}). Generated in Demo Mode.`);
  }
}

function buildDemoPortfolio(
  input: {
    fullName: string;
    profile: Record<string, unknown>;
    qualifications: Array<Record<string, unknown>>;
    experience: Array<Record<string, unknown>>;
    skills: Array<Record<string, unknown>>;
    documents: Array<Record<string, unknown>>;
  },
  demoNotice = 'GEMINI_API_KEY is not configured. Portfolio structured in transparent Demo Mode.'
) {
  const headline = String(input.profile.headline || 'Skilled Professional');
  const location = String(input.profile.current_location || 'Kenya');
  return {
    mode: 'demo' as const,
    demoNotice,
    title: `${input.fullName} — ${headline}`,
    summary: `DEMO PORTFOLIO SUMMARY: ${input.fullName} is a ${headline} based in ${location} with ${input.experience.length} documented role(s), ${input.qualifications.length} education record(s), and ${input.documents.length} uploaded supporting file(s). This portfolio organizes user-provided history and evidence for Kenyan recognition and employer review.`,
    strengths: input.skills.slice(0, 4).map((s) => `${String(s.name)} (${String(s.proficiency)})`),
    gaps:
      input.documents.length < 3
        ? ['Additional corroborating evidence (reference letters or certified transcripts) recommended to strengthen verification readiness.']
        : ['Formal institutional accreditation (e.g., KNQA RPL certificate) pending official submission.'],
    nextSteps: [
      'Review and verify every line of this portfolio before sharing with employers.',
      'Submit supporting Portfolio of Evidence through the KNQA RPL portal or TVETA assessment centre.',
      'Enable Employer Sharing Consent in Settings only when ready to be discovered.',
    ],
  };
}

// G. Micro-Learning & Local Kenyan Training Recommendations from Progress Chart Skill Gaps
export interface GapInputItem {
  skillName: string;
  currentLevel: number;
  targetLevel: number;
  gapAmount: number;
  kenyaContext?: string;
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

export async function generateMicroLearningRecommendationsWithAI(input: {
  sectorName: string;
  location: string;
  focusSkill?: string;
  gaps: GapInputItem[];
  currentSkills: Array<{ name: string; category: string; proficiency: string }>;
}): Promise<{
  mode: 'gemini' | 'demo';
  demoNotice?: string;
  summary: string;
  microLearningModules: MicroLearningModule[];
  localTrainingResources: LocalTrainingResource[];
}> {
  const client = getClient();
  if (!client) {
    return buildDemoMicroLearningRecommendations(input);
  }

  try {
    const response = await client.models.generateContent({
      model: MODEL_NAME,
      contents: `A displaced professional in "${input.location || 'Kenya'}" is targeting the "${input.sectorName}" sector.
Based on their Skills vs. Target Sector progress chart, here are the identified skill gaps (and any selected focus skill: "${input.focusSkill || 'All top gaps'}"):
${JSON.stringify(input.gaps)}
Current documented skills: ${JSON.stringify(input.currentSkills)}

Provide:
1) 3 practical, bite-sized micro-learning modules (30 mins to 3 hours each) the learner can complete independently to build evidence and close the exact gaps above.
2) 3 specific Kenyan or East African training/recognition resources tailored to their location and sector.
CRITICAL: Only use real verified URLs from this allowlist:
- https://www.nita.go.ke (NITA Trade Testing & Industrial Training Centres in Nairobi, Mombasa, Kisumu, Nakuru, Athi River)
- https://www.tveta.go.ke (TVETA Accredited Technical & Vocational Centres across Kenya)
- https://app.rpl.knqa.go.ke (KNQA Recognition of Prior Learning Application Portal)
- https://knqa.go.ke (Kenya National Qualifications Authority)
- https://www.unesco.org/en/higher-education/qualifications-passport (UNESCO Qualifications Passport in Kenya)
- https://ajiradigital.go.ke (Ajira Digital Kenya free digital & online work skills centres)
- https://ebk.or.ke (Engineers Board of Kenya — engineering logbooks & registration)
- https://www.knec.ac.ke (Kenya National Examinations Council)
- https://www.ilo.org (ILO East Africa skills & livelihood initiatives)`,
      config: {
        systemInstruction: RESPONSIBLE_AI_SYSTEM,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            microLearningModules: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  targetSkill: { type: Type.STRING },
                  estimatedDuration: { type: Type.STRING },
                  format: { type: Type.STRING },
                  actionSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
                  outcomeArtifact: { type: Type.STRING },
                },
                required: ['title', 'targetSkill', 'estimatedDuration', 'format', 'actionSteps', 'outcomeArtifact'],
              },
            },
            localTrainingResources: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  provider: { type: Type.STRING },
                  location: { type: Type.STRING },
                  costNote: { type: Type.STRING },
                  officialUrl: { type: Type.STRING },
                  relevantGap: { type: Type.STRING },
                  whyItHelps: { type: Type.STRING },
                },
                required: ['name', 'provider', 'location', 'costNote', 'officialUrl', 'relevantGap', 'whyItHelps'],
              },
            },
          },
          required: ['summary', 'microLearningModules', 'localTrainingResources'],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    const allowedHosts = new Set([
      'www.nita.go.ke',
      'nita.go.ke',
      'www.tveta.go.ke',
      'tveta.go.ke',
      'app.rpl.knqa.go.ke',
      'knqa.go.ke',
      'www.unesco.org',
      'ajiradigital.go.ke',
      'ebk.or.ke',
      'www.knec.ac.ke',
      'www.ilo.org',
    ]);

    const sanitizeUrl = (raw: unknown): string => {
      try {
        const u = new URL(String(raw || ''));
        if (u.protocol === 'https:' && allowedHosts.has(u.hostname)) {
          return u.toString();
        }
      } catch {
        // fallback below
      }
      return 'https://www.tveta.go.ke';
    };

    const modules: MicroLearningModule[] = (Array.isArray(parsed.microLearningModules)
      ? parsed.microLearningModules
      : []
    )
      .slice(0, 3)
      .map((m: Record<string, unknown>, idx: number) => ({
        id: `ml-${idx + 1}`,
        title: String(m.title || 'Focused Competency Sprint'),
        targetSkill: String(m.targetSkill || input.focusSkill || input.sectorName),
        estimatedDuration: String(m.estimatedDuration || '60 mins'),
        format: String(m.format || 'Applied Practice'),
        actionSteps: Array.isArray(m.actionSteps) ? m.actionSteps.slice(0, 4).map(String) : [],
        outcomeArtifact: String(m.outcomeArtifact || 'Portfolio-ready evidence sample'),
      }));

    const resources: LocalTrainingResource[] = (Array.isArray(parsed.localTrainingResources)
      ? parsed.localTrainingResources
      : []
    )
      .slice(0, 3)
      .map((r: Record<string, unknown>, idx: number) => ({
        id: `tr-${idx + 1}`,
        name: String(r.name || 'Kenyan Accredited Training Pathway'),
        provider: String(r.provider || 'TVETA / NITA Kenya'),
        location: String(r.location || input.location || 'Kenya & Online'),
        costNote: String(r.costNote || 'Check provider portal for current fee or NGO sponsorship'),
        officialUrl: sanitizeUrl(r.officialUrl),
        relevantGap: String(r.relevantGap || input.focusSkill || input.sectorName),
        whyItHelps: String(r.whyItHelps || ''),
      }));

    return {
      mode: 'gemini',
      summary: String(parsed.summary || ''),
      microLearningModules: modules,
      localTrainingResources: resources,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Gemini request failed';
    return buildDemoMicroLearningRecommendations(
      input,
      `Live Gemini API unavailable (${msg}). Showing Demo Mode Kenyan learning suggestions.`
    );
  }
}

function buildDemoMicroLearningRecommendations(
  input: {
    sectorName: string;
    location: string;
    focusSkill?: string;
    gaps: GapInputItem[];
  },
  demoNotice = 'GEMINI_API_KEY is not configured. Showing Demo Mode micro-learning and verified Kenyan training directories.'
) {
  const location = input.location || 'Nairobi, Kenya';
  const prioritizedGaps =
    input.focusSkill
      ? input.gaps.filter((g) => g.skillName.toLowerCase().includes(input.focusSkill!.toLowerCase()))
      : input.gaps;
  const activeGaps = prioritizedGaps.length > 0 ? prioritizedGaps : input.gaps;

  const firstGap = activeGaps[0]?.skillName || `${input.sectorName} Core Competency`;
  const secondGap = activeGaps[1]?.skillName || 'Kenyan Regulatory & Safety Compliance';
  const thirdGap = activeGaps[2]?.skillName || 'Portfolio of Evidence Documentation';

  const isDigital =
    input.sectorName.toLowerCase().includes('software') ||
    input.sectorName.toLowerCase().includes('digital') ||
    input.sectorName.toLowerCase().includes('data');

  const isEngineeringOrEnergy =
    input.sectorName.toLowerCase().includes('renewable') ||
    input.sectorName.toLowerCase().includes('civil') ||
    input.sectorName.toLowerCase().includes('construction') ||
    input.sectorName.toLowerCase().includes('trade');

  const microLearningModules: MicroLearningModule[] = [
    {
      id: 'ml-demo-1',
      title: `Close "${firstGap}" with an Applied Mini-Brief`,
      targetSkill: firstGap,
      estimatedDuration: '90 mins',
      format: 'Hands-On Work Sample',
      actionSteps: [
        `Select one real or past project demonstrating ${firstGap} and write a 1-page technical breakdown.`,
        'Document tools used, Kenyan safety or quality checks applied, and measurable outcomes.',
        'Save the PDF/TXT summary in your Document Centre under Work Samples.',
      ],
      outcomeArtifact: `1-page ${firstGap} Case Sample ready for KNQA RPL or employer screening`,
    },
    {
      id: 'ml-demo-2',
      title: `Kenya Standards & Compliance Refresher: ${secondGap}`,
      targetSkill: secondGap,
      estimatedDuration: '60 mins',
      format: 'Regulatory Checklist Drill',
      actionSteps: [
        `Review Kenyan occupational benchmarks for ${secondGap} (${activeGaps[1]?.kenyaContext || 'TVETA / DOSHS standards'}).`,
        'Audit one of your past workflows against Kenyan safety, quality, or reporting terminology.',
        'Update your skill proficiency and evidence note in My Profile once documented.',
      ],
      outcomeArtifact: 'Annotated Kenyan compliance checklist & updated skill provenance note',
    },
    {
      id: 'ml-demo-3',
      title: `Evidence Packaging Sprint for ${thirdGap}`,
      targetSkill: thirdGap,
      estimatedDuration: '45 mins',
      format: 'RPL Portfolio Prep',
      actionSteps: [
        'Request a short signed confirmation or reference email from a past supervisor or workshop lead.',
        'Pair your project summary with any available training records or drawings.',
        'Run an updated AI Skills Assessment to verify your sector gap reduction.',
      ],
      outcomeArtifact: 'Corroborated supervisor reference & stronger Evidence Strength score',
    },
  ];

  const localTrainingResources: LocalTrainingResource[] = [
    ...(isDigital
      ? [
          {
            id: 'tr-demo-ajira',
            name: 'Ajira Digital Training & Youth/Refugee Digital Centres',
            provider: 'Ajira Digital Kenya (Ministry of ICT)',
            location: `${location} & Constituency Digital Centres`,
            costNote: 'Free structured modules & mentorship cohorts',
            officialUrl: 'https://ajiradigital.go.ke',
            relevantGap: firstGap,
            whyItHelps: 'Offers free practical tracks in data analysis, software tools, and digital workplace readiness across Kenya.',
          },
        ]
      : [
          {
            id: 'tr-demo-nita',
            name: 'NITA Government Trade Tests & Industrial Upskilling',
            provider: 'National Industrial Training Authority (NITA)',
            location: 'Nairobi, Mombasa, Kisumu, Nakuru & Athi River Centres',
            costNote: 'Standard public trade-test fee (NGO subsidies often available)',
            officialUrl: 'https://www.nita.go.ke',
            relevantGap: firstGap,
            whyItHelps: 'Provides practical Grade III–I skills testing and short industrial refresher courses recognized by Kenyan employers.',
          },
        ]),
    {
      id: 'tr-demo-tveta',
      name: isEngineeringOrEnergy
        ? 'TVETA Accredited Renewable Energy & Technical Assessment Centres'
        : 'TVETA Accredited Competency-Based Training & Assessment Centres',
      provider: 'TVETA Kenya',
      location: `${location} & Nationwide`,
      costNote: 'Varies by accredited public/private TVET centre',
      officialUrl: 'https://www.tveta.go.ke',
      relevantGap: secondGap,
      whyItHelps: 'Helps locate accredited Kenyan centres offering short modular CBET bridging units and practical competency sign-off.',
    },
    {
      id: 'tr-demo-knqa',
      name: 'KNQA Recognition of Prior Learning (RPL) Assessment Portal',
      provider: 'Kenya National Qualifications Authority (KNQA)',
      location: 'Kenya National Online Intake + Accredited Centres',
      costNote: 'Official public RPL intake guidance & assessment fee schedule',
      officialUrl: 'https://app.rpl.knqa.go.ke',
      relevantGap: thirdGap,
      whyItHelps: `Converts documented field experience in ${input.sectorName} into formal KNQF credit without repeating years of schooling.`,
    },
  ];

  return {
    mode: 'demo' as const,
    demoNotice,
    summary:
      activeGaps.length > 0
        ? `DEMO PLAN: Focused on closing ${activeGaps.length} gap(s) in ${input.sectorName} using short portfolio sprints and verified Kenyan training centres near ${location}.`
        : `DEMO PLAN: All core ${input.sectorName} targets are met—use these Kenyan credentialing sprints to formalize your evidence for employers.`,
    microLearningModules,
    localTrainingResources,
  };
}

