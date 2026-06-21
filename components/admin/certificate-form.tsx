'use client'

import { useActionState, useState } from 'react'
import { createCertificateTemplateAction } from '@/actions/admin/certificates'
import { ImageUpload } from './image-upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ActionResult } from '@/types'

const initial: ActionResult = { success: false }

export function CertificateForm() {
  const [state, formAction, pending] = useActionState(createCertificateTemplateAction, initial)
  const [templateUrl, setTemplateUrl] = useState('')

  return (
    <form action={formAction} className="max-w-lg space-y-4 bg-card rounded-2xl border p-6">
      {state.success && <p className="text-emerald-600 text-sm">Template saved!</p>}
      <div className="space-y-2">
        <Label>Template Name</Label>
        <Input name="name" required className="rounded-xl" placeholder="Jolly Phonics Completion" />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea name="description" className="rounded-xl" rows={2} />
      </div>
      <div className="space-y-2">
        <Label>Template Image URL</Label>
        <Input name="template_url" value={templateUrl} onChange={(e) => setTemplateUrl(e.target.value)} className="rounded-xl" />
        <ImageUpload folder="phonics-club/certificates" onUpload={setTemplateUrl} />
      </div>
      <Button type="submit" disabled={pending} className="rounded-xl bg-[#1D4ED8]">
        Save Template
      </Button>
    </form>
  )
}
