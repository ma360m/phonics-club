import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, Home, Mail, ShoppingBag } from 'lucide-react'
import { AnnouncementBar, Footer, Navbar } from '@/components/layout'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: "Page Not Found | Phonics Club",
  robots: {
    index: false,
    follow: false,
  },
}

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <AnnouncementBar />
      <Navbar />
      <section className="mx-auto flex max-w-5xl flex-col items-center px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-24">
        <div className="relative h-28 w-36 sm:h-36 sm:w-48">
          <Image
            src="/logo.png"
            alt="Phonics Club logo"
            fill
            sizes="192px"
            className="object-contain"
            priority
            unoptimized
          />
        </div>
        <p className="mt-8 text-sm font-semibold uppercase tracking-wide text-[#1D4ED8]">404</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-normal text-[#0F172A] sm:text-5xl">
          Oops! This page couldn&apos;t be found.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
          The page may have moved while we upgraded Phonics Club.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild className="rounded-xl bg-[#1D4ED8]">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go to Home
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white">
            <Link href="/courses">
              <BookOpen className="mr-2 h-4 w-4" />
              Browse Courses
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white">
            <Link href="/shop">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Visit Shop
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white">
            <Link href="/contact">
              <Mail className="mr-2 h-4 w-4" />
              Contact Us
            </Link>
          </Button>
        </div>
      </section>
      <Footer />
    </main>
  )
}
