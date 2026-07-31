'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { saveSiteContentAction } from '@/actions/admin/site-content'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { friendlyErrorMessage } from '@/lib/friendly-error'
import type { FAQItem } from '@/lib/site-content'

function newFaq(): FAQItem {
  return {
    q: '',
    a: [''],
  }
}

export function FaqsManager({ faqs }: { faqs: FAQItem[] }) {
  const [items, setItems] = useState<FAQItem[]>(faqs.length ? faqs : [newFaq()])
  const [pending, startTransition] = useTransition()

  function update(index: number, patch: Partial<FAQItem>) {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)))
  }

  function save() {
    startTransition(async () => {
      const cleanItems = items
        .map((item) => ({
          q: item.q.trim(),
          a: item.a.map((paragraph) => paragraph.trim()).filter(Boolean),
        }))
        .filter((item) => item.q && item.a.length)

      const result = await saveSiteContentAction('faqs', cleanItems)
      if (result.success) toast.success('FAQs saved')
      else toast.error(friendlyErrorMessage(result.error, 'Could not save FAQs.'))
    })
  }

  return (
    <section className="space-y-4 rounded-2xl border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Label className="text-lg font-semibold">FAQ Manager</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Add, edit, or remove public FAQ items without using JSON. Use separate lines for answer paragraphs.
          </p>
        </div>
        <Button type="button" variant="outline" className="rounded-xl" onClick={() => setItems((current) => [...current, newFaq()])}>
          <Plus className="mr-2 h-4 w-4" />
          Add FAQ
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={`${item.q}-${index}`} className="space-y-3 rounded-xl border bg-background/60 p-4">
            <div className="flex items-start gap-3">
              <div className="grid flex-1 gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)]">
                <div className="space-y-1.5">
                  <Label className="text-xs">Question</Label>
                  <Input
                    value={item.q}
                    onChange={(event) => update(index, { q: event.target.value })}
                    placeholder="What should visitors know?"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Answer paragraphs</Label>
                  <Textarea
                    value={item.a.join('\n')}
                    onChange={(event) => update(index, { a: event.target.value.split('\n') })}
                    rows={3}
                    placeholder="Write one paragraph per line."
                    className="rounded-xl"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="mt-6 shrink-0 rounded-xl"
                onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                aria-label={`Remove FAQ ${index + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button type="button" disabled={pending} onClick={save} className="rounded-xl bg-[#1D4ED8]">
        {pending ? 'Saving...' : 'Save FAQs'}
      </Button>
    </section>
  )
}
