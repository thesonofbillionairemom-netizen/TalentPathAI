import type {
  AssessmentRecord,
  DocumentRecord,
  OpportunityRecord,
  RecognitionPathwayRecord,
  SkillRecord,
} from '../types';

export interface SectorCompetencyRequirement {
  id: string;
  name: string;
  shortLabel: string;
  category: 'technical' | 'transferable' | 'tool' | 'language';
  targetLevel: number;
  targetLabel: string;
  keywords: string[];
  kenyaContext: string;
}

export interface SectorBenchmark {
  id: string;
  sectorName: string;
  regulatoryContext: string;
  competencies: SectorCompetencyRequirement[];
}

export const SECTOR_BENCHMARKS: SectorBenchmark[] = [
  {
    id: 'renewable-civil',
    sectorName: 'Renewable Energy & Civil Infrastructure',
    regulatoryContext: 'Aligned with KNQA RPL / TVETA solar craft standards and EBK site engineering expectations',
    competencies: [
      {
        id: 'solar-sizing',
        name: 'Solar PV & Microgrid Sizing',
        shortLabel: 'Solar PV Sizing',
        category: 'technical',
        targetLevel: 85,
        targetLabel: 'Advanced (85%)',
        keywords: ['solar', 'pv', 'microgrid', 'inverter', 'energy', 'electrical', 'earthing', 'pumping'],
        kenyaContext: 'EPRA & TVETA solar technician competency standard',
      },
      {
        id: 'cad-drafting',
        name: 'CAD Site Drafting & Technical Layouts',
        shortLabel: 'CAD Drafting',
        category: 'tool',
        targetLevel: 80,
        targetLabel: 'Proficient (80%)',
        keywords: ['autocad', 'cad', 'civil 3d', 'drafting', 'layout', 'drawing', 'pvsyst'],
        kenyaContext: 'Required for site engineering drawings & RPL portfolios',
      },
      {
        id: 'structural-inspection',
        name: 'Structural Load & Site Supervision',
        shortLabel: 'Site Supervision',
        category: 'technical',
        targetLevel: 85,
        targetLabel: 'Advanced (85%)',
        keywords: ['structural', 'foundation', 'civil', 'inspection', 'site', 'supervision', 'water', 'borehole'],
        kenyaContext: 'Core field verification competency for Kenyan EPCs',
      },
      {
        id: 'boq-estimation',
        name: 'Bill of Quantities & Cost Estimation',
        shortLabel: 'BOQ & Costing',
        category: 'transferable',
        targetLevel: 75,
        targetLabel: 'Proficient (75%)',
        keywords: ['bill of quantities', 'boq', 'cost', 'estimation', 'budget', 'excel', 'procurement', 'quantity'],
        kenyaContext: 'Standard commercial engineering documentation skill',
      },
      {
        id: 'safety-compliance',
        name: 'Site Safety & Regulatory Compliance',
        shortLabel: 'Safety & Codes',
        category: 'transferable',
        targetLevel: 80,
        targetLabel: 'Proficient (80%)',
        keywords: ['safety', 'compliance', 'risk', 'audit', 'osha', 'nema', 'epra', 'checklist'],
        kenyaContext: 'Kenyan DOSHS workplace safety & electrical audit compliance',
      },
      {
        id: 'stakeholder-leadership',
        name: 'Cross-Cultural Team & Stakeholder Leadership',
        shortLabel: 'Team Leadership',
        category: 'transferable',
        targetLevel: 75,
        targetLabel: 'Proficient (75%)',
        keywords: ['leadership', 'cross-cultural', 'team', 'coordination', 'stakeholder', 'supervision', 'management'],
        kenyaContext: 'Essential for NGO, community mini-grid, and contractor teams',
      },
    ],
  },
  {
    id: 'software-digital',
    sectorName: 'Software & Digital Operations',
    regulatoryContext: 'Benchmarked to Kenyan fintech, remote tech teams, and KNQF Level 6 ICT standards',
    competencies: [
      {
        id: 'core-programming',
        name: 'Software Engineering & Web Systems',
        shortLabel: 'Software Dev',
        category: 'technical',
        targetLevel: 85,
        targetLabel: 'Advanced (85%)',
        keywords: ['javascript', 'typescript', 'python', 'react', 'node', 'software', 'api', 'web', 'backend', 'frontend'],
        kenyaContext: 'Production web/mobile engineering fluency',
      },
      {
        id: 'data-sql',
        name: 'Data Analysis & Database Design',
        shortLabel: 'Data & SQL',
        category: 'technical',
        targetLevel: 80,
        targetLabel: 'Proficient (80%)',
        keywords: ['data', 'sql', 'database', 'analytics', 'excel', 'python', 'reporting', 'dashboard'],
        kenyaContext: 'Core analytical & database query competency',
      },
      {
        id: 'cloud-devops',
        name: 'Version Control, Cloud & Testing',
        shortLabel: 'Cloud & Git',
        category: 'tool',
        targetLevel: 75,
        targetLabel: 'Proficient (75%)',
        keywords: ['git', 'github', 'cloud', 'aws', 'docker', 'linux', 'testing', 'devops', 'ci/cd'],
        kenyaContext: 'Collaborative engineering delivery workflow',
      },
      {
        id: 'agile-delivery',
        name: 'Agile Project & Product Coordination',
        shortLabel: 'Project Delivery',
        category: 'transferable',
        targetLevel: 75,
        targetLabel: 'Proficient (75%)',
        keywords: ['agile', 'scrum', 'project', 'coordination', 'product', 'documentation', 'jira'],
        kenyaContext: 'Cross-functional remote & hybrid delivery',
      },
      {
        id: 'security-privacy',
        name: 'Data Protection & Secure Coding Practices',
        shortLabel: 'Data Security',
        category: 'transferable',
        targetLevel: 75,
        targetLabel: 'Proficient (75%)',
        keywords: ['security', 'privacy', 'compliance', 'audit', 'risk', 'odpc'],
        kenyaContext: 'Kenya Data Protection Act (ODPC) awareness',
      },
    ],
  },
  {
    id: 'healthcare-community',
    sectorName: 'Healthcare & Community Health',
    regulatoryContext: 'Aligned with Kenya public health NGO operations & allied health credential review',
    competencies: [
      {
        id: 'clinical-triage',
        name: 'Clinical / Public Health Operations',
        shortLabel: 'Health Ops',
        category: 'technical',
        targetLevel: 85,
        targetLabel: 'Advanced (85%)',
        keywords: ['health', 'clinical', 'nursing', 'medical', 'public health', 'community', 'triage', 'wash'],
        kenyaContext: 'Direct patient/community health program execution',
      },
      {
        id: 'health-data',
        name: 'Health Informatics & M&E Reporting',
        shortLabel: 'Health Data',
        category: 'tool',
        targetLevel: 75,
        targetLabel: 'Proficient (75%)',
        keywords: ['data', 'dhis2', 'kobo', 'excel', 'analysis', 'm&e', 'monitoring', 'reporting'],
        kenyaContext: 'Digital health data collection & NGO monitoring',
      },
      {
        id: 'protocol-safety',
        name: 'Infection Prevention & Clinical Safety',
        shortLabel: 'Clinical Safety',
        category: 'transferable',
        targetLevel: 85,
        targetLabel: 'Advanced (85%)',
        keywords: ['safety', 'compliance', 'ipc', 'hygiene', 'quality', 'audit', 'ethics'],
        kenyaContext: 'Kenya Ministry of Health & humanitarian standards',
      },
      {
        id: 'multilingual-care',
        name: 'Multilingual Patient & Community Outreach',
        shortLabel: 'Outreach',
        category: 'language',
        targetLevel: 80,
        targetLabel: 'Proficient (80%)',
        keywords: ['english', 'swahili', 'arabic', 'somali', 'french', 'communication', 'multilingual', 'outreach'],
        kenyaContext: 'Essential across Kakuma, Dadaab, and urban clinics',
      },
      {
        id: 'program-coord',
        name: 'Program Coordination & Referral Tracking',
        shortLabel: 'Coordination',
        category: 'transferable',
        targetLevel: 75,
        targetLabel: 'Proficient (75%)',
        keywords: ['coordination', 'project', 'leadership', 'team', 'planning', 'case management'],
        kenyaContext: 'Multi-partner NGO and clinic referral workflows',
      },
    ],
  },
  {
    id: 'construction-trades',
    sectorName: 'Construction & Skilled Trades (TVET / NITA)',
    regulatoryContext: 'Mapped to NITA Trade Tests Grades I–III and NCA site safety standards',
    competencies: [
      {
        id: 'trade-craft',
        name: 'Core Trade Execution (Electrical / Plumbing / Masonry)',
        shortLabel: 'Trade Craft',
        category: 'technical',
        targetLevel: 85,
        targetLabel: 'Advanced (85%)',
        keywords: ['electrical', 'plumbing', 'masonry', 'welding', 'carpentry', 'solar', 'installation', 'maintenance'],
        kenyaContext: 'Practical NITA Grade II/I hands-on test readiness',
      },
      {
        id: 'blueprint-reading',
        name: 'Blueprint Reading & Material Estimation',
        shortLabel: 'Blueprints & BOQ',
        category: 'tool',
        targetLevel: 75,
        targetLabel: 'Proficient (75%)',
        keywords: ['drawing', 'cad', 'blueprint', 'bill of quantities', 'boq', 'estimation', 'measurement'],
        kenyaContext: 'Translating technical schematics into site work',
      },
      {
        id: 'site-safety-nca',
        name: 'Site Safety, PPE & Hazard Prevention',
        shortLabel: 'Site Safety',
        category: 'transferable',
        targetLevel: 85,
        targetLabel: 'Advanced (85%)',
        keywords: ['safety', 'ppe', 'risk', 'compliance', 'audit', 'inspection', 'hazard'],
        kenyaContext: 'National Construction Authority (NCA) compliance',
      },
      {
        id: 'crew-supervision',
        name: 'Artisan Team & Site Supervision',
        shortLabel: 'Crew Supervision',
        category: 'transferable',
        targetLevel: 75,
        targetLabel: 'Proficient (75%)',
        keywords: ['supervision', 'leadership', 'team', 'site', 'foreman', 'coordination'],
        kenyaContext: 'Leading multi-trade work crews on schedule',
      },
      {
        id: 'quality-documentation',
        name: 'Work Logs & RPL Evidence Documentation',
        shortLabel: 'Work Logs',
        category: 'transferable',
        targetLevel: 70,
        targetLabel: 'Proficient (70%)',
        keywords: ['documentation', 'log', 'report', 'quality', 'testing', 'inspection'],
        kenyaContext: 'Required evidence for KNQA RPL trade recognition',
      },
    ],
  },
  {
    id: 'hospitality-services',
    sectorName: 'Hospitality & Multilingual Client Services',
    regulatoryContext: 'Aligned with Kenya hospitality employers, BPO centres, and NITA service standards',
    competencies: [
      {
        id: 'client-operations',
        name: 'Guest Experience & Service Operations',
        shortLabel: 'Client Service',
        category: 'technical',
        targetLevel: 80,
        targetLabel: 'Proficient (80%)',
        keywords: ['hospitality', 'customer', 'client', 'service', 'operations', 'front desk', 'support'],
        kenyaContext: 'Core Kenyan hospitality & BPO service benchmark',
      },
      {
        id: 'multilingual-fluency',
        name: 'Multilingual Communication (English / Swahili / Regional)',
        shortLabel: 'Multilingual',
        category: 'language',
        targetLevel: 85,
        targetLabel: 'Advanced (85%)',
        keywords: ['english', 'swahili', 'arabic', 'somali', 'french', 'multilingual', 'communication', 'translation'],
        kenyaContext: 'High-value differentiator for displaced professionals',
      },
      {
        id: 'pos-crm-tools',
        name: 'POS, Booking & CRM Digital Systems',
        shortLabel: 'CRM & POS',
        category: 'tool',
        targetLevel: 70,
        targetLabel: 'Proficient (70%)',
        keywords: ['crm', 'pos', 'excel', 'booking', 'digital', 'software', 'office'],
        kenyaContext: 'Modern hospitality & support desk software fluency',
      },
      {
        id: 'service-supervision',
        name: 'Shift Supervision & Quality Assurance',
        shortLabel: 'Team Supervision',
        category: 'transferable',
        targetLevel: 75,
        targetLabel: 'Proficient (75%)',
        keywords: ['supervision', 'leadership', 'team', 'training', 'quality', 'coordination'],
        kenyaContext: 'Floor coordination and team coaching readiness',
      },
      {
        id: 'hygiene-compliance',
        name: 'Service Safety & Hygiene Standards',
        shortLabel: 'Service Safety',
        category: 'transferable',
        targetLevel: 75,
        targetLabel: 'Proficient (75%)',
        keywords: ['safety', 'hygiene', 'compliance', 'food', 'audit', 'haccp'],
        kenyaContext: 'Kenyan tourism & food-handling regulatory basics',
      },
    ],
  },
  {
    id: 'logistics-supply',
    sectorName: 'Logistics & Humanitarian Supply Chain',
    regulatoryContext: 'Benchmarked to East African corridor logistics & humanitarian procurement standards',
    competencies: [
      {
        id: 'inventory-fleet',
        name: 'Inventory Control & Fleet Coordination',
        shortLabel: 'Inventory & Fleet',
        category: 'technical',
        targetLevel: 80,
        targetLabel: 'Proficient (80%)',
        keywords: ['logistics', 'supply', 'inventory', 'warehouse', 'fleet', 'distribution', 'dispatch'],
        kenyaContext: 'Core warehouse & regional transport execution',
      },
      {
        id: 'procurement-costing',
        name: 'Procurement & Cost Tracking',
        shortLabel: 'Procurement',
        category: 'transferable',
        targetLevel: 75,
        targetLabel: 'Proficient (75%)',
        keywords: ['procurement', 'cost', 'estimation', 'vendor', 'boq', 'budget', 'contract'],
        kenyaContext: 'Transparent vendor & quotation compliance',
      },
      {
        id: 'erp-spreadsheets',
        name: 'Spreadsheets, ERP & Stock Reporting',
        shortLabel: 'Stock Systems',
        category: 'tool',
        targetLevel: 75,
        targetLabel: 'Proficient (75%)',
        keywords: ['excel', 'erp', 'sap', 'data', 'reporting', 'tracking', 'spreadsheet'],
        kenyaContext: 'Digital stock ledger & reconciliation proficiency',
      },
      {
        id: 'customs-safety',
        name: 'Cargo Safety & Cross-Border Compliance',
        shortLabel: 'Compliance',
        category: 'transferable',
        targetLevel: 75,
        targetLabel: 'Proficient (75%)',
        keywords: ['safety', 'compliance', 'customs', 'risk', 'audit', 'documentation'],
        kenyaContext: 'EAC corridor & humanitarian freight documentation',
      },
      {
        id: 'field-leadership',
        name: 'Cross-Cultural Operations Leadership',
        shortLabel: 'Ops Leadership',
        category: 'transferable',
        targetLevel: 80,
        targetLabel: 'Proficient (80%)',
        keywords: ['leadership', 'cross-cultural', 'team', 'supervision', 'coordination'],
        kenyaContext: 'Leading distributed field and warehouse personnel',
      },
    ],
  },
];

