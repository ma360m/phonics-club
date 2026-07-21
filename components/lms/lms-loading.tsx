import { Skeleton } from '@/components/ui/skeleton'
import { LmsShell } from '@/components/lms/lms-shell'

function SkeletonCard({ tall = false }: { tall?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <Skeleton className="h-4 w-28 bg-slate-200" />
      <Skeleton className="mt-4 h-7 w-40 bg-slate-200" />
      <Skeleton className={`mt-5 w-full bg-slate-200 ${tall ? 'h-40' : 'h-16'}`} />
    </div>
  )
}

export function LmsPageSkeleton({ shell = true }: { shell?: boolean }) {
  const content = (
    <div>
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Skeleton className="h-4 w-32 bg-slate-200" />
        <Skeleton className="mt-3 h-10 w-72 max-w-full bg-slate-200" />
        <Skeleton className="mt-3 h-5 w-[520px] max-w-full bg-slate-200" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <SkeletonCard tall />
        <SkeletonCard tall />
      </div>
    </div>
  )

  if (!shell) return content
  return <LmsShell>{content}</LmsShell>
}
