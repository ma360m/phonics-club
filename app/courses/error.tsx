'use client'

import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CoursesError() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <AlertTriangle className="mb-4 h-12 w-12 text-[#D30000]" />
      <h1 className="text-2xl font-bold">Courses could not load</h1>
      <p className="mt-2 text-muted-foreground">
        Please refresh the page or return to the course catalog.
      </p>
      <Button asChild className="mt-6 rounded-xl bg-[#1D4ED8]">
        <Link href="/courses">Reload courses</Link>
      </Button>
    </main>
  )
}
