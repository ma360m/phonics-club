import { z } from 'zod'

export const blogGalleryImageSchema = z.object({
  src: z.string().url(),
  alt: z.string().max(160).optional().nullable(),
  caption: z.string().max(240).optional().nullable(),
})

export const blogPostSchema = z.object({
  title: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  excerpt: z.string().optional(),
  content: z.string().min(10),
  category: z.string().default('general'),
  tags: z.string().optional(),
  cover_image: z.string().url().optional().nullable(),
  gallery_images: z.array(blogGalleryImageSchema).default([]),
  published: z.coerce.boolean().default(false),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
})

export type BlogPostInput = z.infer<typeof blogPostSchema>
