import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const toneClasses = {
  blue: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]',
  red: 'bg-[#FFF1F2] text-[#9F1239] border-[#FECDD3]',
  gold: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]',
  navy: 'bg-[#F8FAFC] text-[#0F172A] border-slate-200',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

export function LmsPageHeader({
  eyebrow,
  title,
  description,
  action,
  meta,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
  meta?: ReactNode
}) {
  return (
    <header className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          {eyebrow && <p className="text-sm font-semibold uppercase tracking-wide text-[#1D4ED8]">{eyebrow}</p>}
          <h1 className="mt-1 text-2xl font-bold tracking-normal text-[#0F172A] sm:text-3xl">{title}</h1>
          {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>}
          {meta && <div className="mt-3">{meta}</div>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  )
}

export function LmsStatCard({
  title,
  value,
  detail,
  icon: Icon,
  tone = 'blue',
}: {
  title: string
  value: string | number
  detail?: string
  icon: LucideIcon
  tone?: keyof typeof toneClasses
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-[#BFDBFE]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-[#0F172A]">{value}</p>
          {detail && <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>}
        </div>
        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border', toneClasses[tone])}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </article>
  )
}

export function LmsSectionCard({
  title,
  description,
  icon: Icon,
  action,
  children,
  className,
  id,
}: {
  id?: string
  title?: string
  description?: string
  icon?: LucideIcon
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section id={id} className={cn('rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6', className)}>
      {(title || description || action) && (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title && (
              <h2 className="flex items-center gap-2 text-xl font-bold text-[#0F172A]">
                {Icon && <Icon className="h-5 w-5 text-[#1D4ED8]" />}
                {title}
              </h2>
            )}
            {description && <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

export function LmsEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-[#F8FAFC] p-8 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#1D4ED8]">
        <Icon className="h-6 w-6" />
      </span>
      <h2 className="mt-4 text-xl font-bold text-[#0F172A]">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function LmsStatusBadge({
  children,
  tone = 'blue',
  className,
}: {
  children: ReactNode
  tone?: keyof typeof toneClasses
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize', toneClasses[tone], className)}>
      {children}
    </span>
  )
}
