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
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
      <div className="flex items-start gap-2">
        <Icon
          className={cn(
            'mt-0.5 h-4 w-4 shrink-0',
            active && !cancelled && 'text-[#1D4ED8]',
            complete && 'text-emerald-600',
            cancelled && 'text-destructive',
            !active && !complete && !cancelled && 'text-muted-foreground'
          )}
        />
        <div>
          <p className="font-semibold">{step.label}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.description}</p>
        </div>
      </div>
    </li>
  )
}
