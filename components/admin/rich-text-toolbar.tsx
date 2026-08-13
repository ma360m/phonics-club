'use client'

import type { RefObject } from 'react'
import { Bold, Heading2, Italic, List, ListOrdered, Quote, Underline } from 'lucide-react'
import { Button } from '@/components/ui/button'

const tools = [
  { label: 'Bold', icon: Bold, before: '<strong>', after: '</strong>' },
  { label: 'Italic', icon: Italic, before: '<em>', after: '</em>' },
  { label: 'Underline', icon: Underline, before: '<u>', after: '</u>' },
  { label: 'Heading', icon: Heading2, before: '<h2>', after: '</h2>' },
  { label: 'Quote', icon: Quote, before: '<blockquote>', after: '</blockquote>' },
  { label: 'Bullet list', icon: List, before: '<ul>\n  <li>', after: '</li>\n</ul>' },
  { label: 'Numbered list', icon: ListOrdered, before: '<ol>\n  <li>', after: '</li>\n</ol>' },
]

export function insertRichTextTag(textarea: HTMLTextAreaElement, before: string, after: string) {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selected = textarea.value.slice(start, end)
  const nextValue = `${textarea.value.slice(0, start)}${before}${selected || 'Text'}${after}${textarea.value.slice(end)}`
  textarea.value = nextValue
  textarea.dispatchEvent(new Event('input', { bubbles: true }))
  const cursor = selected ? start + before.length + selected.length + after.length : start + before.length + 4
  textarea.focus()
  textarea.setSelectionRange(cursor, cursor)
}

export function RichTextToolbar({ textareaRef }: { textareaRef: RefObject<HTMLTextAreaElement | null> }) {
  return (
    <div className="mb-2 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-[#F8FAFC] p-2">
      {tools.map(({ label, icon: Icon, before, after }) => (
        <Button
          key={label}
          type="button"
          size="icon"
          variant="outline"
          className="h-9 w-9 rounded-lg bg-white"
          title={label}
          aria-label={label}
          onClick={() => {
            if (textareaRef.current) insertRichTextTag(textareaRef.current, before, after)
          }}
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  )
}
