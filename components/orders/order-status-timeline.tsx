import { CheckCircle2, Circle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  CANCELLED_ORDER_STEP,
  getCustomerOrderSteps,
  type CustomerOrderStep,
} from '@/lib/order-status'

export function OrderStatusTimeline({
  status,
  paymentMethod,
}: {
  status: string
  paymentMethod?: string | null
}) {
  const cancelled = status === 'cancelled'
  const steps = cancelled ? [CANCELLED_ORDER_STEP] : getCustomerOrderSteps(paymentMethod)
  const activeIndex = Math.max(
    0,
    steps.findIndex((step) => step.status === status)
  )

  return (
    <ol className="space-y-2">
      {steps.map((step, index) => (
        <StatusStep
          key={step.status}
          step={step}
          complete={!cancelled && index < activeIndex}
          active={cancelled || index === activeIndex}
          cancelled={cancelled}
        />
      ))}
    </ol>
  )
}

function StatusStep({
  step,
  complete,
  active,
  cancelled,
}: {
  step: CustomerOrderStep
  complete: boolean
  active: boolean
  cancelled: boolean
}) {
  const Icon = cancelled ? XCircle : complete ? CheckCircle2 : Circle

  return (
    <li
      className={cn(
        'rounded-lg border p-3 text-sm',
        active && !cancelled && 'border-[#1D4ED8] bg-[#1D4ED8]/5',
        complete && 'border-emerald-200 bg-emerald-50',
        cancelled && 'border-destructive/30 bg-destructive/5'
      )}
    >
      <div className="grid gap-2 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-start">
        <div className="flex min-w-0 items-start gap-2">
        <Icon
          className={cn(
            'mt-0.5 h-4 w-4 shrink-0',
            active && !cancelled && 'text-[#1D4ED8]',
            complete && 'text-emerald-600',
            cancelled && 'text-destructive',
            !active && !complete && !cancelled && 'text-muted-foreground'
          )}
        />
          <p className="min-w-0 font-semibold leading-5">{step.label}</p>
        </div>
        <p className="min-w-0 text-xs leading-5 text-muted-foreground sm:text-sm">{step.description}</p>
      </div>
    </li>
  )
}
