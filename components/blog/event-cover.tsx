import { cn } from '@/lib/utils'
import { gradientForYear, yearFromValue } from './gradient-thumbnail'

export function EventCover({
  title,
  location,
  date,
  year,
  className,
  compact = false,
}: {
  title: string
  location?: string
  date?: string
  year?: string | number | null
  className?: string
  compact?: boolean
}) {
  const gradient = gradientForYear(year ?? yearFromValue(date))

  return (
    <div
      className={cn(
        'relative flex aspect-video min-h-[220px] overflow-hidden rounded-lg border border-slate-200',
        gradient.className,
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(255,255,255,0.22),transparent_30%),radial-gradient(circle_at_72%_10%,rgba(255,255,255,0.12),transparent_24%)]" />
      <div className={cn('absolute inset-x-0 bottom-0 h-2', gradient.accentClassName)} />
      <div className={cn('relative z-10 flex h-full w-full flex-col', compact ? 'justify-center p-5' : 'justify-end p-6 sm:p-8')}>
        <p className={cn('font-bold uppercase opacity-90', compact ? 'text-[11px] tracking-[0.18em]' : 'text-xs tracking-[0.22em]')}>Phonics Club</p>
        <p className={cn('font-semibold opacity-85', compact ? 'mt-1 text-sm' : 'mt-2 text-sm')}>Professional Development</p>
        <h3
          className={cn(
            'whitespace-normal break-words font-bold leading-tight [overflow-wrap:anywhere]',
            compact ? 'mt-2 text-lg sm:text-xl' : 'mt-3 max-w-5xl text-2xl sm:text-3xl',
          )}
        >
          {title}
        </h3>
        <div className={cn('flex flex-wrap gap-2 font-medium opacity-90', compact ? 'mt-3 text-xs' : 'mt-4 text-sm')}>
          {location ? <span>{location}</span> : null}
          {location && date ? <span aria-hidden="true">/</span> : null}
          {date ? <span>{date}</span> : null}
        </div>
      </div>
    </div>
  )
}
