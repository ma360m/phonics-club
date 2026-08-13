import { cn } from '@/lib/utils'

const YEAR_GRADIENTS = [
  {
    name: 'blue',
    className: 'bg-[linear-gradient(135deg,#64BDE0_0%,#0787D1_45%,#061C88_100%)] text-white',
    accentClassName: 'bg-[#FBBF24]',
  },
  {
    name: 'yellow',
    className: 'bg-[linear-gradient(135deg,#FFD800_0%,#FBBF24_58%,#F59E0B_100%)] text-[#111827]',
    accentClassName: 'bg-[#D30000]',
  },
  {
    name: 'red',
    className: 'bg-[linear-gradient(180deg,#DF000A_0%,#BF0008_54%,#820006_100%)] text-white',
    accentClassName: 'bg-[#FBBF24]',
  },
] as const

export function gradientForYear(year?: string | number | null) {
  const numericYear = Number(year)
  const index = Number.isFinite(numericYear) ? Math.abs(numericYear) % YEAR_GRADIENTS.length : 0
  return YEAR_GRADIENTS[index]
}

export function yearFromValue(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (!Number.isNaN(date.getTime())) return String(date.getFullYear())
  const match = value.match(/\b(20\d{2}|19\d{2})\b/)
  return match?.[1] ?? null
}

export function GradientThumbnail({
  title,
  meta,
  year,
  compact = false,
  showText = true,
  className,
}: {
  title: string
  meta?: string | null
  year?: string | number | null
  compact?: boolean
  showText?: boolean
  className?: string
}) {
  const gradient = gradientForYear(year)

  return (
    <div
      className={cn(
        'relative flex h-full min-h-[160px] overflow-hidden rounded-none',
        gradient.className,
        compact ? 'p-4' : 'p-5',
        className,
      )}
      data-gradient-year={year ?? undefined}
      data-gradient-palette={gradient.name}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(255,255,255,0.22),transparent_30%),radial-gradient(circle_at_78%_8%,rgba(255,255,255,0.14),transparent_24%)]" />
      <div className={cn('absolute inset-x-0 bottom-0 h-2', gradient.accentClassName)} />
      {showText ? (
        <div className="relative z-10 mt-auto min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-85">Phonics Club</p>
          <h3 className={cn('mt-2 line-clamp-3 font-bold leading-tight [overflow-wrap:anywhere]', compact ? 'text-lg' : 'text-xl')}>
            {title}
          </h3>
          {meta ? <p className="mt-3 text-sm font-semibold opacity-85">{meta}</p> : null}
        </div>
      ) : null}
    </div>
  )
}

export function GradientRibbon({
  year,
  className,
}: {
  year?: string | number | null
  className?: string
}) {
  const gradient = gradientForYear(year)

  return (
    <div
      className={cn('h-2 w-full rounded-full', gradient.className, className)}
      data-gradient-year={year ?? undefined}
      data-gradient-palette={gradient.name}
      aria-hidden="true"
    />
  )
}
