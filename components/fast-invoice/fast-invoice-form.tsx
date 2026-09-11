'use client'

import { useActionState, useEffect, useMemo, useState, useTransition } from 'react'
import { Check, Plus, Search, Trash2, UserRound } from 'lucide-react'
import {
  createFastInvoiceCouponAction,
  createFastInvoiceCustomerAction,
  createFastInvoiceMemberDiscountAction,
  placeFastInvoiceOrderAction,
} from '@/actions/fast-invoice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { QuantityStepper } from '@/components/shop/quantity-stepper'
import { useCurrency } from '@/components/currency/currency-provider'
import { CurrencyDisplayNotice } from '@/components/currency/price-display'
import { SHIPPING_FEE_PKR } from '@/lib/commerce'
import { formatCurrency } from '@/lib/currency'
import { evaluateProductOrderability, getProductPurchaseLimit, type ProductStockStatus } from '@/lib/products/inventory'
import { getProductPricing } from '@/lib/products/sale-pricing'
import { shopPaymentLabel, shopPaymentNeedsReceipt, type ShopPaymentMethod } from '@/lib/payment-methods'
import type { ActionResult } from '@/types'

const initialState: ActionResult = { success: false }

interface FastInvoiceProduct {
  id: string
  name: string
  category: string
  price: number
  sale_enabled?: boolean | null
  sale_price?: number | null
  sale_percentage?: number | null
  sale_badge_text?: string | null
  isbn?: string | null
  stock?: number | null
  reserved_stock?: number | null
  low_stock_threshold?: number | null
  stock_management_enabled?: boolean | null
  backorder_policy?: string | null
  max_backorder_quantity?: number | null
  max_purchase_quantity?: number | null
  estimated_availability_date?: string | null
  backorder_message?: string | null
  metadata?: Record<string, unknown> | null
}

interface PaymentOption {
  value: ShopPaymentMethod
  title: string
  description: string
}

interface CouponPreview {
  valid: boolean
  code?: string
  memberId?: string | null
  discount?: number
  couponDiscount?: number
  memberDiscount?: number
  couponDiscountPercent?: number
  memberDiscountPercent?: number
  shippingDiscount?: number
  error?: string
}

interface SelectedItem {
  productId: string
  quantity: number
  name?: string
  price?: number
  isbn?: string
}

interface AdminInvoiceCustomer {
  id: string
  user_id: string | null
  name: string
  email: string | null
  phone: string | null
  member_id: string | null
  address: string | null
  city: string | null
  zip: string | null
  country: string
  notes: string | null
  source: 'directory' | 'profile' | 'order'
}

interface AdminInvoiceCoupon {
  code: string
  active?: boolean | null
  discount_percent?: number | null
  discount_amount?: number | null
}

interface AdminInvoiceMemberDiscount {
  member_id: string
  active?: boolean | null
  discount_percent?: number | null
  free_shipping_enabled?: boolean | null
}

