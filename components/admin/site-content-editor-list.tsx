'use client'

import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { saveSiteContentFormAction } from '@/actions/admin/site-content'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type SiteContentSection = {
  key: string
  label: string
  hint: string
}

function stringifyContent(content: unknown) {
  try {
    return JSON.stringify(content ?? [], null, 2)
  } catch {
    return '[]'
  }
}

export function SiteContentEditorList({
  sections,
  contentMap,
  defaults,
}: {
  sections: SiteContentSection[]
  contentMap: Record<string, unknown>
  defaults: Record<string, unknown>
}) {
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()

  const visibleSections = useMemo(() => {
    if (!normalizedQuery) return sections
    return sections.filter(({ key, label, hint }) => {
      const content = stringifyContent(contentMap[key] ?? defaults[key] ?? [])
      return [key, label, hint, content].some((value) => value.toLowerCase().includes(normalizedQuery))
    })
  }, [contentMap, defaults, normalizedQuery, sections])

  return (
    <div className="space-y-6">
      <div className="sticky top-3 z-10 rounded-2xl border bg-card p-4 shadow-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search content sections, keys, text, bank details..."
            className="rounded-xl pl-9 pr-10"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Clear content search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {visibleSections.map((section) => (
            <a
              key={section.key}
              href={`#${section.key}`}
              className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-[#BFDBFE] hover:bg-[#EFF6FF] hover:text-[#1D4ED8]"
            >
              {section.label}
            </a>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Showing {visibleSections.length} of {sections.length} editable content sections.
        </p>
      </div>

      {visibleSections.map(({ key, label, hint }) => (
        <form id={key} key={key} action={saveSiteContentFormAction} className="scroll-mt-28 space-y-3 rounded-lg border bg-card p-4 sm:p-6">
          <input type="hidden" name="key" value={key} />
          <Label className="text-lg font-semibold">{label}</Label>
          <p className="text-xs leading-5 text-muted-foreground">{hint}</p>
          <Textarea
            name="content"
            rows={key.includes('policy') || key.includes('page') ? 16 : 8}
            className="max-w-full rounded-lg font-mono text-xs leading-5"
            defaultValue={stringifyContent(contentMap[key] ?? defaults[key] ?? [])}
          />
          <Button type="submit" className="max-w-full rounded-lg bg-[#1D4ED8] whitespace-normal">
            Save {label}
          </Button>
        </form>
      ))}

      {visibleSections.length === 0 && (
        <div className="rounded-2xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
          No content section matched your search.
        </div>
      )}
    </div>
  )
}
