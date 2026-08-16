/**
 * Real placement records taken from Sidhah's own published placement creatives.
 * `kind` matters: some of these are confirmed hospital positions, others are
 * training placements. Do not flatten the two — the distinction is the
 * difference between an honest claim and an inflated one.
 */
export interface Placement {
  /** Also the image filename: src/assets/placements/<slug>.jpg */
  slug: string;
  name: string;
  /** What they studied before Sidhah, when the story is a career pivot. */
  from?: string;
  position: string;
  hospital: string;
  location: string;
  kind: 'placed' | 'training';
  program: string;
}

export const placements: Placement[] = [
  {
    slug: 'farha-mol',
    name: 'Farha Mol',
    from: 'Chemistry',
    position: 'Corporate Department',
    hospital: 'Lakeshore Hospital',
    location: 'Kochi, Kerala',
    kind: 'placed',
    program: 'Hospital Administration',
  },
  {
    slug: 'anna-jacob',
    name: 'Anna Jacob',
    from: 'Teaching',
    position: 'Front Office Administrator',
    hospital: 'Najath Hospital',
    location: 'Kochi, Kerala',
    kind: 'placed',
    program: 'Hospital Administration',
  },
  {
    slug: 'sajishna-ps',
    name: 'Sajishna P.S',
    position: 'Medical Records Department',
    hospital: 'Don Bosco Hospital',
    location: 'Kochi, Kerala',
    kind: 'placed',
    program: 'Hospital Administration',
  },
  {
    slug: 'anupriya-k',
    name: 'Anupriya K',
    position: 'Out Patient Department',
    hospital: 'Don Bosco Hospital',
    location: 'Kochi, Kerala',
    kind: 'placed',
    program: 'Hospital Administration',
  },
  {
    slug: 'mohammed-naife',
    name: 'Mohammed Naife',
    from: 'Electronics',
    position: 'HR Trainee',
    hospital: 'Lakeshore Hospital',
    location: 'Kochi, Kerala',
    kind: 'training',
    program: 'Hospital Administration',
  },
  {
    slug: 'rinshitha-ks',
    name: 'Rinshitha KS',
    from: 'Economics',
    position: 'HR Trainee',
    hospital: 'Lakeshore Hospital',
    location: 'Kochi, Kerala',
    kind: 'training',
    program: 'Hospital Administration',
  },
];

/** Hospitals that have taken Sidhah students, derived so it can never drift. */
export const hiringHospitals = [...new Set(placements.map((p) => p.hospital))];

export interface VideoTestimonial {
  /** YouTube video ID — the part after `v=`, e.g. dQw4w9WgXcQ */
  youtubeId: string;
  name: string;
  role: string;
  /** Pull quote shown beside the player. */
  quote: string;
  /** Optional custom poster in src/assets/gallery; falls back to the YouTube thumbnail. */
  poster?: string;
}

/**
 * Add entries as videos are published. The section hides itself while empty,
 * so shipping with none is safe.
 */
export const videoTestimonials: VideoTestimonial[] = [];

export interface Accreditation {
  name: string;
  full: string;
  /** src/assets/logos/<slug>.png */
  slug: string;
}

export const accreditations: Accreditation[] = [
  { slug: 'msme', name: 'MSME', full: 'Ministry of Micro, Small & Medium Enterprises' },
  { slug: 'tssr-council', name: 'TSSR Council', full: 'Technical Study & Skill Research Council' },
  { slug: 'learn-curve', name: 'Learn Curve', full: 'Learn Curve Innovations & Technology' },
  { slug: 'iso-9001', name: 'ISO 9001', full: 'ISO 9001 Certified' },
];

export const graduation = {
  batch: '2024 – 2025',
  title: 'Professional Diploma in Hospital Administration',
  caption:
    'Graduation ceremony for the 2024–25 batch, with certificates issued through the TSSR Council.',
};
