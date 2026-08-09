import { z } from 'zod'

const imagePath = z.string().refine(
  (s) => s.startsWith('/') || s.startsWith('http'),
  'Image must be a path or URL'
)

export const productSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  description: z.string().optional(),
  product_number: z.string().trim().optional().nullable(),
  sku: z.string().trim().optional().nullable(),
  barcode: z.string().trim().optional().nullable(),
  alternate_barcode: z.string().trim().optional().nullable(),
  isbn: z.string().min(3, 'ISBN is required'),
  price: z.coerce.number().min(0),
  compare_at_price: z.coerce.number().min(0).optional().nullable(),
  category: z.string().min(1),
  images: z.array(imagePath).default([]),
  stock: z.coerce.number().int().min(0).default(0),
  low_stock_threshold: z.coerce.number().int().min(0).default(20),
  stock_management_enabled: z.coerce.boolean().default(true),
  backorder_policy: z.enum(['disabled', 'enabled', 'enabled_with_warning']).default('disabled'),
  max_backorder_quantity: z.coerce.number().int().min(0).optional().nullable(),
  max_purchase_quantity: z.coerce.number().int().min(1).optional().nullable(),
  estimated_availability_date: z.string().optional().nullable(),
  backorder_message: z.string().trim().max(240).optional().nullable(),
  sale_enabled: z.coerce.boolean().default(false),
  sale_price: z.coerce.number().min(0).optional().nullable(),
  sale_percentage: z.coerce.number().min(0).max(100).optional().nullable(),
  sale_badge_text: z.string().trim().max(32).optional().nullable(),
  featured: z.coerce.boolean().default(false),
  published: z.coerce.boolean().default(true),
})

export type ProductInput = z.infer<typeof productSchema>
