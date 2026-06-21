'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Play, Star, Users, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#F8FAFC] via-white to-[#60A5FA]/10">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-[#1D4ED8]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-[#FBBF24]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1D4ED8]/10 rounded-full mb-6">
              <span className="w-2 h-2 bg-[#1D4ED8] rounded-full animate-pulse" />
              <span className="text-sm font-medium text-[#1D4ED8]">PHONICS CLUB — Learn to read with confidence</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#111827] leading-tight mb-6">
              Master{' '}
              <span className="text-[#1D4ED8]">Phonics</span>
              <br />
              Build Lifelong
              <br />
              <span className="relative">
                Reading Skills
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                  <path d="M2 10C50 4 150 4 198 10" stroke="#FBBF24" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p className="text-lg text-[#475569] mb-8 max-w-lg">
              Premium phonics courses, workbooks, and tools trusted by parents and educators. Start your child&apos;s reading journey today.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Button asChild size="lg" className="bg-[#D30000] hover:bg-[#D30000]/90 text-white px-8 h-14 text-base">
                <Link href="/courses">
                  Explore Courses
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 text-base border-[#1D4ED8] text-[#1D4ED8] hover:bg-[#1D4ED8]/5">
                <Link href="/about">
                  <Play className="mr-2 w-5 h-5" />
                  Watch Demo
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#1D4ED8]/10 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-[#1D4ED8]" />
                </div>
                <div>
                  <p className="font-bold text-xl text-[#111827]">50K+</p>
                  <p className="text-sm text-[#475569]">Students</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#FBBF24]/10 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-[#FBBF24]" />
                </div>
                <div>
                  <p className="font-bold text-xl text-[#111827]">200+</p>
                  <p className="text-sm text-[#475569]">Courses</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#D30000]/10 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-[#D30000]" />
                </div>
                <div>
                  <p className="font-bold text-xl text-[#111827]">4.9</p>
                  <p className="text-sm text-[#475569]">Rating</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Content - Hero Image/Cards */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative">
              {/* Main Card */}
              <div className="bg-white rounded-3xl shadow-2xl p-6 lg:p-8">
                <div className="aspect-video bg-gradient-to-br from-[#1D4ED8] to-[#60A5FA] rounded-2xl mb-6 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 text-white fill-white" />
                  </div>
                </div>
                <h3 className="font-bold text-lg text-[#111827] mb-2">Complete Web Development Bootcamp</h3>
                <p className="text-[#475569] text-sm mb-4">Master modern web development from scratch</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-[#FBBF24] fill-[#FBBF24]" />
                    ))}
                    <span className="text-sm text-[#475569] ml-1">(2,547)</span>
                  </div>
                  <span className="font-bold text-[#1D4ED8]">$99</span>
                </div>
              </div>

              {/* Floating Card - Students */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="absolute -left-4 lg:-left-8 top-1/4 bg-white rounded-2xl shadow-xl p-4 border border-[#E2E8F0]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1D4ED8] to-[#60A5FA] border-2 border-white" />
                    ))}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-[#111827]">+2.5k</p>
                    <p className="text-xs text-[#475569]">Enrolled Today</p>
                  </div>
                </div>
              </motion.div>

              {/* Floating Card - Certificate */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="absolute -right-4 lg:-right-8 bottom-1/4 bg-white rounded-2xl shadow-xl p-4 border border-[#E2E8F0]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#FBBF24]/10 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#FBBF24]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-[#111827]">Certified</p>
                    <p className="text-xs text-[#475569]">Get Certificate</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
