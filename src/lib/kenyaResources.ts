export interface KenyanInstitution {
  id: string;
  name: string;
  acronym: string;
  role: string;
  pathwayFocus: string;
  description: string;
  officialUrl: string;
}

export const KENYAN_INSTITUTIONS: KenyanInstitution[] = [
  {
    id: 'knqa',
    name: 'Kenya National Qualifications Authority',
    acronym: 'KNQA',
    role: 'National Qualifications Framework & RPL Coordinator',
    pathwayFocus: 'Recognition of Prior Learning (RPL) & Foreign Qualification Equation',
    description:
      'Coordinates Kenya’s national RPL policy, enabling skilled workers and displaced professionals with informal or undocumented experience to earn formal KNQF recognition.',
    officialUrl: 'https://knqa.go.ke',
  },
  {
    id: 'knqa-rpl',
    name: 'KNQA RPL Application Portal',
    acronym: 'KNQA RPL',
    role: 'Online RPL Portfolio & Assessment Intake',
    pathwayFocus: 'RPL Dossier Submission',
    description:
      'Official digital portal for submitting Recognition of Prior Learning portfolios and tracking competency-based assessment steps in Kenya.',
    officialUrl: 'https://app.rpl.knqa.go.ke',
  },
  {
    id: 'tveta',
    name: 'Technical and Vocational Education and Training Authority',
    acronym: 'TVETA',
    role: 'TVET Accreditation & Assessment Centres Regulator',
    pathwayFocus: 'Technical Trades, Solar, Engineering Technician & Craft Assessments',
    description:
      'Regulates accredited technical assessment centres across Kenya where candidates sit practical competency evaluations.',
    officialUrl: 'https://www.tveta.go.ke',
  },
  {
    id: 'nita',
    name: 'National Industrial Training Authority',
    acronym: 'NITA',
    role: 'Industrial Trade Testing & Certification',
    pathwayFocus: 'Government Trade Tests (Grades III, II, I) & Artisans',
    description:
      'Conducts practical trade testing and industrial skills certification across mechanical, electrical, construction, and hospitality trades.',
    officialUrl: 'https://www.nita.go.ke',
  },
  {
    id: 'unesco-uqp',
    name: 'UNESCO Qualifications Passport',
    acronym: 'UQP',
    role: 'Refugee & Displaced Academic Credential Assessment',
    pathwayFocus: 'Missing Academic Papers & Higher Education Equivalence',
    description:
      'Standardized evaluation mechanism piloted in Kenya with KNQA and DRS to assess refugees’ higher education qualifications even when original documents were lost.',
    officialUrl: 'https://www.unesco.org/en/higher-education/qualifications-passport',
  },
  {
    id: 'drs',
    name: 'Department of Refugee Services (Kenya)',
    acronym: 'DRS',
    role: 'Statutory Refugee Registration & Documentation Authority',
    pathwayFocus: 'Refugee ID Cards, Asylum Seeker Passes & Refugees Act 2021',
    description:
      'Kenyan government authority responsible for refugee status registration, identity documentation, and implementation of the Refugees Act 2021.',
    officialUrl: 'https://www.refugees.go.ke',
  },
  {
    id: 'ebk',
    name: 'Engineers Board of Kenya',
    acronym: 'EBK',
    role: 'Engineering Profession Regulator',
    pathwayFocus: 'Graduate & Professional Engineer Registration',
    description:
      'Statutory regulator overseeing engineering degree accreditation, practical logbooks, and licensing for engineers practicing in Kenya.',
    officialUrl: 'https://ebk.or.ke',
  },
  {
    id: 'knec',
    name: 'Kenya National Examinations Council',
    acronym: 'KNEC',
    role: 'National Examinations & Certificate Verification',
    pathwayFocus: 'Secondary & Technical Examination Equivalence',
    description:
      'Administers national technical and academic examinations and supports qualification verification frameworks in Kenya.',
    officialUrl: 'https://www.knec.ac.ke',
  },
];

export interface ImpactStatistic {
  id: string;
  value: string;
  numericValue: number;
  suffix: string;
  label: string;
  context: string;
  sourceName: string;
  sourceUrl: string;
  isSample?: boolean;
}

