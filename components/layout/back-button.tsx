'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  fallbackHref?: string
  label?: string
}

export function BackButton({ fallbackHref = '/', label = 'Go back' }: Props) {
  const router = useRouter()

  return (
    <Button
      type="button"
      variant="ghost"
      className="rounded-xl mb-4 -ml-2"
      onClick={() => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
          router.back()
        } else {
          router.push(fallbackHref)
        }
      }}
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      {label}
    </Button>
  )
}
