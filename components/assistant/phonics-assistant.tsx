'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, X, Send, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { STARTER_SUGGESTIONS } from '@/lib/assistant/engine'
import { COMPANY } from '@/lib/company'
import {
  DEFAULT_CONTACT_SETTINGS,
  type ContactSettings,
} from '@/lib/contact-settings'

type Message = { role: 'user' | 'assistant'; text: string }

function renderText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    const lines = part.split('\n')
    return lines.map((line, j) => {
      const linkMatch = line.match(/(\/[\w\-/?=&%]+)/)
      if (linkMatch) {
        const [before, after] = line.split(linkMatch[0])
        return (
          <span key={`${i}-${j}`}>
            {before}
            <Link href={linkMatch[0]} className="text-[#1D4ED8] underline font-medium">
              {linkMatch[0]}
            </Link>
            {after}
            {j < lines.length - 1 && <br />}
          </span>
        )
      }
      return (
        <span key={`${i}-${j}`}>
          {line}
          {j < lines.length - 1 && <br />}
        </span>
      )
    })
  })
}

export function PhonicsAssistant({
  contactSettings = DEFAULT_CONTACT_SETTINGS,
}: {
  contactSettings?: ContactSettings
}) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: `Welcome to ${COMPANY.name}! I'm your AI Course & Product Advisor. Ask about courses, Jolly Phonics books, training, Vortex Learning, payments, refunds, pricing, or enrollment.`,
    },
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  async function sendMessage(text: string) {
    if (!text.trim() || typing) return
    const userText = text.trim()
    setInput('')
    setMessages((m) => [...m, { role: 'user', text: userText }])
    setTyping(true)

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText }),
      })
      const data = await res.json()
      const reply = data.reply ?? data.error ?? 'Sorry, I could not process that. Try again or contact us on WhatsApp.'
      await new Promise((r) => setTimeout(r, 400))
      setMessages((m) => [...m, { role: 'assistant', text: reply }])
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: `Connection issue. Contact us: ${contactSettings.phoneDisplay} or ${COMPANY.adminEmail}` },
      ])
    } finally {
      setTyping(false)
    }
  }

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-3 right-3 z-40 flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/20 bg-gradient-to-br from-[#1D4ED8] to-[#1e40af] text-white shadow-2xl hover:from-[#1D4ED8]/90 sm:bottom-4 sm:right-4 sm:h-16 sm:w-16"
        aria-label="Open AI assistant"
      >
        <Bot className="h-6 w-6 sm:h-8 sm:w-8" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-3 z-50 flex h-[min(75vh,560px)] w-[min(100vw-1.25rem,420px)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:bottom-24 sm:right-4 sm:w-[min(100vw-2rem,420px)]"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#1D4ED8] to-[#2563eb] text-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-sm block">PHONICS CLUB AI</span>
                  <span className="text-xs text-white/80">Course Advisor - Product Guide - Support</span>
                </div>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close" className="hover:bg-white/10 rounded-lg p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {messages.length <= 1 && (
              <div className="px-3 pt-3 flex flex-wrap gap-2">
                {STARTER_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-[#1D4ED8]/10 hover:text-[#1D4ED8] border transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`max-w-[92%] px-3 py-2.5 rounded-2xl ${
                    msg.role === 'user'
                      ? 'ml-auto bg-[#1D4ED8] text-white rounded-br-md'
                      : 'bg-muted text-foreground rounded-bl-md'
                  }`}
                >
                  {msg.role === 'assistant' ? renderText(msg.text) : msg.text}
                </motion.div>
              ))}
              {typing && (
                <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-md w-fit">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-[#1D4ED8]/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-[#1D4ED8]/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-[#1D4ED8]/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="p-3 border-t flex gap-2 bg-background/80 backdrop-blur">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                placeholder="Ask about courses, products, training..."
                className="rounded-xl text-sm"
                disabled={typing}
              />
              <Button
                size="icon"
                onClick={() => sendMessage(input)}
                disabled={typing || !input.trim()}
                className="rounded-xl bg-[#1D4ED8] shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
