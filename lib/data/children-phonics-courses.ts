import type { Course, CurriculumModule } from '@/types/database'

const now = new Date().toISOString()

function module(title: string, description: string): CurriculumModule {
  return {
    title,
    description,
    lessons: [],
  }
}

const standardActivityTypes = [
  'Sound Introduction',
  'Sound Pronunciation Video',
  'Poem or Song',
  'Story',
  'Action',
  'Flashcard',
  'Formation Demo',
  'Trace and Write',
  'Listen and Choose',
  'Picture Match',
  'Blending',
  'Segmenting',
  'Quick Review',
]

export const CHILDREN_PHONICS_COURSES: Course[] = [
  {
    id: 'course-jp-sounds-groups-1-3',
    title: 'Blending and Segmenting Group 1-3',
    slug: 'jolly-phonics-sounds-groups-1-3',
    subtitle: 'Learn the first 18 letter sounds through songs, actions, flashcards, formation and interactive activities.',
    description:
      'Jolly Phonics Sounds: Groups 1-3 is an engaging, interactive phonics course designed for young learners beginning their literacy journey. Through songs, stories, actions, flashcards, letter formation, tracing activities, listening games, blending, and segmenting, children will learn the first 18 letter sounds of the Jolly Phonics programme in a fun and systematic way.\n\nEach lesson is carefully structured to build confidence through hands-on practice and positive reinforcement, helping children develop strong foundations in early reading and writing while learning at their own pace.',
    excerpt: 'A beginner children\'s phonics course covering the first 18 Jolly Phonics sounds.',
    price: 2500,
    category: 'children-courses',
    level: 'beginner',
    duration: 'Self-paced',
    instructor: 'Phonics Club',
    instructor_bio: 'Phonics Club supports young learners with structured, joyful synthetic phonics practice.',
    image_url: '/images/courses/Blending_Segmenting_Group_1-3.png',
    thumbnail_url: '/images/courses/Blending_Segmenting_Group_1-3.png',
    banner_url: '/images/courses/Blending_Segmenting_Group_1-3.png',
    curriculum: [
      module('Sound Group 1 — s, a, t, i, p, n', 'Children learn s, a, t, i, p, and n through the existing sound-group lesson structure.'),
      module('Sound Group 2 — c/k, e, h, r, m, d', 'Children practise the /k/ sound spellings with e, h, r, m, and d.'),
      module('Sound Group 3 — g, o, u, l, f, b', 'Children continue with g, o, u, l, f, and b before the review module.'),
      module('Groups 1–3 Blending and Segmenting Review', 'Children review Groups 1-3 sounds through blending and segmenting practice before the final quiz.'),
    ],
    objectives: [
      'Recognise and pronounce the first 18 Jolly Phonics letter sounds.',
      'Associate each sound with its corresponding letter.',
      'Form letters correctly using guided demonstrations and tracing activities.',
      'Identify beginning sounds in familiar words.',
      'Blend simple sounds together to read short words.',
      'Segment simple words into individual sounds.',
      'Strengthen listening and sound discrimination skills.',
      'Build confidence through interactive games and activities.',
      'Develop early reading and writing readiness.',
    ],
    requirements: [
      'Recommended for children aged 4 years and above.',
      'No previous phonics knowledge is required.',
      'Adult guidance is recommended for younger learners.',
      'A computer, tablet, or touchscreen device is recommended for tracing activities.',
      'Internet connection required for videos and interactive exercises.',
    ],
    seo_title: 'Blending and Segmenting Group 1-3',
    seo_description: 'Beginner children\'s phonics course covering the first 18 Jolly Phonics sounds with flashcards, songs, tracing, blending and segmenting.',
    rating: 4.9,
    students_count: 0,
    is_free: false,
    certificate_enabled: false,
    featured: true,
    published: true,
    metadata: {
      lessons: 42,
      modules: 4,
      sounds: 18,
      quizzes: 1,
      format: 'interactive',
      certificateEnabled: false,
      instructorHelpEnabled: true,
      instructorHelpTotalPrice: 5000,
      instructorHelpLabel: 'Course + instructor help',
      instructorHelpNote: 'Includes guided instructor support alongside course access.',
      instructorHelpContactUrl: '/contact?subject=Instructor%20help%20for%20Groups%201-3',
      childSoundCourse: true,
      coursePart: 1,
      soundGroups: ['Group 1', 'Group 2', 'Group 3'],
      soundsIncluded: ['s', 'a', 't', 'i', 'p', 'n', 'c_k', 'e', 'h', 'r', 'm', 'd', 'g', 'o', 'u', 'l', 'f', 'b'],
      standardActivityTypes,
      contentPolicy: 'Instructor uploads approved pronunciation, poem, story, action, formation and practice media before children access activities.',
      highlights: [
        'First 18 Jolly Phonics sounds',
        'Large flashcards and sound-pronunciation practice',
        'Formation demo and trace-and-write activities',
        'Listening, blending and segmenting games',
        'Simple progress rewards for young learners',
      ],
      intendedAudience: [
        'Children aged 4 years and above',
        'Parents supporting early reading at home',
        'Early years learners beginning synthetic phonics',
      ],
      faq: [
        {
          question: 'Are lesson details visible before enrollment?',
          answer: 'No. The public page shows the course overview and module names. Lesson activities unlock after enrollment.',
        },
        {
          question: 'Does this course include a certificate?',
          answer: 'No. This children\'s course uses stars and progress rewards instead of a certificate.',
        },
      ],
    },
    created_at: now,
    updated_at: now,
  },
  {
    id: 'course-jp-sounds-groups-4-7',
    title: 'Blending and Segmenting Group 4-7',
    slug: 'jolly-phonics-sounds-groups-4-7',
    subtitle: 'Continue the phonics journey with digraphs, alternative sounds, formation, songs, blending and interactive practice.',
    description:
      'Continue your phonics adventure with Jolly Phonics Sounds: Groups 4-7, where children expand their reading skills by learning digraphs, alternative vowel sounds, and more advanced phonics patterns. Through interactive videos, songs, stories, tracing activities, flashcards, blending, and segmenting exercises, learners strengthen their reading fluency while building confidence in independent literacy.\n\nThis course completes all 42 Jolly Phonics sounds, preparing children for more fluent reading, writing, and spelling.',
    excerpt: 'A follow-on children\'s phonics course covering Jolly Phonics sound groups 4-7.',
    price: 2500,
    category: 'children-courses',
    level: 'beginner',
    duration: 'Self-paced',
    instructor: 'Phonics Club',
    instructor_bio: 'Phonics Club supports young learners with structured, joyful synthetic phonics practice.',
    image_url: '/images/courses/Blending_Segmenting_Group_4-7.png',
    thumbnail_url: '/images/courses/Blending_Segmenting_Group_4-7.png',
    banner_url: '/images/courses/Blending_Segmenting_Group_4-7.png',
    curriculum: [
      module('Sound Group 4 — ai, j, oa, ie, ee, or', 'Children explore ai, j, oa, ie, ee, and or through the existing sound-group lesson structure.'),
      module('Sound Group 5 — z, w, ng, v, oo (moon), oo (book)', 'Children develop confidence with z, w, ng, v, oo as in moon, and oo as in book.'),
      module('Sound Group 6 — y, x, ch, sh, th (unvoiced), th (voiced)', 'Children practise y, x, ch, sh, and the two th sounds in the existing lesson structure.'),
      module('Sound Group 7 — qu, ou, oi, ue, er, ar', 'Children complete the final Jolly Phonics sound group: qu, ou, oi, ue, er, and ar.'),
      module('Groups 4–7 Blending and Segmenting Review', 'Children review Groups 4-7 sounds through blending and segmenting practice before the final quiz.'),
    ],
    objectives: [
      'Recognise and pronounce the remaining Jolly Phonics sounds.',
      'Identify common digraphs and alternative vowel sounds.',
      'Correctly form letters and digraphs through guided practice.',
      'Blend increasingly complex words with confidence.',
      'Segment words into individual sounds for spelling.',
      'Strengthen listening and sound recognition skills.',
      'Read a wider range of words using synthetic phonics.',
      'Improve reading fluency and early writing confidence.',
      'Complete all 42 Jolly Phonics sounds.',
    ],
    requirements: [
      'Recommended completion of Jolly Phonics Sounds: Groups 1-3.',
      'Suitable for children aged 4 years and above.',
      'Basic understanding of the first 18 Jolly Phonics sounds is recommended.',
      'Adult supervision may be helpful for younger learners.',
      'Internet connection required for interactive activities and videos.',
    ],
    seo_title: 'Blending and Segmenting Group 4-7',
    seo_description: 'Children continue Jolly Phonics with sound groups 4-7, digraphs, tracing, songs, blending, segmenting and complete 42-sound review.',
    rating: 4.9,
    students_count: 0,
    is_free: false,
    certificate_enabled: false,
    featured: true,
    published: true,
    metadata: {
      lessons: 31,
      modules: 5,
      sounds: 24,
      quizzes: 1,
      format: 'interactive',
      certificateEnabled: false,
      instructorHelpEnabled: true,
      instructorHelpTotalPrice: 5000,
      instructorHelpLabel: 'Course + instructor help',
      instructorHelpNote: 'Includes guided instructor support alongside course access.',
      instructorHelpContactUrl: '/contact?subject=Instructor%20help%20for%20Groups%204-7',
      childSoundCourse: true,
      coursePart: 2,
      prerequisite: {
        courseSlug: 'jolly-phonics-sounds-groups-1-3',
        recommended: true,
        adminConfigurable: true,
      },
      soundGroups: ['Group 4', 'Group 5', 'Group 6', 'Group 7'],
      soundsIncluded: ['ai', 'j', 'oa', 'ie', 'ee', 'or', 'z', 'w', 'ng', 'v', 'oo_long', 'oo_short', 'y', 'x', 'ch', 'sh', 'th_unvoiced', 'th_voiced', 'qu', 'ou', 'oi', 'ue', 'er', 'ar'],
      standardActivityTypes,
      contentPolicy: 'Instructor uploads approved pronunciation, poem, story, action, formation and practice media before children access activities.',
      highlights: [
        'Remaining Jolly Phonics sound groups 4-7',
        'Digraphs treated as single sound units',
        'Separate records for the two oo and two th sounds',
        'Blending and segmenting practice with approved examples',
        'Complete 42-sound review',
      ],
      intendedAudience: [
        'Children aged 4 years and above',
        'Learners who know the first 18 Jolly Phonics sounds',
        'Parents supporting early reading and spelling at home',
      ],
      faq: [
        {
          question: 'Should children complete Groups 1-3 first?',
          answer: 'It is recommended. Admin can configure whether this prerequisite is required.',
        },
        {
          question: 'Are the two oo and two th sounds merged?',
          answer: 'No. They are kept as separate learning entries with separate internal sound keys.',
        },
      ],
    },
    created_at: now,
    updated_at: now,
  },
]

