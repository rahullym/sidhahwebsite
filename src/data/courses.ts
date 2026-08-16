export interface Module {
  title: string;
  /** Chapter titles in order. The chapter number is derived from position. */
  chapters: string[];
}

export interface Course {
  slug: string;
  title: string;
  shortTitle: string;
  duration: string;
  level: string;
  /** One-line pitch used on cards and in meta descriptions. */
  summary: string;
  intro: string;
  featured: boolean;
  eligibility: string[];
  outcomes: string[];
  careers: string[];
  highlights: { label: string; value: string }[];
  modules: Module[];
}

/**
 * Modules 1–4 are shared: the 6-month Diploma is the first four modules of the
 * PG Diploma, so both courses stay in sync from one definition.
 */
const moduleIntroduction: Module = {
  title: 'Introduction to Hospital and Its Services',
  chapters: [
    'Evolution, Functions and Classification of Hospitals',
    'Overview of Hospital Departments and Their Roles',
    'Management of Outpatient and Inpatient Departments',
    'Emergency Medical Services and Hospital Response',
    'Organization and Functions of ICU and Operation Theatre',
    'Healthcare System in India',
    'Healthcare Team and Professional Responsibilities',
    'Introduction to Hospital Administration',
    'Ethical Principles and Professional Practice in Healthcare',
    'Fundamentals of Communication and Medical Terminology',
  ],
};

const moduleAdministrative: Module = {
  title: 'Administrative Services in Hospitals',
  chapters: [
    'Human Resource Management (HRM)',
    'Public Relations Management in Healthcare',
    'Administration Department in Hospitals',
    'Nursing Administration',
    'Hospital Quality, Safety and Infection Control',
    'Medical Insurance and Healthcare Financing',
    'Hospital Waste, Medical Gas and Spill Management',
    'Disaster Preparedness, Response and Recovery in Hospitals',
    'Materials Management',
    'Marketing Management in Healthcare',
    'Hospital Audit',
  ],
};

const moduleManagement: Module = {
  title: 'Healthcare Management Fundamentals',
  chapters: [
    'Foundations of Management',
    'Management Principles and Administrative Functions',
    'Organizational Behavior in Healthcare Settings',
    'Operational Management in Healthcare Organizations',
    'Healthcare Strategy and Management',
    'Healthcare Financial Management',
    'Fundamentals of Project Management',
    'Fundamentals of Healthcare Entrepreneurship',
    'Organizational Leadership and Change Management',
    'Fundamentals of Research Methodology',
  ],
};

const moduleAi: Module = {
  title: 'Artificial Intelligence in Healthcare',
  chapters: [
    'Basics of Information Technology',
    'Hospital Information System',
    'Introduction to Artificial Intelligence, Types and Role in Healthcare',
    'Data Concepts in Healthcare: Literacy to Analytics',
    'AI Applications in Hospital Management, Monitoring and Treatment',
    'Introduction to Capstone Project in Healthcare AI',
    'Risks, Ethics and Future of Artificial Intelligence in Healthcare',
  ],
};

const modulePublicHealth: Module = {
  title: 'Public Health and Community Health Administration',
  chapters: [
    'Structure of Public Health System in India',
    'National Health Programs in India',
    'Preventive and Promotive Healthcare',
    'Basics of Epidemiology',
    'Health Education and Community Awareness',
    'Disease Surveillance Systems',
  ],
};

const moduleAnalytics: Module = {
  title: 'Healthcare Analytics, Statistics & Economic Decision-Making',
  chapters: [
    'Basics of Statistics in Healthcare',
    'Data Visualization in Healthcare',
    'Correlation and Trend Analysis in Healthcare Data',
    'Healthcare Analytics and Business Intelligence',
    'Predictive Analytics in Healthcare',
    'Healthcare Optimization Techniques',
    'Demand Forecasting in Healthcare',
    'Healthcare Economics and Financial Decision-Making',
  ],
};

const moduleServiceRisk: Module = {
  title: 'Healthcare Service Management, Risk & Strategic Operations',
  chapters: [
    'Risk Management in Healthcare',
    'Hospital Records and Documentation Management',
    'Cybersecurity in Healthcare Systems',
    'Sustainable Hospital Management',
    'Hospitality Management in Healthcare',
    'Digital Marketing in Healthcare',
    'Medical Tourism Management',
    'Emerging Trends in Hospital and Healthcare Management',
  ],
};

