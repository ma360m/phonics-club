'use client'

import { useId, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { QuantityStepper } from '@/components/shop/quantity-stepper'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatPrice } from '@/utils/format'
import type { OrderItem } from '@/types'

export interface EditableOrderProduct {
  id: string
  name: string
  price: number
  image?: string
}

interface EditableOrderItemRow {
  key: string
  productId: string
  name: string
  price: number
  quantity: number
  image?: string
  custom: boolean
}

interface OrderItemsEditorProps {
  items: OrderItem[]
  products?: EditableOrderProduct[]
  allowProductAdd?: boolean
  allowCustomLines?: boolean
  priceEditable?: boolean
  nameEditable?: boolean
  disabled?: boolean
}

function toRow(item: OrderItem, index: number): EditableOrderItemRow {
  return {
    key: `${item.product_id || 'item'}-${index}`,
    productId: item.product_id,
    name: item.name,
    price: Math.max(0, Number(item.price) || 0),
    quantity: Math.max(0, Number(item.quantity) || 0),
    image: item.image,
    custom: /^custom:/i.test(item.product_id),
  }
}

function nextCustomId() {
  return `custom:${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function OrderItemsEditor({
  items,
  products = [],
  allowProductAdd = true,
  allowCustomLines = false,
  priceEditable = false,
  nameEditable = false,
  disabled = false,
}: OrderItemsEditorProps) {
  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products])
  const [rows, setRows] = useState<EditableOrderItemRow[]>(() => items.map(toRow).filter((row) => row.quantity > 0))
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? '')
  const productPickerId = useId()

  const activeRows = rows.filter((row) => row.quantity > 0)
  const subtotal = activeRows.reduce((sum, row) => sum + row.price * row.quantity, 0)
  const totalQuantity = activeRows.reduce((sum, row) => sum + row.quantity, 0)

  function updateRow(key: string, patch: Partial<EditableOrderItemRow>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)))
  }

  function addSelectedProduct() {
    const product = productMap.get(selectedProductId)
    if (!product) return

    setRows((current) => {
      const existing = current.find((row) => row.productId === product.id)
      if (existing) {
        return current.map((row) => (
          row.productId === product.id
            ? { ...row, quantity: Math.min(999, row.quantity + 1) }
            : row
        ))
      }

      return [
        ...current,
        {
          key: `${product.id}-${Date.now().toString(36)}`,
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          image: product.image,
          custom: false,
        },
      ]
    })
  }

  function addCustomLine() {
    const id = nextCustomId()
    setRows((current) => [
      ...current,
      {
        key: id,
        productId: id,
        name: 'Custom invoice item',
        price: 0,
        quantity: 1,
        custom: true,
      },
    ])
  }

  return (
    <div className="space-y-3 rounded-lg border bg-[#F8FAFC] p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Items</p>
          <p className="text-xs text-muted-foreground">
            {activeRows.length} line{activeRows.length === 1 ? '' : 's'} - {totalQuantity} total item{totalQuantity === 1 ? '' : 's'}
          </p>
        </div>
        <p className="text-sm font-bold text-[#1D4ED8]">{formatPrice(subtotal)}</p>
      </div>

      {allowProductAdd && products.length ? (
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <Label className="sr-only" htmlFor={productPickerId}>Add product</Label>
          <select
            id={productPickerId}
            value={selectedProductId}
            onChange={(event) => setSelectedProductId(event.target.value)}
            disabled={disabled}
            className="min-h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm"
          >
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} - {formatPrice(product.price)}
              </option>
            ))}
          </select>
          <Button type="button" variant="outline" className="rounded-lg bg-white" onClick={addSelectedProduct} disabled={disabled || !selectedProductId}>
            <Plus className="mr-2 h-4 w-4" />
            Add product
          </Button>
        </div>
      ) : null}

      {allowCustomLines ? (
        <Button type="button" variant="outline" size="sm" className="rounded-lg bg-white" onClick={addCustomLine} disabled={disabled}>
          <Plus className="mr-2 h-4 w-4" />
          Add custom line
        </Button>
      ) : null}

      {activeRows.length ? (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-12 px-3 py-2 text-center">#</th>
                <th className="px-3 py-2">Item</th>
                <th className="w-28 px-3 py-2 text-right">Price</th>
                <th className="w-32 px-3 py-2 text-center">Qty</th>
                <th className="w-28 px-3 py-2 text-right">Total</th>
                <th className="w-16 px-3 py-2 text-right">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {activeRows.map((row, index) => (
                <tr key={row.key}>
                  <td className="px-3 py-3 text-center font-mono text-xs text-slate-500">{index + 1}</td>
                  <td className="min-w-0 px-3 py-3">
                    <input type="hidden" name="itemProductId" value={row.productId} />
                    <input type="hidden" name="itemImage" value={row.image ?? ''} />
                    {nameEditable || (allowCustomLines && row.custom) ? (
                      <Input
                        name="itemName"
                        value={row.name}
                        required
                        maxLength={180}
                        onChange={(event) => updateRow(row.key, { name: event.target.value })}
                        className="h-9 rounded-lg"
                        disabled={disabled}
                        aria-label={`Item ${index + 1} name`}
                      />
                    ) : (
                      <>
                        <input type="hidden" name="itemName" value={row.name} />
                        <p className="break-words font-medium text-slate-800">{row.name}</p>
                      </>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {priceEditable || (allowCustomLines && row.custom) ? (
                      <Input
                        type="number"
                        name="itemPrice"
                        min="0"
                        step="1"
                        value={row.price}
                        onChange={(event) => updateRow(row.key, { price: Math.max(0, Number(event.target.value) || 0) })}
                        className="h-9 rounded-lg text-right"
                        disabled={disabled}
                        aria-label={`Item ${index + 1} price`}
                      />
                    ) : (
                      <>
                        <input type="hidden" name="itemPrice" value={row.price} />
                        <span>{formatPrice(row.price)}</span>
                      </>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <input type="hidden" name="itemQuantity" value={row.quantity} />
                    <QuantityStepper
                      value={row.quantity}
                      min={1}
                      max={999}
                      disabled={disabled}
                      onChange={(quantity) => updateRow(row.key, { quantity })}
                      className="mx-auto rounded-lg"
                      buttonClassName="h-8 w-8"
                      inputClassName="h-8 w-11 text-xs"
                    />
                  </td>
                  <td className="px-3 py-3 text-right font-semibold">{formatPrice(row.price * row.quantity)}</td>
                  <td className="px-3 py-3 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-lg text-destructive hover:text-destructive"
                      disabled={disabled}
                      title="Remove item"
                      aria-label={`Remove ${row.name || `item ${index + 1}`}`}
                      onClick={() => updateRow(row.key, { quantity: 0 })}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove item</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-lg border border-dashed bg-white px-3 py-4 text-sm text-muted-foreground">
          No items selected.
        </p>
      )}
    </div>
  )
}
