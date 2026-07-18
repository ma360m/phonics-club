'use client'

import Link from 'next/link'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { friendlyErrorMessage } from '@/lib/friendly-error'

export default function CoursesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <AlertTriangle className="mb-4 h-12 w-12 text-[#D30000]" />
      <h1 className="text-2xl font-bold">Courses could not load</h1>
      <p className="mt-2 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
        {friendlyErrorMessage(error, 'The course catalog could not load.')}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={reset} className="rounded-xl bg-[#1D4ED8]">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/courses">Courses</Link>
        </Button>
      </div>
    </main>
  )
}