function proficiencyToScore(proficiency: string, source: SkillRecord['source']): number {
  const norm = proficiency.trim().toLowerCase();
  let base = 60;
  if (norm.includes('expert') || norm.includes('master') || norm.includes('native')) {
    base = 96;
  } else if (norm.includes('advanced') || norm.includes('fluent')) {
    base = 90;
  } else if (norm.includes('proficient') || norm.includes('strong') || norm.includes('upper')) {
    base = 80;
  } else if (norm.includes('intermediate') || norm.includes('conversational') || norm.includes('working')) {
    base = 62;
  } else if (norm.includes('basic') || norm.includes('beginner') || norm.includes('foundational')) {
    base = 38;
  }

  // Provenance adjustment: verified/extracted evidence adds confidence
  if (source === 'officially_verified') base += 6;
  else if (source === 'extracted') base += 4;
  else if (source === 'ai_suggested') base -= 4;

  return Math.max(15, Math.min(100, base));
}

export function resolveSectorBenchmark(
  sectorInput: string,
  opportunities: OpportunityRecord[]
): SectorBenchmark {
  const query = sectorInput.trim().toLowerCase();
  if (query) {
    // Direct or strong keyword match against curated Kenyan sector benchmarks
    const direct = SECTOR_BENCHMARKS.find(
      (b) => b.sectorName.toLowerCase() === query || b.id === query
    );
    if (direct) return direct;

    let bestMatch: { benchmark: SectorBenchmark; score: number } | null = null;
    const queryWords = query.split(/[^a-z0-9]+/).filter((w) => w.length > 2);

    for (const bench of SECTOR_BENCHMARKS) {
      let score = 0;
      const haystack = `${bench.sectorName} ${bench.regulatoryContext} ${bench.competencies
        .map((c) => `${c.name} ${c.keywords.join(' ')}`)
        .join(' ')}`.toLowerCase();

      for (const word of queryWords) {
        if (haystack.includes(word)) score += 1;
      }
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { benchmark: bench, score };
      }
    }

    if (bestMatch && bestMatch.score > 0) {
      return bestMatch.benchmark;
    }

    // Build custom benchmark using matching opportunities when user specifies a unique sector
    const matchingOppSkills = new Set<string>();
    for (const opp of opportunities) {
      const oppText = `${opp.title} ${opp.description} ${opp.category}`.toLowerCase();
      if (queryWords.some((w) => oppText.includes(w))) {
        try {
          const parsed = JSON.parse(opp.required_skills_json || '[]') as string[];
          parsed.forEach((s) => matchingOppSkills.add(s));
        } catch {
          // ignore malformed JSON
        }
      }
    }

    const dynamicCompetencies: SectorCompetencyRequirement[] = Array.from(matchingOppSkills)
      .slice(0, 4)
      .map((skillLabel, idx) => ({
        id: `custom-opp-${idx}`,
        name: skillLabel,
        shortLabel: skillLabel.length > 22 ? `${skillLabel.slice(0, 20)}…` : skillLabel,
        category: 'technical',
        targetLevel: 80,
        targetLabel: 'Proficient (80%)',
        keywords: skillLabel
          .toLowerCase()
          .split(/[^a-z0-9]+/)
          .filter((w) => w.length > 2),
        kenyaContext: `Required in active opportunities matching "${sectorInput}"`,
      }));

    if (dynamicCompetencies.length >= 3) {
      return {
        id: 'custom-sector',
        sectorName: sectorInput,
        regulatoryContext: 'Dynamic benchmark built from active opportunity requirements and Kenyan readiness standards',
        competencies: [
          ...dynamicCompetencies,
          {
            id: 'custom-compliance',
            name: 'Kenyan Regulatory & Workplace Compliance',
            shortLabel: 'Compliance',
            category: 'transferable',
            targetLevel: 75,
            targetLabel: 'Proficient (75%)',
            keywords: ['compliance', 'safety', 'audit', 'documentation', 'risk'],
            kenyaContext: 'Kenyan workplace onboarding & credential alignment',
          },
        ],
      };
    }
  }

  return SECTOR_BENCHMARKS[0];
}