export const CHILDREN_PHONICS_COURSE_SLUGS = CHILDREN_PHONICS_COURSES.map((course) => course.slug)
const CHILDREN_PHONICS_COURSE_BY_SLUG = new Map(CHILDREN_PHONICS_COURSES.map((course) => [course.slug, course]))

export function isChildrenPhonicsCourseSlug(slug: string) {
  return CHILDREN_PHONICS_COURSE_SLUGS.includes(slug)
}

export function withChildrenPhonicsCourseUpdates(course: Course): Course {
  const update = CHILDREN_PHONICS_COURSE_BY_SLUG.get(course.slug)
  if (!update) return course

  return {
    ...course,
    title: update.title,
    seo_title: update.seo_title,
    image_url: update.image_url,
    thumbnail_url: update.thumbnail_url,
    banner_url: update.banner_url,
    curriculum: update.curriculum,
    metadata: {
      ...(course.metadata ?? {}),
      ...(update.metadata ?? {}),
    },
  }
}

export function mergeMissingChildrenPhonicsCourses(courses: Course[]) {
  const patchedCourses = courses.map(withChildrenPhonicsCourseUpdates)
  const existingSlugs = new Set(patchedCourses.map((course) => course.slug))
  const missing = CHILDREN_PHONICS_COURSES.filter((course) => !existingSlugs.has(course.slug))
  return missing.length ? [...patchedCourses, ...missing] : patchedCourses
}
