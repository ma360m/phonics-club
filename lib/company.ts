export const COMPANY = {
  name: 'Phonics Club Pvt Ltd',
  legalName: 'Phonics Club Private Limited',
  founded: 2015,
  tagline: 'Promoting Synthetic Phonics in Pakistan and abroad',
  description:
    'Phonics Club Pvt Ltd is a registered organization dedicated to promoting the Synthetic Phonics teaching principles which empower children to apply taught knowledge and skills to their independent reading, writing and spellings. This is achievable only when a teacher has full confidence of knowledge. Phonics Club offers training, support and consultancy to ensure effective language instruction.',
  email: 'info@phonicsclub.com',
  adminEmail: 'phonicsclub@gmail.com',
  emails: ['info@phonicsclub.com', 'phonicsclub@gmail.com'],
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

export const COMPANY_BANK_DETAILS = {
  bankName: 'Allied Bank',
  accountTitle: 'Phonics Club Consultancy',
  accountNumber: '0010033565850013',
  iban: 'PK76ABPA0010033565850013',
  instructions:
    'Other payment options: Standard Chartered, title Fatima Tuz Zahra, account 001917781701. JazzCash and EasyPaisa: 03084432015, Fatima Tuz Zahra. Upload your payment receipt after transfer.',
} as const

export const TRAINING_MONTHS_2026 = [
  { value: '2026-08', label: 'August 2026' },
  { value: '2026-09', label: 'September 2026' },
  { value: '2026-10', label: 'October 2026' },
  { value: '2026-11', label: 'November 2026' },
  { value: '2026-12', label: 'December 2026' },
] as const

export const TRAINING_CALENDAR_2026 = [
  { title: 'Jolly Phonics', date: '2026-08-08', season: 'August Cohort', type: 'onsite' as const },
  { title: 'Jolly Literacy Training', date: '2026-08-22', season: 'August Cohort', type: 'onsite' as const },
  { title: 'Jolly Phonics', date: '2026-09-12', season: 'September Cohort', type: 'onsite' as const },
  { title: 'Jolly Literacy Training', date: '2026-10-10', season: 'October Cohort', type: 'onsite' as const },
]

export const ONLINE_WEBINARS = [
  { title: 'Learning to Read & Write', date: '2026-08-15', status: 'open' },
  { title: 'Synthetic Phonics for Early Years', date: '2026-09-05', status: 'open' },
  { title: 'Jolly Literacy Training Webinar', date: '2026-10-17', status: 'upcoming' },
  { title: 'Supporting Struggling Readers', date: '2026-11-14', status: 'upcoming' },
]

export const CERTIFIED_TRAINERS = [
  'Fatima Tuz Zahra',
  'Anum Zehra Zaidi',
  'Zaibunnissa Sadozai',
  'Tahira Sheikh',
  'Tamkanat Zafar',
  'Fatemah Imran',
  'Erum Tehreem',
  'Sadaf Asif',
  'Ambreen Owais',
  'Sonia Saleem',
]

export const LATEST_NEWS = {
  title: 'NOC of Jolly Learning Books',
  body: `Almost all the books are now approved from PCTB (with little or no editing) and Phonics Club has acquired or is in the process of acquiring NOCs of relevant text books and SRM. School administration, distributors and shop keepers are advised not to buy from unauthorized points as some books are modified as per PCTB instructions. Phonics Club will not take any responsibility of materials if purchased through other dealers or supply markets. If you have purchased books before the NOCs or have any previous stock purchased from us, claim your QR code stickers as soon as possible. Approved list of books is also available for review on PCTB website.`,
}

export const WEEKLY_PLAN = [
  { day: 'Day 1', activity: 'Phonics lesson from Pupil/Literacy books' },
  { day: 'Day 2', activity: 'Literacy lesson from Pupil/Literacy books' },
  { day: 'Day 3', activity: 'Reading comprehension from the reading scheme' },
  { day: 'Day 4', activity: 'Independent writing' },
  { day: 'Day 5', activity: 'Review and assessment' },
]
