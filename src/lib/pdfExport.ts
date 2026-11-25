import { jsPDF } from 'jspdf';
import type {
  DocumentRecord,
  PortfolioRecord,
  ProfileRecord,
  QualificationRecord,
  RecognitionPathwayRecord,
  SkillRecord,
  WorkExperienceRecord,
} from '../types';

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
