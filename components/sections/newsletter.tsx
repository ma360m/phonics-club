'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Mail, ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function Newsletter() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setIsSubmitted(true)
      setTimeout(() => {
        setIsSubmitted(false)
        setEmail('')
      }, 3000)
    }
  }

  return (
    <section className="py-20 bg-gradient-to-br from-[#1D4ED8] to-[#60A5FA] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="w-16 h-16 mx-auto mb-6 bg-white/10 rounded-2xl flex items-center justify-center">
            <Mail className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Stay Updated
          </h2>
          <p className="text-white/80 mb-8">
            Subscribe to our newsletter and get exclusive access to new courses, special offers, and expert insights delivered to your inbox.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <div className="relative flex-1">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 pl-4 pr-4 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl focus:bg-white/20 focus:border-white/40"
                required
              />
            </div>
            <Button 
              type="submit"
              size="lg"
              className={`h-14 px-8 rounded-xl font-semibold transition-all ${
                isSubmitted 
                  ? 'bg-green-500 hover:bg-green-500'
                  : 'bg-[#FBBF24] hover:bg-[#FBBF24]/90 text-[#111827]'
              }`}
            >
              {isSubmitted ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Subscribed!
                </>
              ) : (
                <>
                  Subscribe
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          <p className="text-white/60 text-sm mt-4">
            No spam, unsubscribe at any time. By subscribing you agree to our Privacy Policy.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
