'use client'

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { ExternalLink, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BulkInvoiceSelectionContextValue {
  selectedIds: string[]
  selectedIdSet: Set<string>
  toggleOrder: (orderId: string, selected: boolean) => void
  clearSelection: () => void
}

const BulkInvoiceSelectionContext = createContext<BulkInvoiceSelectionContextValue | null>(null)

function useBulkInvoiceSelection() {
  const context = useContext(BulkInvoiceSelectionContext)
  if (!context) throw new Error('Bulk invoice selection must be used inside BulkInvoiceSelectionProvider')
  return context
}

export function BulkInvoiceSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds])

  function toggleOrder(orderId: string, selected: boolean) {
    setSelectedIds((current) => {
      if (selected) return current.includes(orderId) ? current : [...current, orderId]
      return current.filter((id) => id !== orderId)
    })
  }

  return (
    <BulkInvoiceSelectionContext.Provider
      value={{
        selectedIds,
        selectedIdSet,
        toggleOrder,
        clearSelection: () => setSelectedIds([]),
      }}
    >
      {children}
    </BulkInvoiceSelectionContext.Provider>
  )
}

export function AdminOrderSelectCheckbox({ orderId, label }: { orderId: string; label: string }) {
  const { selectedIdSet, toggleOrder } = useBulkInvoiceSelection()
  const selected = selectedIdSet.has(orderId)

  return (
    <label className="inline-flex items-center gap-2 rounded-xl border bg-background px-3 py-2 text-xs font-semibold text-muted-foreground">
      <input
        type="checkbox"
        checked={selected}
        onChange={(event) => toggleOrder(orderId, event.target.checked)}
        aria-label={`Select invoice ${label}`}
        className="h-4 w-4 accent-[#1D4ED8]"
      />
      Select
    </label>
  )
}

export function AdminOrderBulkInvoiceToolbar() {
  const { selectedIds, clearSelection } = useBulkInvoiceSelection()
  const selectedCount = selectedIds.length

  function openNumberingTab() {
    if (!selectedCount) return
    const params = new URLSearchParams({ ids: selectedIds.join(',') })
    window.open(`/admin/orders/invoice-numbering?${params.toString()}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4">
      <div>
        <p className="text-sm font-bold">Batch invoices</p>
        <p className="text-xs text-muted-foreground">{selectedCount} selected</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {selectedCount > 0 ? (
          <Button type="button" size="sm" variant="ghost" className="rounded-xl" onClick={clearSelection}>
            <X className="h-4 w-4" />
            Clear
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          className="rounded-xl bg-[#1D4ED8]"
          disabled={!selectedCount}
          onClick={openNumberingTab}
        >
          <ExternalLink className="h-4 w-4" />
          OK
        </Button>
      </div>
    </div>
  )
}