export interface CompetencyComparisonItem {
  id: string;
  name: string;
  shortLabel: string;
  category: SectorCompetencyRequirement['category'];
  currentLevel: number;
  targetLevel: number;
  delta: number; // currentLevel - targetLevel (negative means gap)
  gapAmount: number; // max(0, targetLevel - currentLevel)
  status: 'aligned' | 'partial' | 'gap';
  matchedSkills: SkillRecord[];
  evidenceNote: string;
  kenyaContext: string;
}

export interface SectorGapSummary {
  benchmark: SectorBenchmark;
  items: CompetencyComparisonItem[];
  overallReadiness: number;
  alignedCount: number;
  partialCount: number;
  gapCount: number;
  topGaps: CompetencyComparisonItem[];
  recognizedStepsCompleted: number;
  recognizedStepsTotal: number;
}

export function computeSectorSkillComparison(
  benchmark: SectorBenchmark,
  skills: SkillRecord[],
  documents: DocumentRecord[],
  latestAssessment: AssessmentRecord | null,
  pathways: RecognitionPathwayRecord[]
): SectorGapSummary {
  const docSkillsFlat = documents.flatMap((d) => {
    try {
      return (JSON.parse(d.extracted_skills_json || '[]') as string[]).map((s) => s.toLowerCase());
    } catch {
      return [];
    }
  });

  const assessmentText = latestAssessment
    ? `${latestAssessment.summary} ${(latestAssessment.results || [])
        .map((r) => `${r.result_type}:${r.title} ${r.detail}`)
        .join(' ')}`.toLowerCase()
    : '';

  const items: CompetencyComparisonItem[] = benchmark.competencies.map((req) => {
    const matched = skills.filter((skill) => {
      const skillText = `${skill.name} ${skill.evidence_note}`.toLowerCase();
      return req.keywords.some((kw) => skillText.includes(kw));
    });

    let currentLevel = 0;
    let evidenceNote = 'No matching skill documented yet. Add skills in My Profile or upload supporting evidence.';

    if (matched.length > 0) {
      const scores = matched.map((m) => proficiencyToScore(m.proficiency, m.source));
      const bestScore = Math.max(...scores);
      // Slight corroboration boost if multiple distinct skills or extracted doc keywords match
      const docCorroborated = docSkillsFlat.some((ds) => req.keywords.some((kw) => ds.includes(kw)));
      currentLevel = Math.min(100, bestScore + (matched.length > 1 ? 3 : 0) + (docCorroborated ? 2 : 0));

      const primary = matched[0];
      const sourceText =
        primary.source === 'officially_verified'
          ? 'officially verified'
          : primary.source === 'extracted'
          ? 'extracted from evidence'
          : primary.source === 'ai_suggested'
          ? 'AI-suggested'
          : 'user-provided';
      evidenceNote = `Matched: ${primary.name} (${primary.proficiency} · ${sourceText})${
        matched.length > 1 ? ` +${matched.length - 1} more` : ''
      }`;
    } else if (docSkillsFlat.some((ds) => req.keywords.some((kw) => ds.includes(kw)))) {
      currentLevel = 45;
      evidenceNote = 'Referenced in uploaded document scan, but not yet added to your structured skills profile.';
    } else if (assessmentText && req.keywords.some((kw) => assessmentText.includes(kw))) {
      currentLevel = 35;
      evidenceNote = 'Mentioned in latest AI assessment; add concrete evidence or proficiency level to verify.';
    }

    const delta = currentLevel - req.targetLevel;
    const gapAmount = Math.max(0, req.targetLevel - currentLevel);

    let status: CompetencyComparisonItem['status'] = 'gap';
    if (currentLevel >= req.targetLevel) {
      status = 'aligned';
    } else if (currentLevel >= req.targetLevel - 15 && currentLevel > 0) {
      status = 'partial';
    }

    return {
      id: req.id,
      name: req.name,
      shortLabel: req.shortLabel,
      category: req.category,
      currentLevel,
      targetLevel: req.targetLevel,
      delta,
      gapAmount,
      status,
      matchedSkills: matched,
      evidenceNote,
      kenyaContext: req.kenyaContext,
    };
  });

  const totalAttainment = items.reduce(
    (sum, item) => sum + Math.min(1, item.targetLevel > 0 ? item.currentLevel / item.targetLevel : 0),
    0
  );
  const overallReadiness = items.length > 0 ? Math.round((totalAttainment / items.length) * 100) : 0;
  const alignedCount = items.filter((i) => i.status === 'aligned').length;
  const partialCount = items.filter((i) => i.status === 'partial').length;
  const gapCount = items.filter((i) => i.status === 'gap').length;
  const topGaps = [...items]
    .filter((i) => i.gapAmount > 0)
    .sort((a, b) => b.gapAmount - a.gapAmount);

  const allSteps = pathways.flatMap((p) => p.steps || []);
  const recognizedStepsCompleted = allSteps.filter((s) => s.status === 'completed').length;

  return {
    benchmark,
    items,
    overallReadiness,
    alignedCount,
    partialCount,
    gapCount,
    topGaps,
    recognizedStepsCompleted,
    recognizedStepsTotal: allSteps.length,
  };
}
