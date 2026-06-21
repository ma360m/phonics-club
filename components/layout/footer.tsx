import Link from 'next/link'
import Image from 'next/image'
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react'
import { COMPANY } from '@/lib/company'
import { APP_NAME } from '@/lib/constants'

const footerLinks = {
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Certified Trainers', href: '/certified-trainers' },
    { name: 'Blog', href: '/blog' },
    { name: 'Shop', href: '/shop' },
  ],
  support: [
    { name: 'FAQs', href: '/faqs' },
    { name: 'Training', href: '/trainings' },
    { name: 'Consultancy', href: '/consultancy' },
    { name: 'Contact Us', href: '/contact' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Cookie Policy', href: '/cookies' },
    { name: 'Refund Policy', href: '/refunds' },
  ],
  courses: [
    { name: 'Teacher Courses', href: '/courses?category=teacher-courses' },
    { name: 'Phonics', href: '/courses?category=phonics' },
    { name: 'Reading', href: '/courses?category=reading' },
    { name: 'Preschool', href: '/courses?category=preschool' },
  ],
}

const socialLinks = [
  { name: 'Facebook', icon: Facebook, href: COMPANY.social.facebook },
  { name: 'Instagram', icon: Instagram, href: COMPANY.social.instagram },
  { name: 'YouTube', icon: Youtube, href: COMPANY.social.youtube },
]

export function Footer() {
  return (
    <footer className="bg-[#0F172A] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0">
                <Image src="/logo.png" alt={`${APP_NAME} logo`} fill className="object-contain" unoptimized />
              </div>
              <span className="font-bold text-xl">{APP_NAME}</span>
            </Link>
            <p className="text-white/70 mb-6 max-w-sm">
              Premium phonics courses and educational products helping children master reading with confidence.
            </p>

            <div className="space-y-3">
              <a
                href={`mailto:${COMPANY.adminEmail}`}
                className="flex items-center gap-3 text-white/70 hover:text-[#60A5FA] transition-colors"
              >
                <Mail className="w-4 h-4 shrink-0" />
                <span className="text-sm">{COMPANY.adminEmail}</span>
              </a>
              <a
                href={`mailto:${COMPANY.email}`}
                className="flex items-center gap-3 text-white/70 hover:text-[#60A5FA] transition-colors"
              >
                <Mail className="w-4 h-4 shrink-0" />
                <span className="text-sm">{COMPANY.email}</span>
              </a>
              <a
                href={`tel:${COMPANY.phoneIntl}`}
                className="flex items-center gap-3 text-white/70 hover:text-[#60A5FA] transition-colors"
              >
                <Phone className="w-4 h-4 shrink-0" />
                <span className="text-sm">
                  {COMPANY.phoneDisplay}, {COMPANY.phoneAltDisplay}
                </span>
              </a>
              <div className="flex items-center gap-3 text-white/70">
                <MapPin className="w-4 h-4 shrink-0" />
                <span className="text-sm">{COMPANY.address}</span>
              </div>
            </div>
          </div>

          {(['company', 'courses', 'support', 'legal'] as const).map((section) => (
            <div key={section}>
              <h3 className="font-semibold text-sm uppercase tracking-wider mb-4 text-white/90 capitalize">
                {section === 'company' ? 'Company' : section}
              </h3>
              <ul className="space-y-3">
                {footerLinks[section].map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-white/70 hover:text-[#60A5FA] transition-colors text-sm">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/50 text-sm">
              &copy; {new Date().getFullYear()} {COMPANY.name}. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-[#1D4ED8] text-white/70 hover:text-white transition-all"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