export const courses: Course[] = [
  {
    slug: 'pg-diploma-hospital-administration',
    title: 'PG Diploma in Hospital Administration',
    shortTitle: 'PG Diploma in Hospital Administration',
    duration: '1 Year',
    level: 'Post Graduate Diploma',
    summary:
      'Our flagship one-year classroom program — 60 chapters across seven modules, from hospital operations to healthcare AI and analytics.',
    intro:
      'A full year in the classroom, built for graduates who want to run hospital departments rather than assist in them. You move from how a hospital is structured, through the administrative and management functions that keep it running, into the analytics, AI and strategy work that increasingly decides which hospitals thrive. Every module is taught face to face at our Kochi campus, with hospital visits and a capstone project you present in person.',
    featured: true,
    eligibility: [
      'Any degree — including B.Sc Nursing, Paramedical, Life Sciences, BBA, B.Com and B.A',
      'Final-year students may join and submit their degree certificate on completion',
      'No prior hospital experience required',
    ],
    outcomes: [
      'Run an OP/IP department, from patient flow and scheduling to grievance handling',
      'Handle NABH-oriented quality, safety and infection-control documentation',
      'Manage insurance, TPA claims and hospital billing cycles end to end',
      'Read a hospital P&L and build departmental budgets and forecasts',
      'Work confidently inside a Hospital Information System and interpret its data',
      'Present a healthcare AI capstone project to a panel',
    ],
    careers: [
      'Hospital Administrator',
      'Operations Executive',
      'Front Office / OP Manager',
      'Quality & NABH Coordinator',
      'Insurance & TPA Executive',
      'Medical Records Officer',
      'Healthcare Analyst',
      'Patient Experience Manager',
    ],
    highlights: [
      { label: 'Duration', value: '1 Year' },
      { label: 'Modules', value: '7' },
      { label: 'Chapters', value: '60' },
      { label: 'Mode', value: 'Classroom only' },
    ],
    modules: [
      moduleIntroduction,
      moduleAdministrative,
      moduleManagement,
      moduleAi,
      modulePublicHealth,
      moduleAnalytics,
      moduleServiceRisk,
    ],
  },
  {
    slug: 'diploma-hospital-administration',
    title: 'Diploma in Hospital Administration',
    shortTitle: 'Diploma in Hospital Administration',
    duration: '6 Months',
    level: 'Diploma',
    summary:
      'The fastest route into a hospital admin role — 38 chapters across four modules, covering operations, administration, management and healthcare AI.',
    intro:
      'Six months of classroom training for anyone who wants to be working in a hospital by the end of the year. It covers the same first four modules as the PG Diploma: how hospitals and their departments actually work, the administrative services that support them, core management theory, and the information systems and AI tools now standard in Indian hospitals. Taught in person in Kochi, with the same hospital exposure and placement support as the one-year program.',
    featured: true,
    eligibility: [
      'Plus Two (+2) or any degree',
      'Nursing, paramedical and life-science backgrounds welcome',
      'Freshers and career-changers both accepted',
    ],
    outcomes: [
      'Handle front office, OP and IP desk operations from day one',
      'Maintain hospital records and documentation to audit standard',
      'Support quality, safety and infection-control routines on the floor',
      'Process insurance and TPA paperwork accurately',
      'Use a Hospital Information System for admissions, billing and discharge',
    ],
    careers: [
      'Hospital Administration Executive',
      'Front Office Executive',
      'OP / IP Coordinator',
      'Insurance Desk Executive',
      'Medical Records Assistant',
      'Patient Relations Executive',
    ],
    highlights: [
      { label: 'Duration', value: '6 Months' },
      { label: 'Modules', value: '4' },
      { label: 'Chapters', value: '38' },
      { label: 'Mode', value: 'Classroom only' },
    ],
    modules: [moduleIntroduction, moduleAdministrative, moduleManagement, moduleAi],
  },
];

export interface AddOn {
  title: string;
  description: string;
  icon: 'interview' | 'english' | 'tally';
}

export const addOns: AddOn[] = [
  {
    title: 'Interview Training',
    description:
      'Mock interviews with real hospital HR panels, resume clinics and group-discussion practice — run in the classroom until you stop being nervous.',
    icon: 'interview',
  },
  {
    title: 'Spoken English',
    description:
      'Daily speaking practice built for hospital settings: patient interaction, telephone etiquette, handover language and confident presentation.',
    icon: 'english',
  },
  {
    title: 'Tally & GST',
    description:
      'Hands-on Tally ERP 9 and GST fundamentals on lab systems — the billing and accounts skills hospital finance desks ask for.',
    icon: 'tally',
  },
];

/** Every enrolled student gets the add-on programs at no extra cost. */
export const addOnNote = 'Included free with both diploma programs.';

export function getCourse(slug: string): Course | undefined {
  return courses.find((course) => course.slug === slug);
}

export function chapterCount(course: Course): number {
  return course.modules.reduce((total, module) => total + module.chapters.length, 0);
}
