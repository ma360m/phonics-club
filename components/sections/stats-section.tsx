'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import { Users, BookOpen, Award, Globe } from 'lucide-react'

const stats = [
  { label: 'Active Students', value: 50000, suffix: '+', icon: Users },
  { label: 'Courses Available', value: 200, suffix: '+', icon: BookOpen },
  { label: 'Expert Instructors', value: 150, suffix: '+', icon: Award },
  { label: 'Countries Reached', value: 120, suffix: '+', icon: Globe },
]

function AnimatedNumber({ value, suffix }: { value: number; suffix: string }) {
  const [displayValue, setDisplayValue] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (isInView) {
      const duration = 2000
      const startTime = Date.now()
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const easeOut = 1 - Math.pow(1 - progress, 3)
        setDisplayValue(Math.floor(easeOut * value))
        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      requestAnimationFrame(animate)
    }
  }, [isInView, value])

  return (
    <span ref={ref}>
      {displayValue.toLocaleString()}{suffix}
    </span>
  )
}

export function StatsSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-sm font-semibold text-[#1D4ED8] uppercase tracking-wider">
            Our Impact
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-[#111827] mt-2">
            Numbers That Speak
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative text-center p-6 rounded-2xl bg-gradient-to-br from-[#F8FAFC] to-white border border-[#E2E8F0]"
            >
              <div className="w-14 h-14 mx-auto mb-4 bg-[#1D4ED8]/10 rounded-xl flex items-center justify-center">
                <stat.icon className="w-7 h-7 text-[#1D4ED8]" />
              </div>
              <p className="text-3xl lg:text-4xl font-bold text-[#111827] mb-2">
                <AnimatedNumber value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-sm text-[#475569]">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
