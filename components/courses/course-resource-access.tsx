'use client'

import { useState, useTransition } from 'react'
import { Download, ExternalLink } from 'lucide-react'
import { getSignedCourseResourceAction } from '@/actions/lms'
import { Button } from '@/components/ui/button'

interface Props {
  resourceId: string
  directUrl?: string | null
  disabled?: boolean
  label?: string
}

export function CourseResourceAccess({ resourceId, directUrl, disabled = false, label = 'Open' }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function openResource() {
    if (disabled) return
    setError(null)

    if (directUrl) {
      window.open(directUrl, '_blank', 'noopener,noreferrer')
      return
    }

    startTransition(async () => {
      const result = await getSignedCourseResourceAction(resourceId)
      if (!result.success || !result.data?.url) {
        setError(result.error ?? 'Resource could not be opened.')
        return
      }
      window.open(result.data.url, '_blank', 'noopener,noreferrer')
    })
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        size="sm"
        variant={directUrl ? 'outline' : 'default'}
        disabled={disabled || isPending}
        onClick={openResource}
        className={directUrl ? 'rounded-xl border-slate-200 bg-white' : 'rounded-xl bg-[#1D4ED8] hover:bg-[#1D4ED8]/90'}
      >
        {directUrl ? <ExternalLink className="mr-2 h-3.5 w-3.5" /> : <Download className="mr-2 h-3.5 w-3.5" />}
        {isPending ? 'Opening...' : label}
      </Button>
      {error && <p className="max-w-52 text-xs leading-5 text-[#8B1E2D]">{error}</p>}
    </div>
  )
}
