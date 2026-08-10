'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, Contact, FileText, GraduationCap, Info, Search, ShoppingBag } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { PRIMARY_SITE_LINKS } from '@/lib/primary-site-links'

const searchTargets = [
  {
    value: 'shop',
    label: 'Shop',
    href: '/shop',
    icon: ShoppingBag,
    hint: 'Books, readers, workbooks, kits, ISBNs',
  },
  {
    value: 'courses',
    label: 'Courses',
    href: '/courses',
    icon: BookOpen,
    hint: 'Courses, stages, teachers, topics',
  },
  {
    value: 'blog',
    label: 'Blog',
    href: '/blog',
    icon: FileText,
    hint: 'Tips, news, teaching articles',
  },
] as const

const quickLinks = [
  { ...PRIMARY_SITE_LINKS[0], icon: ShoppingBag },
  { ...PRIMARY_SITE_LINKS[1], icon: GraduationCap },
  { ...PRIMARY_SITE_LINKS[2], icon: BookOpen },
  { ...PRIMARY_SITE_LINKS[3], icon: Info },
  { ...PRIMARY_SITE_LINKS[4], icon: Contact },
]

type SearchTarget = (typeof searchTargets)[number]['value']

export function HeaderSearchDialog({
  className,
  showLabel = false,
}: {
  className?: string
  showLabel?: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [target, setTarget] = useState<SearchTarget>('shop')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [open])

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanQuery = query.trim()
    if (!cleanQuery) {
      inputRef.current?.focus()
      return
    }

    const selectedTarget = searchTargets.find((item) => item.value === target) ?? searchTargets[0]
    router.push(`${selectedTarget.href}?q=${encodeURIComponent(cleanQuery)}`)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn('p-2 hover:bg-muted rounded-lg transition-colors', className)}
          aria-label="Open search"
        >
          <Search className="w-5 h-5 text-foreground/70" />
          {showLabel ? <span>Search</span> : null}
        </button>
      </DialogTrigger>
      <DialogContent className="gap-5 rounded-2xl border-slate-200 p-5 shadow-2xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#0F172A]">Search Phonics Club</DialogTitle>
          <DialogDescription>
            Search products, courses, or practical teaching articles.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submitSearch} className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Type what you need..."
              className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-base text-[#0F172A] outline-none transition-colors focus:border-[#60A5FA] focus:ring-2 focus:ring-[#60A5FA]/30"
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {searchTargets.map((item) => {
              const Icon = item.icon
              const selected = target === item.value
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setTarget(item.value)}
                  aria-pressed={selected}
                  className={cn(
                    'rounded-2xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]',
                    selected
                      ? 'border-[#1D4ED8] bg-[#EFF6FF] text-[#1D4ED8]'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-[#BFDBFE] hover:bg-[#F8FAFC]',
                  )}
                >
                  <span className="flex items-center gap-2 text-sm font-bold">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">{item.hint}</span>
                </button>
              )
            })}
          </div>

          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#D30000] px-5 text-sm font-bold text-white transition-colors hover:bg-[#B80000] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FCA5A5] focus-visible:ring-offset-2"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
        </form>

        <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-normal text-slate-500">Quick links</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {quickLinks.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-[#0F172A] ring-1 ring-slate-200 transition-colors hover:text-[#1D4ED8] hover:ring-[#BFDBFE]"
                >
                  <Icon className="h-4 w-4 text-[#1D4ED8]" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