export const IMPACT_STATISTICS: ImpactStatistic[] = [
  {
    id: 'unhcr-kenya-pop',
    value: '835,793',
    numericValue: 835793,
    suffix: '',
    label: 'Registered refugees & asylum-seekers in Kenya',
    context: 'UNHCR Kenya Operational Update (Dec 2025), including 118,313 in urban centres such as Nairobi, Mombasa, and Nakuru.',
    sourceName: 'UNHCR Kenya Data Portal',
    sourceUrl: 'https://data.unhcr.org/en/country/ken',
  },
  {
    id: 'unesco-uqp',
    value: '40+',
    numericValue: 40,
    suffix: '+',
    label: 'Countries & partners advancing UNESCO Qualifications Passport',
    context: 'Kenya partnered with UNESCO, KNQA, and DRS to mainstream UQP within the Kenya National Qualifications Framework for refugees lacking complete transcripts.',
    sourceName: 'UNESCO Qualifications Passport & KNQA',
    sourceUrl: 'https://www.unesco.org/en/higher-education/qualifications-passport',
  },
  {
    id: 'ilo-decent-work',
    value: '2021',
    numericValue: 2021,
    suffix: '',
    label: 'Kenya Refugees Act enactment year',
    context: 'Established a legal shift toward socio-economic inclusion, documentation access, and formal labour market participation alongside ILO self-reliance programmes.',
    sourceName: 'ILO & Kenya Department of Refugee Services',
    sourceUrl: 'https://www.ilo.org',
  },
  {
    id: 'sample-journey-metric',
    value: '4 Steps',
    numericValue: 4,
    suffix: ' Steps',
    label: 'Structured TalentPath preparation workflow (SAMPLE DATA)',
    context: 'Illustrative platform journey metric showing profile, evidence review, AI assessment, and KNQA RPL checklist preparation.',
    sourceName: 'TalentPath AI Demonstration Workflow (SAMPLE DATA)',
    sourceUrl: 'https://knqa.go.ke',
    isSample: true,
  },
];

export interface ReadinessChecklistItem {
  id: string;
  category: 'Identity & Status' | 'Work & Employer Compliance' | 'Professional Registration' | 'Financial & Banking';
  title: string;
  guidance: string;
  officialLabel: string;
  officialUrl: string;
}

export const READINESS_CHECKLIST_ITEMS: ReadinessChecklistItem[] = [
  {
    id: 'drs_registration',
    category: 'Identity & Status',
    title: 'Department of Refugee Services (DRS) Registration & Alien/Refugee ID',
    guidance: 'Keep your DRS Refugee ID card or valid Asylum Seeker Pass current, as employers, banks, and recognition agencies verify official identity documents.',
    officialLabel: 'DRS Kenya',
    officialUrl: 'https://www.refugees.go.ke',
  },
  {
    id: 'refugee_id_card',
    category: 'Identity & Status',
    title: 'Review Movement & Urban Registration Compliance',
    guidance: 'Under the Refugees Act 2021, verify whether your documentation reflects your current county of residence (e.g., Nairobi, Kakuma, Dadaab).',
    officialLabel: 'Refugees Act Overview (UNHCR)',
    officialUrl: 'https://data.unhcr.org/en/country/ken',
  },
  {
    id: 'work_permit_review',
    category: 'Work & Employer Compliance',
    title: 'Check Work Authorization & Class M Permit Guidance',
    guidance: 'Legal work authorization in Kenya depends on individual refugee status, employer sponsorship, and immigration rules. Consult qualified legal aid before signing contracts.',
    officialLabel: 'Kenya Immigration Services',
    officialUrl: 'https://immigration.go.ke',
  },
  {
    id: 'kra_pin_prepared',
    category: 'Work & Employer Compliance',
    title: 'Prepare KRA PIN & Statutory Onboarding Information',
    guidance: 'Kenyan formal employers typically require a Kenya Revenue Authority (KRA) PIN, SHIF/SHA health registration, and NSSF details during onboarding.',
    officialLabel: 'Kenya Revenue Authority',
    officialUrl: 'https://www.kra.go.ke',
  },
  {
    id: 'knqa_rpl_dossier',
    category: 'Professional Registration',
    title: 'Align Regulated Profession Credentials (KNQA / EBK / Sector Bodies)',
    guidance: 'Regulated roles (engineering, healthcare, teaching, law) require formal recognition or licensing from Kenyan statutory boards alongside KNQA equivalence.',
    officialLabel: 'KNQA Official Portal',
    officialUrl: 'https://knqa.go.ke',
  },
  {
    id: 'bank_mobile_money',
    category: 'Financial & Banking',
    title: 'Verify Kenyan Bank Account & M-Pesa Payment Readiness',
    guidance: 'Confirm with Kenyan banks or mobile money agents which accepted identity documents (DRS Refugee ID / Alien ID) satisfy Know-Your-Customer (KYC) rules.',
    officialLabel: 'Central Bank of Kenya',
    officialUrl: 'https://www.centralbank.go.ke',
  },
];
