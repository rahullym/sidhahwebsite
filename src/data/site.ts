export const site = {
  name: 'Sidhah',
  legalName: 'Sidhah Edutech',
  tagline: 'Discover a new way',
  description:
    'Classroom-only hospital administration training in Kochi, Kerala. Small in-person batches, hands-on hospital exposure and placement support.',
  url: 'https://www.sidhah.com',
} as const;

export const contact = {
  phone: '+91 7012644182',
  phoneHref: 'tel:+917012644182',
  /** wa.me needs the bare international number: country code + number, no +, spaces or dashes. */
  whatsappNumber: '917012644182',
  email: 'hr.sidhah@gmail.com',
  emailHref: 'mailto:hr.sidhah@gmail.com',
  instagram: 'sidhah.edutech',
  instagramHref: 'https://www.instagram.com/sidhah.edutech',
  linkedinHref: 'https://www.linkedin.com/company/sidhah-edutech',
  facebookHref: 'https://www.facebook.com/p/Sidhah-Edutech-61550895406369/',
  campus: {
    name: 'Sidhah Edutech',
    /** The single location string used everywhere on the site. */
    full: 'Kochi, Kerala, India',
    city: 'Kochi',
    state: 'Kerala',
    country: 'India',
    mapsHref: 'https://www.google.com/maps/search/?api=1&query=Kochi%2C+Kerala%2C+India',
  },
  hours: [
    { days: 'Monday – Saturday', time: '9:30 AM – 6:00 PM' },
    { days: 'Sunday', time: 'Closed' },
  ],
} as const;

/** Every profile we link out to — also fed to the organisation schema's sameAs. */
export const socials = [
  { label: 'Instagram', handle: `@${contact.instagram}`, href: contact.instagramHref, icon: 'instagram' },
  { label: 'LinkedIn', handle: site.legalName, href: contact.linkedinHref, icon: 'linkedin' },
  { label: 'Facebook', handle: site.legalName, href: contact.facebookHref, icon: 'facebook' },
] as const;

/** Builds a WhatsApp deep link with a prefilled message. */
export function whatsappHref(message: string): string {
  return `https://wa.me/${contact.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export const nav = [
  { label: 'Home', href: '/' },
  { label: 'Programs', href: '/courses/' },
  { label: 'Placements', href: '/placements/' },
  { label: 'Campus', href: '/campus/' },
  { label: 'About', href: '/about/' },
  { label: 'Contact', href: '/contact/' },
] as const;
