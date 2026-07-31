'use client'

import { motion } from 'framer-motion'
import { ChevronDown, Quote, Star, ZoomIn } from 'lucide-react'

type OfficialLetter = {
  id: string
  school: string
  campus?: string
  content: string[]
  spokesperson: string
  role: string
  organization?: string
  imageSrc: string
  imageLabel: string
}

const officialLetters: OfficialLetter[] = [
  {
    id: 'punjab-education-foundation',
    school: 'PUNJAB EDUCATION FOUNDATION',
    content: [
      'On behalf of Punjab Education Foundation, I would like to extend my heartiest congratulation on your valuable contribution of providing Jolly Phonics learning material to 6 PEF schools. We look forward for more opportunities like this in future.',
    ],
    spokesperson: 'Dr. Aneela Salman',
    role: 'Managing Director',
    imageSrc: '/images/letters/letter%202.jpg',
    imageLabel: 'Letter 2',
  },
  {
    id: 'magrudys-education-services',
    school: "Magrudy's",
    campus: 'Education Services',
    content: [
      'The workshop was interactive, highly informative and delivered to a very high standard and we believe the participants were involved and engaged throughout.',
      'We appreciate you sharing your Jolly Phonics expertise and we look forward to the opportunity of working with you again for future Jolly Phonics workshops in the UAE.',
    ],
    spokesperson: 'Faye Roberts',
    role: 'Educational Consultant',
    organization: "Magrudy's Education Services",
    imageSrc: '/images/letters/letter%206.jpg',
    imageLabel: "Magrudy's Education Services letter",
  },
  {
    id: 'lahore-grammar-school-junior-girls-campus',
    school: 'LAHORE GRAMMAR SCHOOL',
    campus: 'Junior Girls Campus',
    content: [
      'The activities taught to be used in classes were very innovative and appear useful.',
      'We have found the programme to be the first of its kind in Lahore. We are optimistic our teachers will be better equipped to teach phonics in a more interactive manner.',
    ],
    spokesperson: 'Rishm Najm',
    role: 'Literacy Coordinator',
    imageSrc: '/images/letters/letter3.jpg',
    imageLabel: 'Lahore Grammar School Junior Girls Campus letter',
  },
]

const allLetterImages = [
  { src: '/images/letters/letter.jpg', label: 'Official letter' },
  { src: '/images/letters/letter%202.jpg', label: 'Punjab Education Foundation letter' },
  { src: '/images/letters/leter%203.jpg', label: 'Official letter' },
  { src: '/images/letters/letter%204.jpg', label: 'Official letter' },
  { src: '/images/letters/letter%205.jpg', label: 'Official letter' },
  { src: '/images/letters/letter%206.jpg', label: "Magrudy's Education Services letter" },
  { src: '/images/letters/letter2.jpg', label: 'Official letter' },
  { src: '/images/letters/letter3.jpg', label: 'Lahore Grammar School letter' },
  { src: '/images/letters/letttt2.jpg', label: 'Official letter' },
]

export function Testimonials() {
  return (
    <section className="py-20 bg-[#0F172A] text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-sm font-semibold text-[#60A5FA] uppercase tracking-wider">Testimonials</span>
          <h2 className="text-3xl lg:text-4xl font-bold mt-2 mb-4">What Schools & Teachers Say</h2>
          <p className="text-white/70 max-w-2xl mx-auto">
            Official Jolly Learning resources, trusted nationwide.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {officialLetters.map((letter, index) => (
            <motion.div
              key={letter.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative flex flex-col bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            >
              <Quote className="absolute top-4 right-4 w-8 h-8 text-[#60A5FA]/20" />
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-[#FBBF24] fill-[#FBBF24]" />
                ))}
              </div>
              <div className="mb-4 pr-8">
                <h3 className="text-lg font-bold text-white">{letter.school}</h3>
                {letter.campus && <p className="mt-1 text-sm text-[#BFDBFE]">{letter.campus}</p>}
              </div>
              <div className="mb-6 space-y-4 text-white/80 leading-relaxed">
                {letter.content.map((paragraph) => (
                  <p key={paragraph}>&ldquo;{paragraph}&rdquo;</p>
                ))}
              </div>
              <div className="mt-auto flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1D4ED8] to-[#60A5FA] flex items-center justify-center text-white font-bold">
                  {letter.spokesperson.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-white">{letter.spokesperson}</p>
                  <p className="text-sm text-white/60">{letter.role}</p>
                  <p className="text-sm text-white/60">{letter.organization ?? letter.school}</p>
                  {letter.campus && <p className="text-xs text-white/50">{letter.campus}</p>}
                </div>
              </div>
              <details className="group mt-5 rounded-xl border border-white/10 bg-white/[0.03]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-[#BFDBFE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]">
                  <span>View letter image</span>
                  <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                </summary>
                <div className="border-t border-white/10 p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
                      {letter.imageLabel}
                    </p>
                    <a
                      href={letter.imageSrc}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]"
                      aria-label={`Open ${letter.imageLabel} full size`}
                    >
                      <ZoomIn className="h-3.5 w-3.5" />
                      Full size
                    </a>
                  </div>
                  <img
                    src={letter.imageSrc}
                    alt={`${letter.school}${letter.campus ? ` ${letter.campus}` : ''} testimonial letter`}
                    className="max-h-[560px] w-full rounded-lg border border-white/10 bg-white object-contain"
                    loading="lazy"
                  />
                </div>
              </details>
            </motion.div>
          ))}
        </div>

        <details className="group mx-auto mt-10 max-w-6xl rounded-2xl border border-white/10 bg-white/[0.04]">
          <summary className="flex cursor-pointer list-none items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-bold text-white transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]">
            See more official letters
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="grid gap-4 border-t border-white/10 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {allLetterImages.map((image, index) => (
              <figure key={`${image.src}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <img
                  src={image.src}
                  alt={image.label}
                  className="h-80 w-full rounded-lg bg-white object-contain"
                  loading="lazy"
                />
                <figcaption className="mt-2 flex items-center justify-between gap-3 text-xs text-white/60">
                  <span>{image.label}</span>
                  <a
                    href={image.src}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-[#BFDBFE] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]"
                    aria-label={`Open ${image.label} full size`}
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                    Full size
                  </a>
                </figcaption>
              </figure>
            ))}
          </div>
        </details>
      </div>
    </section>
  )
}
