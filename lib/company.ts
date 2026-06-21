export const COMPANY = {
  name: 'Phonics Club Pvt Ltd',
  legalName: 'Phonics Club Private Limited',
  founded: 2015,
  tagline: 'Promoting Synthetic Phonics in Pakistan and abroad',
  description:
    'Phonics Club Pvt Ltd is a registered organization dedicated to promoting the Synthetic Phonics teaching principles which empower children to apply taught knowledge and skills to their independent reading, writing and spellings. This is achievable only when a teacher has full confidence of knowledge. Phonics Club offers training, support and consultancy to ensure effective language instruction.',
  email: 'info@phonicsclub.com',
  adminEmail: 'phonicscclub@gmail.com',
  emails: ['info@phonicsclub.com', 'phonicscclub@gmail.com'],
  phone: '03008079480',
  phoneAlt: '03022220448',
  phoneDisplay: '+92 300 8079480',
  phoneAltDisplay: '+92 3022220448',
  phoneIntl: '+923008079480',
  phoneAltIntl: '+923022220448',
  whatsapp: '923008079480',
  address: 'Pakistan, LHR',
  website: 'https://www.phonicsclub.com',
  social: {
    facebook: 'https://www.facebook.com/phonicsclub/',
    youtube: 'https://youtu.be/8Tjs_Z1I0cM?si=vSIngyjXIj7kF1EF',
    instagram: 'https://www.instagram.com/phonics.club/',
  },
} as const

export const TRAINING_CALENDAR_2025 = [
  { title: 'Jolly Phonics', date: '2025-02-15', season: 'Spring/Winter', type: 'onsite' as const },
  { title: 'Jolly Grammar', date: '2025-02-22', season: 'Spring/Winter', type: 'onsite' as const },
  { title: 'Jolly Phonics', date: '2025-08-02', season: 'Summer/Fall', type: 'onsite' as const },
  { title: 'Jolly Grammar', date: '2025-08-09', season: 'Summer/Fall', type: 'onsite' as const },
]

export const ONLINE_WEBINARS = [
  { title: 'Jolly Phonics Webinar – Spring 2025', date: '2025-03-01', status: 'open' },
  { title: 'Jolly Grammar Webinar – Spring 2025', date: '2025-03-08', status: 'open' },
  { title: 'Classroom Implementation Masterclass', date: '2025-06-15', status: 'upcoming' },
]

export const CERTIFIED_TRAINERS = [
  'Fatima Tuz Zahra',
  'Anum Zehra Zaidi',
  'Erum Tehreem',
  'Zaibunnissa Sadozai',
  'Tahira Sheikh',
]

export const LATEST_NEWS = {
  title: 'NOC of Jolly Learning Books',
  body: `Almost all the books are now approved from PCTB (with little or no editing) and Phonics Club has acquired or is in the process of acquiring NOCs of relevant text books and SRM. School administration, distributors and shop keepers are advised not to buy from unauthorized points as some books are modified as per PCTB instructions. Phonics Club will not take any responsibility of materials if purchased through other dealers or supply markets. If you have purchased books before the NOCs or have any previous stock purchased from us, claim your QR code stickers as soon as possible. Approved list of books is also available for review on PCTB website.`,
}

export const WEEKLY_PLAN = [
  { day: 'Day 1', activity: 'Phonics lesson from Pupil/Grammar books' },
  { day: 'Day 2', activity: 'Grammar lesson from Pupil/Grammar books' },
  { day: 'Day 3', activity: 'Reading Comprehension from reading scheme' },
  { day: 'Day 4', activity: 'Independent writing' },
  { day: 'Day 5', activity: 'Review and assessment' },
]
