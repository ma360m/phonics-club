'use client'

import { useRef } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { RichTextToolbar } from './rich-text-toolbar'

export function RichTextarea(props: React.ComponentProps<typeof Textarea>) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  return (
    <div>
      <RichTextToolbar textareaRef={textareaRef} />
      <Textarea ref={textareaRef} {...props} />
    </div>
  )
}
