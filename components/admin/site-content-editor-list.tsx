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

  function jumpToSection(sectionKey: string) {
    if (!sectionKey) return

    const section = document.getElementById(sectionKey)
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (section) window.history.replaceState(null, '', `#${sectionKey}`)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="min-w-0 flex-1 space-y-2">
            <Label htmlFor="site-content-search">Find editable content</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="site-content-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by section, key, or saved text"
                className="rounded-lg pl-9 pr-10"
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
          </div>

          <div className="min-w-0 space-y-2 lg:w-72">
            <Label htmlFor="site-content-jump">Jump to section</Label>
            <select
              id="site-content-jump"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none ring-offset-background transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value=""
              disabled={visibleSections.length === 0}
              onChange={(event) => jumpToSection(event.target.value)}
            >
              <option value="">Choose a section</option>
              {visibleSections.map((section) => (
                <option key={section.key} value={section.key}>
                  {section.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
          Showing {visibleSections.length} of {sections.length} editable content sections.
        </p>
      </div>

      {visibleSections.map(({ key, label, hint }) => (
        <form id={key} key={key} action={saveSiteContentFormAction} className="scroll-mt-6 space-y-3 rounded-lg border bg-card p-4 sm:p-6">
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
