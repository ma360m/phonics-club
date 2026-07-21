'use client'

import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export function CopyVerificationLinkButton({ url }: { url: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Verification link copied')
    } catch {
      toast.error('Copy is not available in this browser')
    }
  }

  return (
    <Button type="button" variant="outline" className="rounded-xl border-slate-200 bg-white" onClick={copy}>
      <Copy className="mr-2 h-4 w-4" />
      Copy Verification Link
    </Button>
  )
}
