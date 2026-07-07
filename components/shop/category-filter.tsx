'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { PRODUCT_CATEGORY_LABELS } from '@/lib/constants'
import { PRODUCT_CATEGORIES } from '@/lib/constants'

export function CategoryFilter({ currentCategory }: { currentCategory?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('category', value)
    } else {
      params.delete('category')
    }

    const query = params.toString()
    router.push(`/shop${query ? `?${query}` : ''}`)
  }

  return (
    <label className="flex flex-col gap-2 text-sm font-medium">
      <span>Programme</span>
      <select
        name="category"
        value={currentCategory ?? ''}
        onChange={(event) => handleChange(event.target.value)}
        className="min-w-[240px] rounded-xl border bg-background px-3 py-2 text-sm"
      >
        <option value="">All programmes</option>
        {PRODUCT_CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {PRODUCT_CATEGORY_LABELS[cat] ?? cat}
          </option>
        ))}
      </select>
    </label>
  )
}
