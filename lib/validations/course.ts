import { z } from 'zod'

export const courseSchema = z.object({
  title: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  excerpt: z.string().optional(),
  price: z.coerce.number().min(0),
  category: z.string().min(1),
  level: z.string().default('beginner'),
  duration: z.string().optional(),
  instructor: z.string().optional(),
  instructor_bio: z.string().optional(),
  image_url: z.string().optional().nullable(),
  objectives: z.string().optional(),
  requirements: z.string().optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  featured: z.coerce.boolean().default(false),
  published: z.coerce.boolean().default(true),
})

export type CourseInput = z.infer<typeof courseSchema>
