'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, ExternalLink } from 'lucide-react'
import type { VortexLearning } from '@/lib/site-content'

export function VortexLearningSection({ data }: { data: VortexLearning }) {
  return (
    <section className="py-20 bg-gradient-to-br from-[#0F172A] to-[#1e3a5f] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-sm font-semibold text-[#60A5FA] uppercase tracking-wider">Partnership</span>
          <h2 className="text-3xl lg:text-4xl font-bold mt-2 mb-4">{data.title}</h2>
          <p className="text-white/80 max-w-3xl mx-auto leading-relaxed">{data.description}</p>
          <a
            href={data.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 text-[#60A5FA] hover:underline"
          >
            Visit Vortex Learning <ExternalLink className="w-4 h-4" />
          </a>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-6">
          {data.courses.map((course, index) => (
            <motion.div
              key={course.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={course.href}
                className="block bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/10 hover:border-[#60A5FA]/50 transition-colors h-full"
              >
                <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                <p className="text-white/70 text-sm mb-4">{course.description}</p>
                <span className="text-[#60A5FA] text-sm flex items-center gap-1">
                  Learn more <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
