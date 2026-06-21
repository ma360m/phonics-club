import { z } from 'zod'

const imagePath = z.string().refine(
  (s) => s.startsWith('/') || s.startsWith('http'),
  'Image must be a path or URL'
)

export const productSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  description: z.string().optional(),
  isbn: z.string().min(3, 'ISBN is required'),
  price: z.coerce.number().min(0),
  compare_at_price: z.coerce.number().min(0).optional().nullable(),
  category: z.string().min(1),
  images: z.array(imagePath).default([]),
  stock: z.coerce.number().int().min(0).default(0),
  featured: z.coerce.boolean().default(false),
  published: z.coerce.boolean().default(true),
})

export type ProductInput = z.infer<typeof productSchema>
