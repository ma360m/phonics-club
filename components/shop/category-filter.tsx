'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { PRODUCT_CATEGORY_LABELS, PRODUCT_CATEGORIES } from '@/lib/constants'

export function CategoryFilter({
  currentCategory,
  currentCollection,
  availableCategories,
}: {
  currentCategory?: string
  currentCollection?: string
  availableCategories?: string[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set('category', value)
    else params.delete('category')

    if (currentCollection) params.set('collection', currentCollection)

    const query = params.toString()
    router.push(`/shop${query ? `?${query}` : ''}`)
  }

  const categorySet = new Set(availableCategories ?? [])
  const categories = availableCategories?.length
    ? PRODUCT_CATEGORIES.filter((category) => categorySet.has(category))
    : PRODUCT_CATEGORIES

  return (
    <div className="w-full space-y-3">
      <p className="text-sm font-semibold">Programme</p>
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max gap-2">
          <button
            type="button"
            onClick={() => handleChange('')}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              !currentCategory
                ? 'border-[#1D4ED8] bg-[#1D4ED8] text-white'
                : 'border-border bg-background hover:border-[#1D4ED8] hover:text-[#1D4ED8]'
            }`}
          >
            All programmes
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleChange(cat)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                currentCategory === cat
                  ? 'border-[#1D4ED8] bg-[#1D4ED8] text-white'
                  : 'border-border bg-background hover:border-[#1D4ED8] hover:text-[#1D4ED8]'
              }`}
            >
              {PRODUCT_CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
