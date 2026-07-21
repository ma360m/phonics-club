'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { formatCourseCategory } from '@/lib/course-format'
import { cn } from '@/lib/utils'

interface Props {
  filters: {
    q: string
    category: string
    level: string
    duration: string
    price: string
    sort: string
  }
  levels: string[]
}

const filterTabs = [
  { label: 'All Courses', patch: { category: 'all', price: 'all' } },
  { label: 'Teacher Courses', patch: { category: 'teacher-courses', price: 'all' } },
  { label: "Children's Courses", patch: { category: 'children-courses', price: 'all' } },
  { label: 'Free Courses', patch: { category: 'all', price: 'free' } },
  { label: 'Paid Courses', patch: { category: 'all', price: 'paid' } },
]

function coursesHref(filters: Props['filters'], patch: Partial<Props['filters']>) {
  const next = { ...filters, ...patch }
  const params = new URLSearchParams()
  Object.entries(next).forEach(([key, value]) => {
    if (key === 'duration') return
    if (!value || value === 'all') return
    params.set(key, value)
  })
  const query = params.toString()
  return query ? `/courses?${query}` : '/courses'
}

function isTabActive(filters: Props['filters'], patch: Partial<Props['filters']>) {
  return Object.entries(patch).every(([key, value]) => filters[key as keyof Props['filters']] === value)
}

function SelectControls({ filters, levels, compact = false }: Props & { compact?: boolean }) {
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <form ref={formRef} action="/courses" className={cn('flex flex-wrap items-center gap-2', compact && 'flex-col items-stretch')}>
      {filters.q && <input type="hidden" name="q" value={filters.q} />}
      {filters.category !== 'all' && <input type="hidden" name="category" value={filters.category} />}
      {filters.price !== 'all' && <input type="hidden" name="price" value={filters.price} />}
      {levels.length > 0 && (
        <label className="sr-only" htmlFor={compact ? 'mobile-course-level' : 'course-level'}>Course level</label>
      )}
      {levels.length > 0 && (
        <select
          id={compact ? 'mobile-course-level' : 'course-level'}
          name="level"
          defaultValue={filters.level}
          onChange={() => formRef.current?.requestSubmit()}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-[#0F172A] outline-none focus:ring-2 focus:ring-[#60A5FA]/40"
        >
          <option value="all">All levels</option>
          {levels.map((level) => (
            <option key={level} value={level}>{formatCourseCategory(level)}</option>
          ))}
        </select>
      )}
      <label className="sr-only" htmlFor={compact ? 'mobile-course-sort' : 'course-sort'}>Sort courses</label>
      <select
        id={compact ? 'mobile-course-sort' : 'course-sort'}
        name="sort"
        defaultValue={filters.sort}
        onChange={() => formRef.current?.requestSubmit()}
        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-[#0F172A] outline-none focus:ring-2 focus:ring-[#60A5FA]/40"
      >
        <option value="newest">Newest</option>
        <option value="popularity">Most popular</option>
        <option value="rating">Highest rated</option>
        <option value="title">A to Z</option>
      </select>
      <noscript>
        <Button type="submit" size="sm" className="rounded-xl bg-[#1D4ED8]">Apply</Button>
      </noscript>
    </form>
  )
}

export function CourseFilters({ filters, levels }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {filterTabs.map((tab) => {
            const active = isTabActive(filters, tab.patch)
            return (
              <Link
                key={tab.label}
                href={coursesHref(filters, tab.patch)}
                className={cn(
                  'whitespace-nowrap rounded-xl border px-4 py-2 text-sm font-semibold transition-colors',
                  active
                    ? 'border-[#1D4ED8] bg-[#1D4ED8] text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-[#BFDBFE] hover:bg-[#EFF6FF] hover:text-[#1D4ED8]',
                )}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>

        <div className="hidden shrink-0 lg:block">
          <SelectControls filters={filters} levels={levels} />
        </div>

        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full rounded-xl border-slate-200 bg-white">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Sort & level
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl bg-white">
              <SheetHeader className="text-left">
                <SheetTitle>Sort and level</SheetTitle>
                <SheetDescription>Keep the catalogue focused with a compact sort and level filter.</SheetDescription>
              </SheetHeader>
              <div className="mt-4">
                <SelectControls filters={filters} levels={levels} compact />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  )
}