export function FastInvoiceForm({
  token,
  products,
  paymentOptions,
  recipientEmail,
  requiredMemberId,
  adminOnly = false,
  customers = [],
  coupons = [],
  memberDiscounts = [],
}: {
  token: string
  products: FastInvoiceProduct[]
  paymentOptions: PaymentOption[]
  recipientEmail?: string | null
  requiredMemberId?: string | null
  adminOnly?: boolean
  customers?: AdminInvoiceCustomer[]
  coupons?: AdminInvoiceCoupon[]
  memberDiscounts?: AdminInvoiceMemberDiscount[]
}) {
  const { currency, settings, format } = useCurrency()
  const [state, formAction, pending] = useActionState(placeFastInvoiceOrderAction, initialState)
  const [customerCreatePending, startCustomerTransition] = useTransition()
  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products])
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? '')
  const [searchTerm, setSearchTerm] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [addQuantity, setAddQuantity] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState<ShopPaymentMethod>(paymentOptions[0]?.value ?? 'cod')
  const [couponCode, setCouponCode] = useState('')
  const [memberId, setMemberId] = useState(requiredMemberId ?? '')
  const [customerId, setCustomerId] = useState('')
  const [customerOptions, setCustomerOptions] = useState(customers)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false)
  const [customerCreatorOpen, setCustomerCreatorOpen] = useState(false)
  const [customerCreateState, setCustomerCreateState] = useState<ActionResult<AdminInvoiceCustomer>>({ success: false })
  const [newCustomerDraft, setNewCustomerDraft] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: 'Lahore',
    zip: '',
    memberId: '',
    notes: '',
  })
  const [poNumber, setPoNumber] = useState('')
  const [ntnNumber, setNtnNumber] = useState('')
  const [invoiceDate, setInvoiceDate] = useState('')
  const [customerDetails, setCustomerDetails] = useState({
    fullName: '',
    email: recipientEmail ?? '',
    phone: '',
    address: '',
    city: 'Lahore',
    zip: '',
    notes: '',
    memberId: requiredMemberId ?? '',
  })
  const [couponPreview, setCouponPreview] = useState<CouponPreview | null>(null)
  const [couponChecking, setCouponChecking] = useState(false)
  const [couponOptions, setCouponOptions] = useState(coupons)
  const [memberOptions, setMemberOptions] = useState(memberDiscounts)
  const [couponCreatorOpen, setCouponCreatorOpen] = useState(false)
  const [memberCreatorOpen, setMemberCreatorOpen] = useState(false)
  const [couponCreateState, setCouponCreateState] = useState<ActionResult<{ code: string }>>({ success: false })
  const [memberCreateState, setMemberCreateState] = useState<ActionResult<{ memberId: string }>>({ success: false })
  const [couponDraft, setCouponDraft] = useState({ code: '', discountPercent: '10', maxUses: '' })
  const [memberDraft, setMemberDraft] = useState({ memberId: '', discountPercent: '10', freeShipping: false })
  const [previewReady, setPreviewReady] = useState(false)
  const [documentType, setDocumentType] = useState<'invoice' | 'estimate'>(adminOnly && paymentOptions[0]?.value !== 'cod' ? 'estimate' : 'invoice')
  const memberDiscountLocked = Boolean(requiredMemberId?.trim())

  const invoiceItems = selectedItems.flatMap((item) => {
    const product = productMap.get(item.productId)
    if (!product) return []
    const pricing = getProductPricing(product)
    const stock = evaluateProductOrderability(product, item.quantity)
    const defaultIsbn = product.isbn ?? (product.metadata?.isbn as string | undefined) ?? undefined
    return [{
      ...item,
      product,
      name: adminOnly && item.name !== undefined ? item.name : product.name,
      isbn: adminOnly && item.isbn !== undefined ? item.isbn : defaultIsbn,
      price: adminOnly && item.price !== undefined ? item.price : pricing.displayPrice,
      lineTotal: (adminOnly && item.price !== undefined ? item.price : pricing.displayPrice) * item.quantity,
      stock,
    }]
  })
  const subtotal = invoiceItems.reduce((sum, item) => sum + item.lineTotal, 0)
  const totalQuantity = invoiceItems.reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0)

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return products.slice(0, 12)
    return products
      .filter((product) => [product.name, product.category, product.isbn ?? ''].some((value) => value.toLowerCase().includes(term)))
      .slice(0, 18)
  }, [products, searchTerm])

  const filteredCustomers = useMemo(() => {
    const term = customerSearch.trim().toLowerCase()
    if (!term) return customerOptions
    return customerOptions
      .filter((customer) => [customer.name, customer.email ?? '', customer.phone ?? '', customer.member_id ?? ''].some((value) => value.toLowerCase().includes(term)))
      .slice(0, 100)
  }, [customerOptions, customerSearch])

  useEffect(() => {
    const code = couponCode.trim()
    const member = memberId.trim()
    if ((!code && !member) || subtotal <= 0) {
      setCouponPreview(null)
      setCouponChecking(false)
      return
    }

    if ((code && code.length < 3) || (member && member.length < 3)) {
      setCouponPreview({ valid: false, error: 'Enter at least 3 characters.' })
      setCouponChecking(false)
      return
    }

    const controller = new AbortController()
    setCouponPreview(null)
    setCouponChecking(true)
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch('/api/coupons/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: code || undefined,
            memberId: member || undefined,
            subtotal,
            shipping: SHIPPING_FEE_PKR,
          }),
          signal: controller.signal,
        })
        const result = (await response.json()) as CouponPreview
        if (!controller.signal.aborted) setCouponPreview(result)
      } catch {
        if (!controller.signal.aborted) setCouponPreview({ valid: false, error: 'Discount could not be checked.' })
      } finally {
        if (!controller.signal.aborted) setCouponChecking(false)
      }
    }, 300)

    return () => {
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [couponCode, memberId, subtotal])

  const shippingDiscount = couponPreview?.valid ? couponPreview.shippingDiscount ?? 0 : 0
  const chargedShipping = Math.max(0, SHIPPING_FEE_PKR - shippingDiscount)
  const couponDiscount = couponPreview?.valid ? couponPreview.couponDiscount ?? couponPreview.discount ?? 0 : 0
  const memberDiscount = couponPreview?.valid ? couponPreview.memberDiscount ?? 0 : 0
  const totalDiscount = couponPreview?.valid ? couponPreview.discount ?? couponDiscount + memberDiscount : 0
  const payableTotal = Math.max(0, subtotal + chargedShipping - totalDiscount)
  const itemsJson = JSON.stringify(selectedItems)
  const selectedProduct = selectedProductId ? productMap.get(selectedProductId) : null
  const selectedProductStock = selectedProduct ? evaluateProductOrderability(selectedProduct, addQuantity) : null

  function selectProduct(product: FastInvoiceProduct) {
    setSelectedProductId(product.id)
    setSearchTerm(`${product.name} - ${format(getProductPricing(product).displayPrice)}`)
    setPickerOpen(false)
  }

  function selectCustomer(customer: AdminInvoiceCustomer) {
    setCustomerId(customer.id)
    setCustomerSearch(`${customer.name}${customer.member_id ? ` · ${customer.member_id}` : ''}`)
    setCustomerPickerOpen(false)
    setCustomerDetails({
      fullName: customer.name,
      email: customer.email ?? '',
      phone: customer.phone ?? '',
      address: customer.address ?? '',
      city: customer.city ?? 'Lahore',
      zip: customer.zip ?? '',
      notes: customer.notes ?? '',
      memberId: customer.member_id ?? '',
    })
    if (requiredMemberId) setMemberId(customer.member_id ?? '')
  }

  function updateCustomerField(field: keyof typeof customerDetails, value: string) {
    setCustomerDetails((current) => ({ ...current, [field]: value }))
  }

  function updateNewCustomerField(field: keyof typeof newCustomerDraft, value: string) {
    setNewCustomerDraft((current) => ({ ...current, [field]: value }))
  }

  function openCustomerCreator() {
    setCustomerCreateState({ success: false })
    setNewCustomerDraft({
      name: customerDetails.fullName,
      email: customerDetails.email,
      phone: customerDetails.phone,
      address: customerDetails.address,
      city: customerDetails.city,
      zip: customerDetails.zip,
      memberId: customerDetails.memberId,
      notes: customerDetails.notes,
    })
    setCustomerCreatorOpen(true)
  }

  function saveNewCustomer() {
    const formData = new FormData()
    formData.set('name', newCustomerDraft.name)
    formData.set('email', newCustomerDraft.email)
    formData.set('phone', newCustomerDraft.phone)
    formData.set('address', newCustomerDraft.address)
    formData.set('city', newCustomerDraft.city)
    formData.set('zip', newCustomerDraft.zip)
    formData.set('memberId', newCustomerDraft.memberId)
    formData.set('notes', newCustomerDraft.notes)
    startCustomerTransition(async () => {
      const result = await createFastInvoiceCustomerAction({ success: false }, formData)
      setCustomerCreateState(result)
      if (result.success && result.data) {
        setCustomerOptions((current) => [result.data!, ...current.filter((customer) => customer.id !== result.data!.id)])
        selectCustomer(result.data)
        setCustomerCreatorOpen(false)
      }
    })
  }

  function addSelectedProduct() {
    const product = productMap.get(selectedProductId)
    if (!product) return
    const existing = selectedItems.find((item) => item.productId === selectedProductId)
    const nextQuantity = (existing?.quantity ?? 0) + addQuantity
    const stock = evaluateProductOrderability(product, nextQuantity)
    if (!stock.ok) return

    setSelectedItems((current) => {
      const currentItem = current.find((item) => item.productId === selectedProductId)
      if (currentItem) {
        return current.map((item) => item.productId === selectedProductId ? { ...item, quantity: nextQuantity } : item)
      }
      return [...current, {
        productId: selectedProductId,
        quantity: addQuantity,
        name: product.name,
        price: getProductPricing(product).displayPrice,
        isbn: product.isbn ?? (product.metadata?.isbn as string | undefined),
      }]
    })
    setPreviewReady(false)
  }

  function updateQuantity(productId: string, quantity: number) {
    setSelectedItems((current) => current.map((item) => item.productId === productId ? { ...item, quantity } : item))
    setPreviewReady(false)
  }

  function updateItemField(productId: string, field: 'name' | 'isbn' | 'price', value: string) {
    if (!adminOnly) return
    setSelectedItems((current) => current.map((item) => {
      if (item.productId !== productId) return item
      if (field === 'price') return { ...item, price: value === '' ? undefined : Math.max(0, Number(value) || 0) }
      return { ...item, [field]: value }
    }))
    setPreviewReady(false)
  }

  function updateCouponCode(value: string) {
    setCouponCode(value)
    if (value.trim()) setMemberId('')
  }

  function updateMemberId(value: string) {
    if (memberDiscountLocked) return
    setMemberId(value)
    if (value.trim()) setCouponCode('')
  }

  function removeItem(productId: string) {
    setSelectedItems((current) => current.filter((item) => item.productId !== productId))
    setPreviewReady(false)
  }

  function showPreview() {
    if (!invoiceItems.length) return
    setPreviewReady(true)
  }

  function createCoupon() {
    const formData = new FormData()
    formData.set('code', couponDraft.code)
    formData.set('discountPercent', couponDraft.discountPercent)
    formData.set('maxUses', couponDraft.maxUses)
    startCustomerTransition(async () => {
      const result = await createFastInvoiceCouponAction({ success: false }, formData)
      setCouponCreateState(result)
      if (result.success && result.data) {
        const nextCoupon = { code: result.data.code, active: true, discount_percent: Number(couponDraft.discountPercent), discount_amount: null }
        setCouponOptions((current) => [nextCoupon, ...current.filter((coupon) => coupon.code !== nextCoupon.code)])
        setCouponCode(result.data.code)
        setCouponCreatorOpen(false)
      }
    })
  }

  function createMemberDiscount() {
    const formData = new FormData()
    formData.set('memberId', memberDraft.memberId)
    formData.set('discountPercent', memberDraft.discountPercent)
    if (memberDraft.freeShipping) formData.set('freeShipping', 'on')
    startCustomerTransition(async () => {
      const result = await createFastInvoiceMemberDiscountAction({ success: false }, formData)
      setMemberCreateState(result)
      if (result.success && result.data) {
        const nextMember = { member_id: result.data.memberId, active: true, discount_percent: Number(memberDraft.discountPercent), free_shipping_enabled: memberDraft.freeShipping }
        setMemberOptions((current) => [nextMember, ...current.filter((member) => member.member_id !== nextMember.member_id)])
        setMemberId(result.data.memberId)
        setMemberCreatorOpen(false)
      }
    })
  }

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!previewReady) {
          event.preventDefault()
          showPreview()
        }
      }}
      className="grid w-full max-w-full gap-6 lg:grid-cols-[minmax(0,1fr)_390px]"
    >
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="itemsJson" value={itemsJson} />
      <input type="hidden" name="country" value="Pakistan" />
      <input type="hidden" name="displayCurrency" value={currency} />
      {adminOnly ? <input type="hidden" name="customerId" value={customerId} /> : null}
      {adminOnly ? <input type="hidden" name="documentType" value={documentType} /> : null}

      <section className="min-w-0 space-y-5 rounded-lg border bg-card p-4 sm:p-6">
        {state.error ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p> : null}

        <div className="space-y-3">
          <Label>Items</Label>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_130px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onFocus={() => setPickerOpen(true)}
                onChange={(event) => {
                  setSearchTerm(event.target.value)
                  setPickerOpen(true)
                }}
                placeholder="Search or select book"
                className="rounded-xl pl-9"
              />
              {pickerOpen ? (
                <div className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-xl border bg-background shadow-xl">
                  {filteredProducts.map((product) => {
                    const pricing = getProductPricing(product)
                    const stock = evaluateProductOrderability(product, addQuantity)
                    return (
                      <button
                        key={product.id}
                        type="button"
                        className="flex w-full items-start justify-between gap-4 border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted"
                        onClick={() => selectProduct(product)}
                      >
                        <span className="min-w-0">
                          <span className="block break-words font-medium">{product.name}</span>
                          <span className="text-xs text-muted-foreground">{product.category.replace(/-/g, ' ')}</span>
                          {product.isbn ? <span className="mt-1 block font-mono text-xs text-muted-foreground">ISBN: {product.isbn}</span> : null}
                          {stock.message ? <span className="mt-1 block text-xs text-amber-700">{stock.message}</span> : null}
                        </span>
                        <span className="shrink-0 font-bold text-[#1D4ED8]">{format(pricing.displayPrice)}</span>
                      </button>
                    )
                  })}
                </div>
              ) : null}
            </div>
            <QuantityStepper
              value={addQuantity}
              min={1}
              max={selectedProductId ? getProductPurchaseLimit(productMap.get(selectedProductId) ?? {}) : 999}
              onChange={setAddQuantity}
              className="w-fit rounded-xl"
            />
            <Button
              type="button"
              className="rounded-xl bg-[#1D4ED8]"
              onClick={addSelectedProduct}
              disabled={!selectedProductId || selectedProductStock?.ok === false}
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-3 sm:hidden">
            {invoiceItems.map((item, index) => (
              <article key={item.productId} className="rounded-xl border bg-background p-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] font-mono text-xs font-bold text-[#1D4ED8]">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="break-words font-semibold">{item.name}</p>
                    {item.isbn ? <p className="mt-1 font-mono text-xs text-muted-foreground">ISBN: {item.isbn}</p> : null}
                    {item.stock.message ? <p className="mt-1 text-xs font-medium text-amber-700">{item.stock.message}</p> : null}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 rounded-lg text-destructive"
                    onClick={() => removeItem(item.productId)}
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {adminOnly ? (
                  <div className="mt-3 grid gap-2 rounded-lg bg-[#F8FBFF] p-3 sm:grid-cols-3">
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs">Item name</Label>
                      <Input value={item.name} onChange={(event) => updateItemField(item.productId, 'name', event.target.value)} className="rounded-lg bg-white" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">ISBN</Label>
                      <Input value={item.isbn ?? ''} onChange={(event) => updateItemField(item.productId, 'isbn', event.target.value)} className="rounded-lg bg-white font-mono" />
                    </div>
                    <div className="space-y-1 sm:col-span-3">
                      <Label className="text-xs">Unit price</Label>
                      <Input type="number" min="0" step="0.01" value={item.price} onChange={(event) => updateItemField(item.productId, 'price', event.target.value)} className="rounded-lg bg-white" />
                    </div>
                  </div>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quantity</span>
                  <QuantityStepper
                    value={item.quantity}
                    min={1}
                    max={getProductPurchaseLimit(item.product)}
                    onChange={(quantity) => updateQuantity(item.productId, quantity)}
                    className="w-fit rounded-lg"
                    buttonClassName="h-8 w-8"
                    inputClassName="h-8 w-10 text-xs"
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg bg-muted/60 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="mt-1 font-semibold">{format(item.price)}</p>
                  </div>
                  <div className="rounded-lg bg-muted/60 px-3 py-2 text-right">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="mt-1 font-bold text-[#1D4ED8]">{format(item.lineTotal)}</p>
                  </div>
                </div>
              </article>
            ))}
            {!invoiceItems.length ? (
              <div className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
                No items selected.
              </div>
            ) : null}
          </div>

          <div className="hidden overflow-x-auto rounded-xl border sm:block">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="bg-muted/70 text-left">
                <tr>
                  <th className="w-12 px-4 py-3 text-center">#</th>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoiceItems.map((item, index) => (
                  <tr key={item.productId}>
                    <td className="px-4 py-3 text-center font-mono text-xs text-slate-500">{index + 1}</td>
                    <td className="px-4 py-3">
                      {adminOnly ? (
                        <Input value={item.name} onChange={(event) => updateItemField(item.productId, 'name', event.target.value)} className="rounded-lg bg-background" />
                      ) : (
                        <p className="font-semibold">{item.name}</p>
                      )}
                      {adminOnly ? (
                        <Input value={item.isbn ?? ''} onChange={(event) => updateItemField(item.productId, 'isbn', event.target.value)} placeholder="ISBN" className="mt-2 rounded-lg bg-background font-mono text-xs" />
                      ) : item.isbn ? <p className="mt-1 font-mono text-xs text-muted-foreground">ISBN: {item.isbn}</p> : null}
                      {item.stock.message ? <p className="mt-1 text-xs font-medium text-amber-700">{item.stock.message}</p> : null}
                    </td>
                    <td className="px-4 py-3">
                      <QuantityStepper
                        value={item.quantity}
                        min={1}
                        max={getProductPurchaseLimit(item.product)}
                        onChange={(quantity) => updateQuantity(item.productId, quantity)}
                        className="mx-auto w-fit rounded-lg"
                        buttonClassName="h-8 w-8"
                        inputClassName="h-8 w-10 text-xs"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {adminOnly ? (
                        <Input type="number" min="0" step="0.01" value={item.price} onChange={(event) => updateItemField(item.productId, 'price', event.target.value)} className="ml-auto w-28 rounded-lg bg-background text-right" />
                      ) : format(item.price)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{format(item.lineTotal)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button type="button" variant="ghost" size="icon-sm" className="rounded-lg text-destructive" onClick={() => removeItem(item.productId)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {!invoiceItems.length ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No items selected.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        {adminOnly ? (
          <div className="space-y-3 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Label htmlFor="fast-customer-search">Assign invoice to customer *</Label>
                <p className="mt-1 text-xs text-slate-600">Select a customer to load their saved contact and delivery details. You can still adjust them for this invoice.</p>
              </div>
              <Button type="button" variant="outline" size="sm" className="rounded-lg border-[#93C5FD] bg-white" onClick={openCustomerCreator}>
                <Plus className="h-4 w-4" /> Customer
              </Button>
            </div>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#1D4ED8]" />
              <Input
                id="fast-customer-search"
                value={customerSearch}
                onFocus={() => setCustomerPickerOpen(true)}
                onChange={(event) => {
                  setCustomerSearch(event.target.value)
                  setCustomerId('')
                  setCustomerPickerOpen(true)
                }}
                placeholder="Search name, email, phone, or member ID"
                className="rounded-xl border-[#BFDBFE] bg-white pl-9"
              />
              {customerPickerOpen ? (
                <div className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-xl border bg-background shadow-xl">
                  {filteredCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      className="flex w-full items-start justify-between gap-3 border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted"
                      onClick={() => selectCustomer(customer)}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{customer.name || 'Unnamed customer'}</span>
                        <span className="mt-1 block truncate text-xs text-muted-foreground">{customer.email || customer.phone || 'No contact saved'}</span>
                      </span>
                      <span className="shrink-0 text-right text-xs text-muted-foreground">
                        {customer.member_id ? <span className="block font-mono">{customer.member_id}</span> : null}
                        {customer.source === 'directory' ? 'Saved customer' : 'Existing customer'}
                      </span>
                    </button>
                  ))}
                  {!filteredCustomers.length ? <p className="px-3 py-4 text-sm text-muted-foreground">No matching customers. Use the Customer button to add one.</p> : null}
                </div>
              ) : null}
            </div>
            {customerCreatorOpen ? (
              <div className="space-y-3 rounded-xl border border-[#93C5FD] bg-white p-3">
                <div>
                  <p className="font-semibold text-slate-900">Add customer for future invoices</p>
                  <p className="mt-1 text-xs text-muted-foreground">This saves the customer in the admin directory and selects them for this invoice.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input value={newCustomerDraft.name} onChange={(event) => updateNewCustomerField('name', event.target.value)} placeholder="Full name *" className="rounded-lg" />
                  <Input type="email" value={newCustomerDraft.email} onChange={(event) => updateNewCustomerField('email', event.target.value)} placeholder="Email (optional)" className="rounded-lg" />
                  <Input value={newCustomerDraft.phone} onChange={(event) => updateNewCustomerField('phone', event.target.value)} placeholder="Phone *" className="rounded-lg" />
                  <Input value={newCustomerDraft.city} onChange={(event) => updateNewCustomerField('city', event.target.value)} placeholder="City" className="rounded-lg" />
                  <Input value={newCustomerDraft.address} onChange={(event) => updateNewCustomerField('address', event.target.value)} placeholder="Address" className="rounded-lg sm:col-span-2" />
                  <Input value={newCustomerDraft.zip} onChange={(event) => updateNewCustomerField('zip', event.target.value)} placeholder="Postal code" className="rounded-lg" />
                  <Input value={newCustomerDraft.memberId} onChange={(event) => updateNewCustomerField('memberId', event.target.value)} placeholder="Member ID (optional)" className="rounded-lg font-mono" />
                  <textarea value={newCustomerDraft.notes} onChange={(event) => updateNewCustomerField('notes', event.target.value)} placeholder="Notes (optional)" rows={2} className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none sm:col-span-2" />
                </div>
                {customerCreateState.error ? <p className="text-xs text-destructive">{customerCreateState.error}</p> : null}
                <div className="flex flex-wrap justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" className="rounded-lg" onClick={() => setCustomerCreatorOpen(false)}>Cancel</Button>
                  <Button type="button" size="sm" className="rounded-lg bg-[#1D4ED8]" onClick={saveNewCustomer} disabled={customerCreatePending}>
                    {customerCreatePending ? 'Saving...' : 'Save customer'}
                  </Button>
                </div>
              </div>
            ) : null}
            {customerId ? <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><Check className="h-3.5 w-3.5" /> Customer selected. Details loaded below.</p> : <p className="text-xs font-medium text-amber-700">Choose a customer before submitting this admin invoice.</p>}
          </div>
        ) : null}

        <div className={`grid gap-4 rounded-xl border border-[#BFDBFE] bg-[#F8FBFF] p-4 ${adminOnly ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
            <div className="space-y-2">
              <Label htmlFor="fast-po-number">PO Number (optional)</Label>
              <Input id="fast-po-number" name="poNumber" value={poNumber} onChange={(event) => setPoNumber(event.target.value)} placeholder="Shown below the invoice number" className="rounded-xl bg-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fast-ntn-number">NTN Number (optional)</Label>
              <Input id="fast-ntn-number" name="ntnNumber" value={ntnNumber} onChange={(event) => setNtnNumber(event.target.value)} placeholder="Shown below the invoice number" className="rounded-xl bg-white" />
            </div>
            {adminOnly ? (
              <div className="space-y-2">
                <Label htmlFor="fast-invoice-date">Invoice date (optional)</Label>
                <Input id="fast-invoice-date" name="invoiceDate" type="datetime-local" value={invoiceDate} onChange={(event) => setInvoiceDate(event.target.value)} className="rounded-xl bg-white" />
              </div>
            ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fast-name">Full Name *</Label>
            <Input id="fast-name" name="fullName" required minLength={2} maxLength={120} value={customerDetails.fullName} onChange={(event) => updateCustomerField('fullName', event.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fast-email">Email (optional)</Label>
            <Input id="fast-email" name="email" type="email" value={customerDetails.email} onChange={(event) => updateCustomerField('email', event.target.value)} placeholder="For invoice email, if available" className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fast-phone">Phone *</Label>
            <Input id="fast-phone" name="phone" required value={customerDetails.phone} onChange={(event) => updateCustomerField('phone', event.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fast-city">City *</Label>
            <Input id="fast-city" name="city" required value={customerDetails.city} onChange={(event) => updateCustomerField('city', event.target.value)} className="rounded-xl" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fast-address">Address *</Label>
          <Input id="fast-address" name="address" required minLength={5} value={customerDetails.address} onChange={(event) => updateCustomerField('address', event.target.value)} className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fast-notes">Notes / other information (optional)</Label>
          <textarea id="fast-notes" name="notes" value={customerDetails.notes} onChange={(event) => updateCustomerField('notes', event.target.value)} placeholder="Optional note to print on the invoice" rows={3} maxLength={2000} className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring" />
        </div>
        {adminOnly ? (
          <div className="space-y-2">
            <Label htmlFor="fast-customer-member">Customer Member ID</Label>
            <Input id="fast-customer-member" name="customerMemberId" value={customerDetails.memberId} onChange={(event) => updateCustomerField('memberId', event.target.value)} className="rounded-xl font-mono" />
          </div>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="fast-zip">Postal Code</Label>
            <Input id="fast-zip" name="zip" value={customerDetails.zip} onChange={(event) => updateCustomerField('zip', event.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="fast-coupon">Coupon Code</Label>
              {adminOnly ? <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => { setCouponCreateState({ success: false }); setCouponCreatorOpen((open) => !open) }}>Create new</Button> : null}
            </div>
            <Input
              id="fast-coupon"
              name="couponCode"
              list={adminOnly ? 'fast-coupon-options' : undefined}
              value={couponCode}
              disabled={memberDiscountLocked}
              onChange={(event) => updateCouponCode(event.target.value)}
              className="rounded-xl"
            />
            {adminOnly ? <datalist id="fast-coupon-options">{couponOptions.filter((coupon) => coupon.active !== false).map((coupon) => <option key={coupon.code} value={coupon.code} />)}</datalist> : null}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="fast-member">{adminOnly ? 'Discount Member ID (optional)' : 'Member ID'}</Label>
              {adminOnly && !memberDiscountLocked ? <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => { setMemberCreateState({ success: false }); setMemberCreatorOpen((open) => !open) }}>Create new</Button> : null}
            </div>
            <Input
              id="fast-member"
              name="memberId"
              list={adminOnly ? 'fast-member-options' : undefined}
              value={memberId}
              readOnly={memberDiscountLocked}
              onChange={(event) => updateMemberId(event.target.value)}
              className="rounded-xl font-mono"
            />
            {adminOnly ? <datalist id="fast-member-options">{memberOptions.filter((member) => member.active !== false).map((member) => <option key={member.member_id} value={member.member_id} />)}</datalist> : null}
          </div>
        </div>
        {adminOnly && couponCreatorOpen ? (
          <div className="space-y-3 rounded-xl border border-[#BFDBFE] bg-[#F8FBFF] p-4">
            <p className="font-semibold">Create coupon for future invoices</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Input value={couponDraft.code} onChange={(event) => setCouponDraft((current) => ({ ...current, code: event.target.value }))} placeholder="Coupon code *" className="rounded-lg bg-white" />
              <Input type="number" min="1" max="100" value={couponDraft.discountPercent} onChange={(event) => setCouponDraft((current) => ({ ...current, discountPercent: event.target.value }))} placeholder="Discount % *" className="rounded-lg bg-white" />
              <Input type="number" min="1" value={couponDraft.maxUses} onChange={(event) => setCouponDraft((current) => ({ ...current, maxUses: event.target.value }))} placeholder="Max uses (optional)" className="rounded-lg bg-white" />
            </div>
            {couponCreateState.error ? <p className="text-xs text-destructive">{couponCreateState.error}</p> : null}
            <div className="flex justify-end">
              <Button type="button" size="sm" className="rounded-lg bg-[#1D4ED8]" onClick={createCoupon} disabled={customerCreatePending}>Save coupon</Button>
            </div>
          </div>
        ) : null}
        {adminOnly && memberCreatorOpen ? (
          <div className="space-y-3 rounded-xl border border-[#BFDBFE] bg-[#F8FBFF] p-4">
            <p className="font-semibold">Create member discount for future invoices</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Input value={memberDraft.memberId} onChange={(event) => setMemberDraft((current) => ({ ...current, memberId: event.target.value }))} placeholder="Member ID *" className="rounded-lg bg-white font-mono" />
              <Input type="number" min="1" max="100" value={memberDraft.discountPercent} onChange={(event) => setMemberDraft((current) => ({ ...current, discountPercent: event.target.value }))} placeholder="Discount % *" className="rounded-lg bg-white" />
              <label className="flex items-center gap-2 rounded-lg border bg-white px-3 text-sm"><input type="checkbox" checked={memberDraft.freeShipping} onChange={(event) => setMemberDraft((current) => ({ ...current, freeShipping: event.target.checked }))} /> Free shipping</label>
            </div>
            {memberCreateState.error ? <p className="text-xs text-destructive">{memberCreateState.error}</p> : null}
            <div className="flex justify-end">
              <Button type="button" size="sm" className="rounded-lg bg-[#1D4ED8]" onClick={createMemberDiscount} disabled={customerCreatePending}>Save Member ID</Button>
            </div>
          </div>
        ) : null}
        {(couponCode.trim() || memberId.trim()) && (
          <p className={`text-xs ${couponChecking ? 'text-muted-foreground' : couponPreview?.valid ? 'text-emerald-700' : 'text-destructive'}`}>
            {couponChecking
              ? 'Checking discount...'
              : couponPreview?.valid
                ? `Discount preview: ${format(totalDiscount + shippingDiscount)}`
                : couponPreview?.error ?? 'Discount could not be checked.'}
          </p>
        )}

        <div className="space-y-3 border-t pt-5">
          <Label>Payment Method *</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            {paymentOptions.map((option) => (
              <label
                key={option.value}
                className={`cursor-pointer rounded-xl border p-4 ${paymentMethod === option.value ? 'border-[#1D4ED8] bg-[#EFF6FF]' : 'bg-background'}`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={option.value}
                  checked={paymentMethod === option.value}
                  onChange={() => {
                    setPaymentMethod(option.value)
                    if (adminOnly && option.value !== 'cod') setDocumentType('estimate')
                  }}
                  className="sr-only"
                />
                <span className="block font-semibold">{option.title}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{option.description}</span>
              </label>
            ))}
          </div>
          {shopPaymentNeedsReceipt(paymentMethod) ? (
            <p className="rounded-xl bg-[#EFF6FF] px-3 py-2 text-sm text-[#1D4ED8]">
              Payment receipt can be uploaded from the order page after invoice creation.
            </p>
          ) : null}
        </div>
      </section>

      <aside className="min-w-0 h-fit rounded-lg border bg-card p-4 sm:p-6 lg:sticky lg:top-24">
        <div className="mb-5">
          <p className="text-sm font-semibold text-[#1D4ED8]">Invoice Preview</p>
          <h2 className="mt-1 text-2xl font-bold">Fast order</h2>
        </div>
        {previewReady ? (
          <FastPreview
            items={invoiceItems}
            totalQuantity={totalQuantity}
            subtotal={subtotal}
            shipping={SHIPPING_FEE_PKR}
            shippingDiscount={shippingDiscount}
            totalDiscount={totalDiscount}
            payableTotal={payableTotal}
            paymentMethod={paymentMethod}
            format={format}
            currency={currency}
          />
        ) : (
          <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
            Preview appears after items and required customer details are ready.
          </div>
        )}
        <div className="mt-6 space-y-3 border-t pt-5">
          {previewReady ? (
            <>
              {adminOnly ? (
                <div className="space-y-2 rounded-xl border border-[#BFDBFE] bg-[#F8FBFF] p-3">
                  <p className="text-sm font-semibold">Choose document after review</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant={documentType === 'invoice' ? 'default' : 'outline'} className="rounded-lg" onClick={() => setDocumentType('invoice')} disabled={paymentMethod !== 'cod'}>Invoice</Button>
                    <Button type="button" variant={documentType === 'estimate' ? 'default' : 'outline'} className="rounded-lg" onClick={() => setDocumentType('estimate')}>Estimate</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Estimates show EST without an invoice number and do not deduct stock until the admin confirms payment or delivery.</p>
                </div>
              ) : null}
              <Button type="submit" disabled={pending || !invoiceItems.length || (adminOnly && !customerId)} className="w-full rounded-xl bg-[#D30000] hover:bg-[#D30000]/90">
                {pending ? 'Creating document...' : documentType === 'estimate' ? 'Create Estimate' : 'Create Invoice'}
              </Button>
              <Button type="button" variant="outline" className="w-full rounded-xl" onClick={() => setPreviewReady(false)}>
                Back to Edit
              </Button>
            </>
          ) : (
            <Button type="button" disabled={!invoiceItems.length} onClick={showPreview} className="w-full rounded-xl bg-[#1D4ED8]">
              Preview Invoice Now
            </Button>
          )}
          {currency === 'USD' ? (
            <p className="text-center text-xs text-muted-foreground">
              Payment remains in PKR at 1 USD = {settings.usdToPkrRate.toLocaleString('en-PK')} PKR.
            </p>
          ) : null}
        </div>
      </aside>
    </form>
  )
}

function FastPreview({
  items,
  totalQuantity,
  subtotal,
  shipping,
  shippingDiscount,
  totalDiscount,
  payableTotal,
  paymentMethod,
  format,
  currency,
}: {
  items: Array<SelectedItem & {
    product: FastInvoiceProduct
    name: string
    isbn?: string
    price: number
    lineTotal: number
    stock: { status: ProductStockStatus; message?: string; ok: boolean }
  }>
  totalQuantity: number
  subtotal: number
  shipping: number
  shippingDiscount: number
  totalDiscount: number
  payableTotal: number
  paymentMethod: ShopPaymentMethod
  format: (amount: number) => string
  currency: string
}) {
  return (
    <div className="space-y-5 text-sm">
      <div className="rounded-lg bg-[#1D4ED8] p-4 text-white">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-100">Phonics Club</p>
        <p className="mt-2 text-xl font-bold">Draft invoice</p>
      </div>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={item.productId} className="rounded-lg bg-muted/50 p-3">
            <div className="flex justify-between gap-3">
              <span className="flex min-w-0 gap-2">
                <span className="font-mono text-xs font-semibold text-slate-500">{index + 1}.</span>
                <span className="min-w-0">
                  <span className="block break-words font-semibold">{item.name}</span>
                  {item.isbn ? <span className="mt-1 block font-mono text-xs text-muted-foreground">ISBN: {item.isbn}</span> : null}
                  <span className="text-xs text-muted-foreground">{item.quantity} x {format(item.price)}</span>
                </span>
              </span>
              <span className="shrink-0 font-bold">{format(item.lineTotal)}</span>
            </div>
            {item.stock.message ? <p className="mt-2 text-xs font-medium text-amber-700">{item.stock.message}</p> : null}
          </li>
        ))}
      </ul>
      <div className="space-y-2 border-t pt-4">
        <div className="flex justify-between"><span>Total quantity</span><span>{totalQuantity}</span></div>
        <div className="flex justify-between"><span>Subtotal</span><span>{format(subtotal)}</span></div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span className="text-right">
            {shippingDiscount > 0 ? (
              <>
                <span className="block font-semibold">Free</span>
                <span className="block text-xs text-muted-foreground">was {format(shipping)}</span>
              </>
            ) : (
              format(shipping)
            )}
          </span>
        </div>
        {totalDiscount > 0 ? <div className="flex justify-between text-[#D30000]"><span>Discount</span><span>-{format(totalDiscount)}</span></div> : null}
        <div className="flex justify-between text-lg font-bold text-[#1D4ED8]">
          <span>Total</span>
          <span className="text-right">
            <span className="block">{format(payableTotal)}</span>
            {currency === 'USD' ? (
              <span className="mt-1 block text-xs font-medium text-muted-foreground">
                {formatCurrency(payableTotal, 'PKR', { freeLabel: false, useCode: true })}
              </span>
            ) : null}
          </span>
        </div>
        <CurrencyDisplayNotice />
      </div>
      <div className="rounded-lg border p-3">
        <p className="font-semibold">Payment</p>
        <p className="mt-1 text-muted-foreground">{shopPaymentLabel(paymentMethod)}</p>
      </div>
    </div>
  )
}
