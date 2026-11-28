import { jsPDF } from 'jspdf';
import type {
  DocumentRecord,
  MicroLearningRecommendationResponse,
  PortfolioRecord,
  ProfileRecord,
  QualificationRecord,
  RecognitionPathwayRecord,
  SkillRecord,
  WorkExperienceRecord,
} from '../types';
import type { SectorGapSummary } from './sectorBenchmarks';
import type { RoadmapPhaseData } from './roadmap';

function toPdfSafeText(input: string): string {
  return input
    .replace(/→/g, '->')
    .replace(/−/g, '-')
    .replace(/—/g, '--')
    .replace(/–/g, '-')
    .replace(/•/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");
}

export function exportPortfolioToPdf(params: {
  fullName: string;
  portfolio: PortfolioRecord;
  profile: ProfileRecord | null;
  qualifications: QualificationRecord[];
  experience: WorkExperienceRecord[];
  skills: SkillRecord[];
  documents: DocumentRecord[];
  pathways: RecognitionPathwayRecord[];
}): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 46;
  const maxWidth = pageWidth - margin * 2;
  let y = 52;

  const ensureSpace = (needed = 40) => {
    if (y + needed > 775) {
      doc.addPage();
      y = 50;
    }
  };

  const addHeading = (text: string) => {
    ensureSpace(34);
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(11, 31, 58);
    doc.text(text.toUpperCase(), margin, y);
    y += 6;
    doc.setDrawColor(15, 181, 174);
    doc.setLineWidth(1.2);
    doc.line(margin, y, margin + maxWidth, y);
    y += 14;
  };

  const addParagraph = (text: string, size = 10, color: [number, number, number] = [51, 65, 85]) => {
    if (!text.trim()) return;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, maxWidth) as string[];
    for (const line of lines) {
      ensureSpace(16);
      doc.text(line, margin, y);
      y += 14;
    }
  };

  // Header Banner
  doc.setFillColor(11, 31, 58);
  doc.rect(0, 0, pageWidth, 94, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.setTextColor(255, 255, 255);
  doc.text(params.fullName, margin, 40);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(94, 214, 207);
  doc.text(params.profile?.headline || 'Professional Portfolio', margin, 58);

  doc.setFontSize(9);
  doc.setTextColor(226, 232, 240);
  const metaLine = `${params.profile?.current_location || 'Kenya'}  |  ${params.profile?.target_sector || 'General'}  |  Generated via TalentPath AI (${params.portfolio.mode === 'gemini' ? 'AI-Assisted' : 'Demo Mode'})`;
  doc.text(metaLine, margin, 76);

  y = 116;

  // Summary
  addHeading('Professional Summary');
  addParagraph(params.portfolio.summary);

  // Education / Qualifications
  addHeading('Education & Qualifications');
  if (params.qualifications.length === 0) {
    addParagraph('No qualifications recorded yet.');
  } else {
    for (const q of params.qualifications) {
      ensureSpace(32);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(11, 31, 58);
      doc.text(`${q.title} — ${q.institution}`, margin, y);
      y += 13;
      addParagraph(`${q.level} | ${q.country || 'Unspecified'} | ${q.year_obtained || 'Year N/A'} | Status: ${q.status.replace(/_/g, ' ')}`, 9.5);
      if (q.notes) addParagraph(q.notes, 9.5);
      y += 4;
    }
  }

  // Work Experience
  addHeading('Employment History');
  if (params.experience.length === 0) {
    addParagraph('No employment history recorded yet.');
  } else {
    for (const w of params.experience) {
      ensureSpace(36);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(11, 31, 58);
      doc.text(`${w.job_title} — ${w.organization} (${w.start_year}–${w.end_year || 'Present'})`, margin, y);
      y += 13;
      if (w.description) addParagraph(w.description, 9.5);
      if (w.achievements) addParagraph(`Key impact: ${w.achievements}`, 9.5);
      y += 4;
    }
  }

  // Technical & Transferable Skills
  addHeading('Technical & Transferable Skills');
  const tech = params.skills.filter((s) => s.category === 'technical' || s.category === 'tool');
  const trans = params.skills.filter((s) => s.category === 'transferable' || s.category === 'language');
  if (tech.length > 0) {
    addParagraph(`Technical & Tools: ${tech.map((s) => `${s.name} [${s.source.replace(/_/g, ' ')}]`).join(', ')}`);
  }
  if (trans.length > 0) {
    addParagraph(`Transferable & Languages: ${trans.map((s) => `${s.name} [${s.source.replace(/_/g, ' ')}]`).join(', ')}`);
  }

  // Supporting Evidence
  addHeading('Supporting Evidence Inventory');
  if (params.documents.length === 0) {
    addParagraph('No supporting documents attached yet.');
  } else {
    for (const d of params.documents) {
      addParagraph(`• ${d.original_name} (${d.category.replace(/_/g, ' ')}) — ${d.extracted_summary || 'Stored privately'}`);
    }
  }

  // Strengths & Gaps
  const strengths = JSON.parse(params.portfolio.strengths_json || '[]') as string[];
  const gaps = JSON.parse(params.portfolio.gaps_json || '[]') as string[];
  const nextSteps = JSON.parse(params.portfolio.next_steps_json || '[]') as string[];

  addHeading('Identified Strengths & Evidence Gaps');
  for (const s of strengths) addParagraph(`+ Strength: ${s}`);
  for (const g of gaps) addParagraph(`! Evidence Gap: ${g}`);

  addHeading('Recommended Recognition Pathways & Next Steps');
  for (const p of params.pathways) {
    addParagraph(`• ${p.target_occupation} via ${p.institution_name} (${p.official_url})`);
  }
  for (const step of nextSteps) {
    addParagraph(`→ ${step}`);
  }

  // Responsible AI Disclaimer Footer
  ensureSpace(45);
  y += 12;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, margin + maxWidth, y);
  y += 14;
  addParagraph(
    'Disclaimer: Generated with TalentPath AI. This portfolio organizes user-provided history, uploaded document summaries, and AI-assisted suggestions. It is NOT an official qualification verification, legal status determination, or institutional certificate.',
    8.5,
    [100, 116, 139]
  );

  const safeFilename = `${params.fullName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_talentpath_portfolio.pdf`;
  doc.save(safeFilename);
}

