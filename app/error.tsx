'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { friendlyErrorMessage } from '@/lib/friendly-error'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="mx-auto flex min-h-[65vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <AlertTriangle className="mb-4 h-12 w-12 text-[#D30000]" />
      <h1 className="text-2xl font-bold">This page could not finish loading</h1>
      <p className="mt-3 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
        {friendlyErrorMessage(error, 'The website ran into a problem.')}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={reset} className="rounded-xl bg-[#1D4ED8]">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    </main>
  )
}
