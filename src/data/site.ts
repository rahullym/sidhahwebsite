export const site = {
  name: 'Sidhah',
  legalName: 'Sidhah Edutech',
  tagline: 'Discover a new way',
  description:
    'Classroom-only hospital administration training at Infopark, Kochi. Small in-person batches, hands-on hospital exposure and placement support.',
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
  campus: {
    name: 'Sidhah Edutech — Infopark Campus',
    line1: 'Geo Infopark, 2nd Floor',
    line2: 'Infopark Expressway, near South Gate',
    city: 'Kakkanad, Ernakulam',
    state: 'Kerala',
    pincode: '682030',
    mapsHref:
      'https://www.google.com/maps/search/?api=1&query=Geo+Infopark+Infopark+Expressway+Kakkanad+Kerala+682030',
  },
  hours: [
    { days: 'Monday – Saturday', time: '9:30 AM – 6:00 PM' },
    { days: 'Sunday', time: 'Closed' },
  ],
} as const;

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
