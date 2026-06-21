'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Code, Palette, TrendingUp, Megaphone, Camera, Database, ArrowRight } from 'lucide-react'

const categories = [
  {
    name: 'Web Development',
    description: 'Build modern websites and applications',
    icon: Code,
    color: '#1D4ED8',
    bgColor: '#1D4ED8/10',
    courses: 45,
    href: '/courses?category=web-development',
  },
  {
    name: 'Design',
    description: 'Create stunning visuals and interfaces',
    icon: Palette,
    color: '#D30000',
    bgColor: '#D30000/10',
    courses: 32,
    href: '/courses?category=design',
  },
  {
    name: 'Business',
    description: 'Master entrepreneurship and strategy',
    icon: TrendingUp,
    color: '#FBBF24',
    bgColor: '#FBBF24/10',
    courses: 28,
    href: '/courses?category=business',
  },
  {
    name: 'Marketing',
    description: 'Grow your audience and brand',
    icon: Megaphone,
    color: '#60A5FA',
    bgColor: '#60A5FA/10',
    courses: 24,
    href: '/courses?category=marketing',
  },
  {
    name: 'Photography',
    description: 'Capture and edit stunning images',
    icon: Camera,
    color: '#1D4ED8',
    bgColor: '#1D4ED8/10',
    courses: 18,
    href: '/courses?category=photography',
  },
  {
    name: 'Data Science',
    description: 'Analyze and visualize data',
    icon: Database,
    color: '#D30000',
    bgColor: '#D30000/10',
    courses: 22,
    href: '/courses?category=data-science',
  },
]

export function FeaturedCategories() {
  return (
    <section className="py-20 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-sm font-semibold text-[#1D4ED8] uppercase tracking-wider">
            Browse Categories
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-[#111827] mt-2 mb-4">
            Explore Our Top Categories
          </h2>
          <p className="text-[#475569] max-w-2xl mx-auto">
            Choose from over 200 courses across various disciplines. Find the perfect course to advance your career.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={category.href}
                className="group block bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-[#E2E8F0] hover:border-[#1D4ED8]/20"
              >
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${category.color}15` }}
                >
                  <category.icon className="w-7 h-7" style={{ color: category.color }} />
                </div>
                <h3 className="font-semibold text-lg text-[#111827] mb-2 group-hover:text-[#1D4ED8] transition-colors">
                  {category.name}
                </h3>
                <p className="text-[#475569] text-sm mb-4">
                  {category.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#475569]">{category.courses} courses</span>
                  <ArrowRight className="w-5 h-5 text-[#1D4ED8] transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
