'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SiteLogo } from '@/components/layout/site-logo'
import { CurrencySwitcher } from '@/components/currency/currency-switcher'
import { HeaderSearchDialog } from '@/components/layout/header-search-dialog'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Shop', href: '/shop' },
  { name: 'Online Courses', href: '/courses' },
  { name: 'Training', href: '/trainings' },
  { name: 'Newsletters', href: '/newsletters' },
  { name: 'About', href: '/about' },
  { name: 'Research', href: '/research' },
  { name: 'FAQs', href: '/faqs' },
  { name: 'Contact', href: '/contact' },
]

const mobileUtilityLinks = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Wishlist', href: '/wishlist' },
  { name: 'Cart', href: '/cart' },
]

export function NavbarClient({
  cartSlot,
  wishlistSlot,
}: {
  cartSlot: React.ReactNode
  wishlistSlot?: React.ReactNode
}) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-[70] transition-all duration-300 ${
        isScrolled
          ? 'glass shadow-lg'
          : 'border-b border-transparent bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <SiteLogo />

          <div className="hidden flex-1 items-center justify-center px-4 lg:flex">
            <div className="flex items-center gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="rounded-full border border-transparent px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:border-[#1D4ED8]/30 hover:bg-[#1D4ED8]/5 hover:text-[#1D4ED8]"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CurrencySwitcher className="hidden xl:inline-flex" />
            <HeaderSearchDialog className="hidden sm:inline-flex" />
            <Link href="/dashboard" className="hidden p-2 hover:bg-muted rounded-lg transition-colors sm:inline-flex" aria-label="Account">
              <User className="w-5 h-5 text-foreground/70" />
            </Link>
            <span className="hidden sm:inline-flex">{wishlistSlot}</span>
            <span className="hidden sm:inline-flex">{cartSlot}</span>
            <Button asChild className="hidden h-9 rounded-full bg-[#1D4ED8] px-4 text-xs font-semibold text-white shadow-sm hover:bg-[#1E40AF] 2xl:flex">
              <Link href="/auth/login">
                Sign Up/In
              </Link>
            </Button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background/90 px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted lg:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              Menu
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-border"
            >
              <div className="py-4 space-y-2">
                <div className="px-4 pb-2">
                  <CurrencySwitcher className="w-full justify-center bg-white" />
                </div>
                <div className="px-4 pb-2">
                  <HeaderSearchDialog showLabel className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white py-3 text-sm font-semibold text-[#1D4ED8] shadow-sm" />
                </div>
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 text-base font-medium hover:text-[#1D4ED8] hover:bg-[#1D4ED8]/5 rounded-lg"
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="border-t border-border pt-2">
                  {mobileUtilityLinks.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 text-base font-medium hover:text-[#1D4ED8] hover:bg-[#1D4ED8]/5 rounded-lg"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  )
}
