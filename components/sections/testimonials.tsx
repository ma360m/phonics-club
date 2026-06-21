'use client'

import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'
import type { Testimonial } from '@/lib/site-content'

export function Testimonials({ items }: { items: Testimonial[] }) {
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
            Trusted by educators across Pakistan who use Phonics Club materials and training
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            >
              <Quote className="absolute top-4 right-4 w-8 h-8 text-[#60A5FA]/20" />
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-[#FBBF24] fill-[#FBBF24]" />
                ))}
              </div>
              <p className="text-white/80 mb-6 leading-relaxed">&ldquo;{testimonial.content}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1D4ED8] to-[#60A5FA] flex items-center justify-center text-white font-bold">
                  {testimonial.author.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-white">{testimonial.author}</p>
                  <p className="text-sm text-white/60">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
