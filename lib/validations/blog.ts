import { z } from 'zod'

export const blogPostSchema = z.object({
  title: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  excerpt: z.string().optional(),
  content: z.string().min(10),
  category: z.string().default('general'),
  tags: z.string().optional(),
  cover_image: z.string().url().optional().nullable(),
  published: z.coerce.boolean().default(false),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
})

export type BlogPostInput = z.infer<typeof blogPostSchema>
