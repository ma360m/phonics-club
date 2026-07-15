import type { Course } from '@/types/database'

export interface LmsPathwayNode {
  title: string
  slug: string
  description: string
  children?: LmsPathwayNode[]
}

export const TEACHING_OF_ENGLISH_PATHWAY: LmsPathwayNode = {
  title: 'Teaching of English',
  slug: 'teaching-of-english',
  description: 'A scalable pathway for phonics, literacy, Cambridge preparation and teacher development.',
  children: [
    {
      title: 'Early Years',
      slug: 'early-years',
      description: 'Foundational phonics, hybrid teaching and curriculum alignment.',
      children: [
        {
          title: 'Jolly Phonics',
          slug: 'jolly-phonics',
          description: 'Interactive lessons, reading modes, practice, quiz and certificate readiness.',
        },
        {
          title: 'Hybrid Teaching Models',
          slug: 'hybrid-teaching-models',
          description: 'Blended classroom routines and online support.',
        },
        {
          title: 'SNC Curriculum',
          slug: 'snc-curriculum',
          description: 'Single National Curriculum alignment for early English.',
        },
      ],
    },
    {
      title: 'Junior School',
      slug: 'junior-school',
      description: 'Reading, writing, Jolly Literacy and hybrid teaching models.',
      children: [
        {
          title: 'Jolly Literacy',
          slug: 'jolly-literacy',
          description: 'Grammar, spelling, reading and writing routines for junior learners.',
        },
      ],
    },
    {
      title: 'High School / Pre O-Level',
      slug: 'high-school-pre-o-level',
      description: 'Cambridge Key Stage, metric English and pre O-Level preparation.',
      children: [
        {
          title: 'Cambridge Key Stage / Metric',
          slug: 'cambridge-key-stage-metric',
          description: 'Structured English preparation for higher grades.',
        },
      ],
    },
    {
      title: 'A Level',
      slug: 'a-level',
      description: 'Advanced English support and exam-oriented course pathways.',
    },
    {
      title: 'Higher Education',
      slug: 'higher-education',
      description: 'Professional development, teacher certifications, webinars and recorded workshops.',
    },
  ],
}

export function getCoursePathwayLabel(course: Course): string {
  const meta = course.metadata ?? {}
  const pathway = typeof meta.pathway === 'string' ? meta.pathway : TEACHING_OF_ENGLISH_PATHWAY.title
  const stage = typeof meta.stage === 'string' ? meta.stage : null
  const family = typeof meta.courseFamily === 'string' ? meta.courseFamily : null
  return [pathway, stage, family].filter(Boolean).join(' / ')
}