export function exportSkillsGapAndRoadmapPdf(params: {
  fullName: string;
  profile: ProfileRecord | null;
  gapSummary: SectorGapSummary;
  skillScope: 'all' | 'self_assessed';
  phases: RoadmapPhaseData[];
  overallTimelineProgress: number;
  learningPlan: MicroLearningRecommendationResponse | null;
}): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 44;
  const maxWidth = pageWidth - margin * 2;
  let y = 52;

  const ensureSpace = (needed = 40) => {
    if (y + needed > pageHeight - 54) {
      doc.addPage();
      y = 48;
    }
  };

  const addSectionHeading = (title: string, subtitle?: string) => {
    ensureSpace(44);
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(11, 31, 58);
    doc.text(toPdfSafeText(title.toUpperCase()), margin, y);
    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(toPdfSafeText(subtitle), pageWidth - margin, y, { align: 'right' });
    }
    y += 6;
    doc.setDrawColor(15, 181, 174);
    doc.setLineWidth(1.2);
    doc.line(margin, y, margin + maxWidth, y);
    y += 14;
  };

  const addWrappedText = (
    text: string,
    size = 9.5,
    color: [number, number, number] = [71, 85, 105],
    bold = false,
    indent = 0
  ) => {
    const clean = toPdfSafeText(text).trim();
    if (!clean) return;
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(clean, maxWidth - indent) as string[];
    for (const line of lines) {
      ensureSpace(15);
      doc.text(line, margin + indent, y);
      y += 13;
    }
  };

  // Branded Top Header Banner
  doc.setFillColor(11, 31, 58);
  doc.rect(0, 0, pageWidth, 102, 'F');
  doc.setFillColor(15, 181, 174);
  doc.rect(0, 102, pageWidth, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(94, 214, 207);
  doc.text('TALENTPATH AI  |  SKILLS GAP & CAREER ROADMAP REPORT', margin, 28);

  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text(toPdfSafeText(params.fullName), margin, 52);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(226, 232, 240);
  const headline = params.profile?.headline || 'Skilled Professional';
  doc.text(toPdfSafeText(headline), margin, 69);

  const generatedDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const scopeLabel =
    params.skillScope === 'self_assessed' ? 'Self-Assessed Skills Only' : 'All Documented Skills';
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    toPdfSafeText(
      `Target Sector: ${params.gapSummary.benchmark.sectorName}  |  Location: ${
        params.profile?.current_location || 'Kenya'
      }  |  Scope: ${scopeLabel}  |  Date: ${generatedDate}`
    ),
    margin,
    87
  );

  y = 124;

  // Executive KPI Summary Row (4 clean boxes)
  const kpiBoxWidth = (maxWidth - 24) / 4;
  const kpis = [
    { label: 'SECTOR MATCH', value: `${params.gapSummary.overallReadiness}%`, accent: [11, 31, 58] as [number, number, number] },
    { label: 'TARGETS MET', value: `${params.gapSummary.alignedCount} / ${params.gapSummary.items.length}`, accent: [22, 163, 74] as [number, number, number] },
    { label: 'PRIORITY GAPS', value: `${params.gapSummary.gapCount}`, accent: [217, 119, 6] as [number, number, number] },
    { label: 'ROADMAP PROGRESS', value: `${params.overallTimelineProgress}%`, accent: [15, 181, 174] as [number, number, number] },
  ];
  kpis.forEach((kpi, idx) => {
    const x = margin + idx * (kpiBoxWidth + 8);
    doc.setFillColor(246, 249, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, kpiBoxWidth, 46, 6, 6, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(kpi.label, x + 10, y + 15);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...kpi.accent);
    doc.text(kpi.value, x + 10, y + 35);
  });
  y += 64;

  // Section 1: Skills vs Target Sector Gap Progress Bars
  addSectionHeading(
    '1. Skills vs. Target Sector Requirements',
    params.gapSummary.benchmark.sectorName
  );
  addWrappedText(params.gapSummary.benchmark.regulatoryContext, 9, [71, 85, 105]);
  y += 4;

  for (const item of params.gapSummary.items) {
    ensureSpace(54);
    const statusText =
      item.status === 'aligned'
        ? 'Meets Avg'
        : item.status === 'partial'
        ? 'Near Target'
        : 'Skill Gap';
    const diffText =
      item.delta >= 0
        ? item.delta === 0
          ? 'Target met'
          : `+${item.delta}% ahead`
        : `-${item.gapAmount}% gap`;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(11, 31, 58);
    doc.text(toPdfSafeText(`${item.name} (${item.category})`), margin, y);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    if (item.status === 'aligned') doc.setTextColor(22, 163, 74);
    else if (item.status === 'partial') doc.setTextColor(124, 92, 252);
    else doc.setTextColor(217, 119, 6);
    doc.text(
      toPdfSafeText(`${statusText}  |  ${item.currentLevel}% / ${item.targetLevel}% (${diffText})`),
      pageWidth - margin,
      y,
      { align: 'right' }
    );
    y += 6;

    // Visual Progress Bar + Sector Target Marker
    const barW = maxWidth;
    const barH = 8;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, barW, barH, 3, 3, 'F');

    const targetW = (item.targetLevel / 100) * barW;
    doc.setFillColor(226, 232, 240);
    doc.rect(margin, y, targetW, barH, 'F');

    const currentW = (item.currentLevel / 100) * barW;
    if (currentW > 0) {
      if (item.status === 'aligned') doc.setFillColor(15, 181, 174);
      else if (item.status === 'partial') doc.setFillColor(124, 92, 252);
      else doc.setFillColor(245, 165, 36);
      doc.roundedRect(margin, y, currentW, barH, 3, 3, 'F');
    }

    // Target threshold tick
    doc.setDrawColor(11, 31, 58);
    doc.setLineWidth(1.5);
    doc.line(margin + targetW, y - 2, margin + targetW, y + barH + 2);
    y += 18;

    addWrappedText(`${item.evidenceNote} - ${item.kenyaContext}`, 8.5, [100, 116, 139]);
    y += 4;
  }

  // Section 2: 4-Phase Career Progression Roadmap
  addSectionHeading(
    '2. Visual Career Progression Roadmap',
    `${params.overallTimelineProgress}% Overall Complete`
  );

  for (const phase of params.phases) {
    ensureSpace(74);
    const phaseStatusLabel =
      phase.status === 'completed'
        ? 'Completed'
        : phase.status === 'active'
        ? 'Current Focus'
        : 'Upcoming';

    doc.setFillColor(246, 249, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, maxWidth, 22, 4, 4, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(11, 31, 58);
    doc.text(
      toPdfSafeText(`Phase ${phase.stepNumber}: ${phase.title}`),
      margin + 8,
      y + 14.5
    );

    doc.setFontSize(8.5);
    if (phase.status === 'completed') doc.setTextColor(22, 163, 74);
    else if (phase.status === 'active') doc.setTextColor(124, 92, 252);
    else doc.setTextColor(71, 85, 105);
    doc.text(
      toPdfSafeText(`${phaseStatusLabel}  |  ${phase.timeframe}  |  ${phase.progressPercent}%`),
      pageWidth - margin - 8,
      y + 14.5,
      { align: 'right' }
    );
    y += 32;

    addWrappedText(phase.summaryText, 9, [71, 85, 105]);
    for (const m of phase.milestones) {
      addWrappedText(
        `${m.done ? '[Done]' : '[Pending]'} ${m.label}`,
        8.5,
        m.done ? [22, 163, 74] : [71, 85, 105],
        false,
        10
      );
    }
    y += 6;
  }

  // Section 3: Micro-Learning & Kenyan Training Centres (if available)
  if (params.learningPlan) {
    addSectionHeading(
      '3. Micro-Learning Sprints & Local Kenyan Training',
      params.learningPlan.mode === 'gemini' ? 'AI-Generated Plan' : 'Demo Mode Plan'
    );
    addWrappedText(params.learningPlan.summary, 9, [71, 85, 105]);
    y += 4;

    for (const mod of params.learningPlan.microLearningModules) {
      ensureSpace(48);
      addWrappedText(
        `${mod.title} (${mod.targetSkill} | ${mod.estimatedDuration} | ${mod.format})`,
        9.5,
        [11, 31, 58],
        true
      );
      for (const step of mod.actionSteps) {
        addWrappedText(`- ${step}`, 8.5, [71, 85, 105], false, 10);
      }
      addWrappedText(`Portfolio Output: ${mod.outcomeArtifact}`, 8.5, [11, 138, 132], false, 10);
      y += 4;
    }

    ensureSpace(44);
    addWrappedText('Recommended Kenyan Training & RPL Resources:', 9.5, [11, 31, 58], true);
    for (const res of params.learningPlan.localTrainingResources) {
      ensureSpace(34);
      addWrappedText(
        `- ${res.name} (${res.provider}, ${res.location}) - ${res.officialUrl}`,
        8.5,
        [11, 31, 58],
        true,
        6
      );
      addWrappedText(
        `Bridges ${res.relevantGap} | ${res.costNote}. ${res.whyItHelps}`,
        8.5,
        [71, 85, 105],
        false,
        14
      );
    }
  }

  // Footer Disclaimer & Page Numbers across all pages
  ensureSpace(46);
  y += 10;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.8);
  doc.line(margin, y, margin + maxWidth, y);
  y += 13;
  addWrappedText(
    'Disclaimer: Generated offline report from TalentPath AI. Competency comparisons, roadmaps, and AI-assisted suggestions support career preparation in Kenya and do not constitute official qualification recognition, accreditation, or legal advice. Verify credential rules directly with KNQA, TVETA, NITA, DRS, or EBK.',
    8,
    [100, 116, 139]
  );

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `TalentPath AI  |  Offline Skills Gap & Roadmap Report`,
      margin,
      pageHeight - 24
    );
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 24, {
      align: 'right',
    });
  }

  const safeName = params.fullName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const safeSector = params.gapSummary.benchmark.id.replace(/[^a-z0-9]+/g, '_');
  doc.save(`${safeName}_${safeSector}_skills_gap_roadmap.pdf`);
}

