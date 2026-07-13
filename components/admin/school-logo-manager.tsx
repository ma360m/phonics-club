'use client'

import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { saveSiteContentFormAction } from '@/actions/admin/site-content'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { SchoolLogo } from '@/lib/site-content'

function createLogo(): SchoolLogo {
  const id = crypto.randomUUID?.() ?? String(Date.now())
  return {
    id,
    name: '',
    imageUrl: '',
    href: '',
    sortOrder: 1,
  }
}

export function SchoolLogoManager({ logos: initialLogos }: { logos: SchoolLogo[] }) {
  const [logos, setLogos] = useState<SchoolLogo[]>(
    initialLogos.length ? initialLogos : [createLogo()]
  )

  const content = useMemo(
    () =>
      JSON.stringify(
        logos
          .filter((logo) => logo.name.trim())
          .map((logo, index) => ({
            ...logo,
            id: logo.id || logo.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            imageUrl: logo.imageUrl?.trim() ?? '',
            href: logo.href?.trim() || undefined,
            sortOrder: Number(logo.sortOrder) || index + 1,
          })),
      ),
    [logos],
  )

  const updateLogo = (index: number, patch: Partial<SchoolLogo>) => {
    setLogos((current) =>
      current.map((logo, logoIndex) => (logoIndex === index ? { ...logo, ...patch } : logo)),
    )
  }

  return (
    <form action={saveSiteContentFormAction} className="space-y-4 rounded-2xl border bg-card p-6">
      <input type="hidden" name="key" value="school_logos" />
      <input type="hidden" name="content" value={content} />

      <div>
        <Label className="text-lg font-semibold">School Logo Ticker</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          Add, remove, and sort the logos shown under “Tested at schools throughout Pakistan”.
        </p>
      </div>

      <div className="space-y-3">
        {logos.map((logo, index) => (
          <div key={logo.id || index} className="grid gap-3 rounded-xl border bg-background/60 p-3 md:grid-cols-[1.2fr_1.4fr_0.7fr_auto]">
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input
                value={logo.name}
                onChange={(event) => updateLogo(index, { name: event.target.value })}
                placeholder="TNS"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Logo image URL</Label>
              <Input
                value={logo.imageUrl ?? ''}
                onChange={(event) => updateLogo(index, { imageUrl: event.target.value })}
                placeholder="/images/schools/logo.png or https://..."
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Sort</Label>
              <Input
                value={logo.sortOrder}
                type="number"
                min="1"
                onChange={(event) => updateLogo(index, { sortOrder: Number(event.target.value) })}
                className="rounded-xl"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="rounded-xl"
                onClick={() => setLogos((current) => current.filter((_, logoIndex) => logoIndex !== index))}
                aria-label={`Remove ${logo.name || 'logo'}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" className="rounded-xl" onClick={() => setLogos((current) => [...current, createLogo()])}>
          <Plus className="mr-2 h-4 w-4" />
          Add Logo
        </Button>
        <Button type="submit" className="rounded-xl bg-[#1D4ED8]">
          Save School Logos
        </Button>
      </div>
    </form>
  )
}
