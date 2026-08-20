export type CourseCatalogueIconKey =
  | 'baby'
  | 'library'
  | 'bookOpen'
  | 'home'
  | 'graduationCap'
  | 'briefcase'
  | 'sparkles'
  | 'award'
  | 'school'

export type CatalogueCourse = {
  id: number
  title: string
  audience: string
  level: string
  duration: string
  summary: string
  curriculum: string
  experience: string
  award: string
  status: string
}

export type CatalogueAcademy = {
  id: string
  title: string
  label: string
  focus: string
  audience: string
  launch: string
  icon: CourseCatalogueIconKey
  accent: string
  soft: string
  courses: CatalogueCourse[]
}

export type CourseCataloguePathway = {
  label: string
  path: string
}

export type CourseCatalogueBundle = {
  title: string
  includes: string
  audience: string
}

export type CourseCatalogueCertificate = [award: string, use: string]

export type CourseCatalogueContent = {
  showButton: boolean
  buttonLabel: string
  buttonDescription: string
  buttonHref: string
  hero: {
    badge: string
    title: string
    subtitle: string
    cardTitle: string
    cardDescription: string
  }
  overview: {
    kicker: string
    title: string
    description: string
    totalLabel: string
  }
  bundlesIntro: {
    kicker: string
    title: string
    description: string
  }
  certificateIntro: {
    kicker: string
    title: string
    description: string
  }
  academies: CatalogueAcademy[]
  pathways: CourseCataloguePathway[]
  bundles: CourseCatalogueBundle[]
  certificateFramework: CourseCatalogueCertificate[]
}

export const DEFAULT_COURSE_CATALOGUE_ACADEMIES: CatalogueAcademy[] = [
  {
    id: 'children',
    title: "Children's Learning Academy",
    label: 'Children',
    focus: 'Phonics, reading, spelling and early literacy',
    audience: 'Ages 3-11',
    launch: 'Available with phased rollout',
    icon: 'baby',
    accent: 'bg-[#1D4ED8] text-white border-[#1D4ED8]',
    soft: 'bg-blue-50 text-[#1D4ED8] border-blue-200',
    courses: [
      {
        id: 1,
        title: 'Pre-Phonics: Ready for Sounds',
        audience: 'Age 3-4',
        level: 'Foundation',
        duration: '6-8 weeks',
        summary: 'Builds listening, speaking and phonological-awareness foundations before formal phonics.',
        curriculum: 'Environmental sounds, rhythm and rhyme, syllables, initial sounds, oral blending and listening memory.',
        experience: 'Audio-led games, picture matching, rhyme pairs, syllable clapping, sound hunts, stories and achievement stars.',
        award: 'Achievement Certificate',
        status: 'Paid',
      },
      {
        id: 2,
        title: 'Pre-K Phonics Foundation Programme',
        audience: 'Age 3.5-4.5',
        level: 'Foundation',
        duration: '12-15 weeks',
        summary: 'Introduces early sound learning through short, playful, multisensory sessions.',
        curriculum: 'Listening readiness, first sounds, actions, picture vocabulary, sound discrimination and early formation.',
        experience: 'Large flashcards, recorded sound audio, action animation, simple tracing, picture hunts and progress stars.',
        award: 'Certificate of Achievement',
        status: 'Paid',
      },
      {
        id: 3,
        title: 'Blending & Segmenting - Groups 1-3',
        audience: 'Age 4-7',
        level: 'Beginner',
        duration: 'Interactive',
        summary: 'Foundational sound-learning course covering Groups 1-3 with audio, tracing, blending and segmenting.',
        curriculum: 's a t i p n, c/k e h r m d, g o u l f b, first blending and first segmenting.',
        experience: 'Sound Trail, Hear the Sound, Watch-Trace-Try, Bubble Pop, blending train and final Sound Quest.',
        award: 'Certificate of Achievement',
        status: 'Published / Rebuild interactively',
      },
      {
        id: 4,
        title: 'Blending & Segmenting - Groups 4-7',
        audience: 'Age 4-7',
        level: 'Developing',
        duration: 'Interactive',
        summary: 'Advanced sound course covering digraphs, the two oo sounds, the two th sounds and confident word work.',
        curriculum: 'Groups 4-7, digraph recognition, sound contrasts, advanced blending, sound counting and segmenting.',
        experience: 'Flashcards, recorded phoneme audio, tracing, picture hunt, Pop the Sound and sound contrast sorting.',
        award: 'Certificate of Achievement',
        status: 'Published / Rebuild interactively',
      },
      {
        id: 5,
        title: 'Complete 42-Sound Mastery',
        audience: 'Age 4-7',
        level: 'Beginner to developing',
        duration: '16-20 weeks',
        summary: 'A premium route for families who want the full 42-sound journey in one programme.',
        curriculum: 'All seven groups, formation, blending, segmenting, digraph mastery, sound contrasts and early spelling.',
        experience: '42-Sound Mastery Board, reusable flashcards, revision deck, word-building labs and mastery quest.',
        award: 'Certificate of Achievement',
        status: 'Paid',
      },
      {
        id: 6,
        title: 'Kindergarten 1 - Jolly Phonics Foundation',
        audience: 'Age 4-5',
        level: 'Level 1',
        duration: '6 months',
        summary: 'A structured six-month programme combining sounds, early reading, spelling and handwriting.',
        curriculum: '42 main sounds, letter formation, CVC blending, oral segmenting, early tricky words and decodable sentences.',
        experience: 'Weekly Learn-Practise-Read-Write-Review cycle with interactive games and parent home practice.',
        award: 'Level 1 Certificate',
        status: 'Paid',
      },
      {
        id: 7,
        title: 'Kindergarten 2 - Advanced Phonics & Early Literacy',
        audience: 'Age 5-6',
        level: 'Level 2',
        duration: '6 months',
        summary: 'Moves learners from secure phonics into fluent early literacy.',
        curriculum: '42-sound consolidation, consonant blends, digraph fluency, alternative spellings and early writing.',
        experience: 'Sentence builders, word ladders, audio dictation, spelling games, picture sequencing and reading checks.',
        award: 'Level 2 Certificate',
        status: 'Paid',
      },
      {
        id: 8,
        title: 'Reading Fluency Builder',
        audience: 'Age 5-8',
        level: 'Fluency',
        duration: '8 weeks',
        summary: 'For children who know their sounds but still read slowly and effortfully.',
        curriculum: 'Accurate decoding, smooth blending, phrase reading, repeated reading, expression and passage fluency.',
        experience: 'Listen-and-copy, repeated reading, phrase grouping, fluency stars and short progressive challenges.',
        award: 'Completion Certificate',
        status: 'Paid',
      },
      {
        id: 9,
        title: 'Spelling Through Sounds',
        audience: 'Age 5-8',
        level: 'Spelling',
        duration: '8-10 weeks',
        summary: 'Develops spelling through auditory segmenting and phoneme-grapheme mapping.',
        curriculum: 'CVC, CVCC, CCVC, digraph words, sound boxes, dictation and sentence spelling.',
        experience: 'Word audio, scrambled grapheme tiles, draggable sound boxes, reveal-and-check feedback and spelling challenges.',
        award: 'Completion Certificate',
        status: 'Paid',
      },
    ],
  },
  {
    id: 'jolly-literacy',
    title: 'Jolly Literacy Academy',
    label: 'Jolly Literacy',
    focus: 'Spelling, grammar, punctuation, comprehension and writing',
    audience: 'Children and teachers',
    launch: 'Levelled pathway',
    icon: 'library',
    accent: 'bg-[#B91C1C] text-white border-[#B91C1C]',
    soft: 'bg-red-50 text-[#B91C1C] border-red-200',
    courses: [
      {
        id: 10,
        title: 'Introduction to Jolly Literacy',
        audience: 'Age 5-7',
        level: 'Transition',
        duration: 'Self paced',
        summary: 'Bridges phonics into spelling, grammar, punctuation, comprehension and writing.',
        curriculum: 'Phonics consolidation, spelling, sentence structure, punctuation, vocabulary, comprehension and guided writing.',
        experience: 'Word tiles, sentence builders, punctuation drag-and-drop, picture comprehension and short writing tasks.',
        award: 'Completion Certificate',
        status: 'Paid',
      },
      {
        id: 11,
        title: 'Jolly Literacy Level 1',
        audience: 'Primary literacy',
        level: 'Level 1',
        duration: 'Self paced',
        summary: 'Introduces structured spelling, grammar, punctuation, reading and writing.',
        curriculum: 'Spelling patterns, nouns, verbs, adjectives, basic punctuation, fluency and sentence writing.',
        experience: 'Interactive grammar sorting, sentence building, vocabulary games and guided writing.',
        award: 'Level 1 Certificate',
        status: 'Paid',
      },
      {
        id: 12,
        title: 'Jolly Literacy Level 2',
        audience: 'Primary literacy',
        level: 'Level 2',
        duration: 'Self paced',
        summary: 'Extends grammar, spelling and sentence development with greater reading demand.',
        curriculum: 'Word classes, sentence expansion, spelling patterns, vocabulary, comprehension and paragraph writing.',
        experience: 'Interactive exercises, editing activities, comprehension checks and writing portfolio tasks.',
        award: 'Level 2 Certificate',
        status: 'Paid',
      },
      {
        id: 13,
        title: 'Jolly Literacy Level 3',
        audience: 'Primary literacy',
        level: 'Level 3',
        duration: 'Self paced',
        summary: 'Develops accuracy, sentence variety, inference, editing and extended writing.',
        curriculum: 'Grammar accuracy, paragraphing, vocabulary, inference, editing and structured composition.',
        experience: 'Comprehension tasks, sentence transformation, editing challenges and writing projects.',
        award: 'Level 3 Certificate',
        status: 'Paid',
      },
      {
        id: 14,
        title: 'Advanced Primary Literacy - Levels 4-6',
        audience: 'Primary literacy',
        level: 'Advanced',
        duration: 'Pathway',
        summary: 'A higher-level literacy pathway that can later be separated into three standalone levels.',
        curriculum: 'Advanced spelling, morphology, grammar, punctuation, comprehension, vocabulary, composition and editing.',
        experience: 'Progressive literacy missions, text analysis and extended writing portfolio.',
        award: 'Advanced Literacy Certificate',
        status: 'Coming Soon',
      },
      {
        id: 15,
        title: 'Reading Comprehension Academy',
        audience: 'Age 6-11',
        level: 'Foundation to advanced',
        duration: 'Progressive',
        summary: 'A progressive comprehension programme with three levels.',
        curriculum: 'Retrieval, sequencing, prediction, vocabulary in context, inference, evidence, summarising and author purpose.',
        experience: 'Read/listen passages, highlight evidence, sequence events, inference choices and progressive scoring.',
        award: 'Completion Certificate',
        status: 'Paid',
      },
      {
        id: 16,
        title: 'Creative Writing Academy',
        audience: 'Age 6-11',
        level: 'Progressive',
        duration: 'Self paced',
        summary: 'Builds confident sentence, paragraph and story writing.',
        curriculum: 'Sentence building, paragraph structure, narrative, description, planning and editing.',
        experience: 'Picture prompts, vocabulary banks, story planners, character builders and portfolio pieces.',
        award: 'Writing Achievement Certificate',
        status: 'Paid',
      },
    ],
  },
  {
    id: 'english-esl',
    title: 'Jolly English / ESL Pathway',
    label: 'Jolly English',
    focus: 'Vocabulary, listening, speaking and pre-phonics support',
    audience: 'Young ESL learners',
    launch: 'Support pathway',
    icon: 'bookOpen',
    accent: 'bg-[#047857] text-white border-[#047857]',
    soft: 'bg-emerald-50 text-[#047857] border-emerald-200',
    courses: [
      {
        id: 17,
        title: 'English Ready - Pre-Phonics ESL',
        audience: 'Age 3-5',
        level: 'Foundation',
        duration: 'Self paced',
        summary: 'Supports children beginning English before formal phonics.',
        curriculum: 'Listening, speaking, basic vocabulary, classroom language, songs, stories, rhymes and sound awareness.',
        experience: 'Picture vocabulary, listen-and-repeat, songs, stories and sound-awareness games.',
        award: 'Participation Certificate',
        status: 'Paid',
      },
      {
        id: 18,
        title: 'Jolly English Level 1 Support Course',
        audience: 'Age 3+',
        level: 'Beginner ESL',
        duration: 'Self paced',
        summary: 'Builds early vocabulary, listening and speaking with pre-phonics support.',
        curriculum: 'Vocabulary, listening, speaking, songs, stories, simple classroom language and phonemic awareness.',
        experience: 'Picture-led vocabulary, listening activities, story scenes and speaking prompts.',
        award: 'Completion Certificate',
        status: 'Paid',
      },
      {
        id: 19,
        title: 'Jolly English Level 2 Support Course',
        audience: 'Young ESL',
        level: 'Developing',
        duration: 'Self paced',
        summary: 'Extends oral English and prepares learners for more formal phonics and literacy.',
        curriculum: 'Vocabulary expansion, listening comprehension, simple sentence patterns, speaking and phonemic awareness.',
        experience: 'Listening challenges, sentence patterns, speaking activities and transition-to-phonics work.',
        award: 'Completion Certificate',
        status: 'Paid',
      },
    ],
  },
  {
    id: 'parents',
    title: 'Parent & Home Learning Academy',
    label: 'Parents',
    focus: 'Practical home support for sounds, blending, spelling and reading',
    audience: 'Parents and home educators',
    launch: 'Free, low-cost and paid',
    icon: 'home',
    accent: 'bg-[#A16207] text-white border-[#A16207]',
    soft: 'bg-amber-50 text-[#A16207] border-amber-200',
    courses: [
      {
        id: 20,
        title: 'Phonics for Parents - Getting Started',
        audience: 'Parents',
        level: 'Introductory',
        duration: '60-90 minutes',
        summary: 'A concise introduction to phonics and how to support it at home.',
        curriculum: 'What phonics is, sounds vs letter names, pure pronunciation, 42 sounds, blending and tricky words.',
        experience: 'Short videos, audio demonstrations, right/wrong examples, quick checks and a downloadable home routine.',
        award: 'Participation Certificate',
        status: 'Free / Low-cost',
      },
      {
        id: 21,
        title: 'Help Your Child Learn the 42 Sounds',
        audience: 'Parents',
        level: 'Support course',
        duration: '7 weeks',
        summary: 'Guides parents through the seven sound groups and simple home practice.',
        curriculum: 'Sound pronunciation, what the child should recognise, revision methods, home activities and common errors.',
        experience: 'Parent-facing flashcards, practice checklists, weekly guidance and revision tasks.',
        award: 'Completion Certificate',
        status: 'Paid',
      },
      {
        id: 22,
        title: 'Helping Your Child Blend and Read',
        audience: 'Parents',
        level: 'Practical',
        duration: 'Self paced',
        summary: 'For families whose child knows sounds but cannot yet blend words fluently.',
        curriculum: 'Oral blending, continuous blending, CVC progression, consonant blends, digraphs and avoiding guessing.',
        experience: 'Demonstrations, guided home routines and practice examples.',
        award: 'Completion Certificate',
        status: 'Paid',
      },
      {
        id: 23,
        title: 'Helping Your Child Spell and Write',
        audience: 'Parents',
        level: 'Practical',
        duration: 'Self paced',
        summary: 'Shows parents how to support segmenting, formation, spelling and sentence writing.',
        curriculum: 'Segmenting, sound boxes, dictation, word building, letter formation, sentence writing and correction strategies.',
        experience: 'Demonstration lessons, downloadable routines and practice checklists.',
        award: 'Completion Certificate',
        status: 'Paid',
      },
      {
        id: 24,
        title: 'Raising a Confident Reader',
        audience: 'Parents',
        level: 'General',
        duration: 'Self paced',
        summary: 'Helps families build sustainable reading habits and comprehension confidence.',
        curriculum: 'Book choice, decodable reading, reading aloud, fluency, vocabulary, comprehension conversation and motivation.',
        experience: 'Home reading plans, discussion prompts and progress reflection.',
        award: 'Completion Certificate',
        status: 'Paid',
      },
      {
        id: 25,
        title: 'Home Phonics Intervention',
        audience: 'Parents / home educators',
        level: 'Advanced support',
        duration: 'Self paced',
        summary: 'Provides structured additional practice for children who need more repetition.',
        curriculum: 'Sound-gap checks, blending intervention, segmenting intervention, weekly practice plans and progress monitoring.',
        experience: 'Practice dashboard, revision decks and weekly checklists for educational support.',
        award: 'Completion Certificate',
        status: 'Paid',
      },
    ],
  },
  {
    id: 'teachers',
    title: 'Teacher Professional Learning Academy',
    label: 'Teachers',
    focus: 'Professional phonics and literacy practice',
    audience: 'Teachers and tutors',
    launch: 'Certificates and specialist courses',
    icon: 'graduationCap',
    accent: 'bg-[#7C3AED] text-white border-[#7C3AED]',
    soft: 'bg-violet-50 text-[#6D28D9] border-violet-200',
    courses: [
      {
        id: 26,
        title: 'Teaching English Through Jolly Phonics - Free Foundation Course',
        audience: 'Teachers',
        level: 'Beginner',
        duration: 'Free',
        summary: 'Gateway course introducing the core methodology and professional certificate route.',
        curriculum: 'Foundations of synthetic phonics, five core skills, seven sound groups, blending, segmenting and planning basics.',
        experience: 'Short professional lessons, audio examples, quick knowledge checks and final introduction assessment.',
        award: 'Participation Badge / Certificate',
        status: 'Published / Free',
      },
      {
        id: 27,
        title: 'Teaching English Through Jolly Phonics - Professional Certificate',
        audience: 'Teachers / tutors',
        level: 'Professional',
        duration: '12-15+ hours',
        summary: 'Flagship professional course for confident classroom implementation.',
        curriculum: 'Foundations, phonological awareness, five skills, 42 sounds, pronunciation, blending, segmenting and assessment.',
        experience: 'Video lessons, sound demonstrations, classroom scenarios, templates, module checks and final assessment.',
        award: 'Phonics Club Professional Certificate',
        status: 'Paid / Flagship',
      },
      {
        id: 28,
        title: 'Mastering Blending & Segmenting',
        audience: 'Teachers',
        level: 'Specialist micro-certificate',
        duration: 'Self paced',
        summary: 'A deep professional focus on the two skills most likely to cause implementation difficulty.',
        curriculum: 'Phonemic awareness, oral blending, CVC progression, digraphs, segmenting, dictation and intervention.',
        experience: 'Case studies, diagnostic scenarios, demonstration clips and practice planning.',
        award: 'Specialist Certificate',
        status: 'Paid',
      },
      {
        id: 29,
        title: 'Teaching the 42 Letter Sounds Masterclass',
        audience: 'Teachers',
        level: 'Specialist',
        duration: 'Self paced',
        summary: 'A sound-by-sound professional mastery course.',
        curriculum: 'All seven groups, pronunciation, actions, stories, formation, revision systems and sound assessment.',
        experience: '42-sound professional dashboard, audio, teaching notes and formation demonstrations.',
        award: 'Specialist Certificate',
        status: 'Paid',
      },
      {
        id: 30,
        title: 'Tricky Words & Alternative Spellings Masterclass',
        audience: 'Teachers',
        level: 'Specialist',
        duration: 'Self paced',
        summary: 'Professional strategies for automatic word recognition and later spelling complexity.',
        curriculum: 'Tricky-word analysis, automaticity, alternative spellings, vowel alternatives, word sorting and dictation.',
        experience: 'Scenario-based practice, word analysis and teaching-plan tasks.',
        award: 'Specialist Certificate',
        status: 'Paid',
      },
      {
        id: 31,
        title: 'Phonics Assessment & Intervention Specialist',
        audience: 'Teachers / literacy leads',
        level: 'Advanced',
        duration: 'Self paced',
        summary: 'Develops assessment literacy and evidence-based intervention planning.',
        curriculum: 'Baseline, sound checks, blending, segmenting, reading miscues, spelling analysis and reporting.',
        experience: 'Case studies, learner profiles, data interpretation and intervention-plan assignment.',
        award: 'Specialist Certificate',
        status: 'Paid',
      },
      {
        id: 32,
        title: 'Teaching Decodable Reading & Comprehension',
        audience: 'Teachers',
        level: 'Professional',
        duration: 'Self paced',
        summary: 'Supports the transition from decoding into fluent, meaningful reading.',
        curriculum: 'Decodability, reader selection, guided reading, fluency, vocabulary, questioning and assessment.',
        experience: 'Reader analysis, guided-reading scenarios and comprehension planning.',
        award: 'Professional Certificate',
        status: 'Paid',
      },
    ],
  },
  {
    id: 'teacher-literacy',
    title: 'Jolly Literacy Teacher Academy',
    label: 'Teacher Literacy',
    focus: 'Professional spelling, grammar, punctuation, reading and writing practice',
    audience: 'Teachers',
    launch: 'Professional literacy pathway',
    icon: 'briefcase',
    accent: 'bg-[#0F766E] text-white border-[#0F766E]',
    soft: 'bg-teal-50 text-[#0F766E] border-teal-200',
    courses: [
      {
        id: 33,
        title: 'Introduction to Teaching Jolly Literacy',
        audience: 'Teachers',
        level: 'Professional',
        duration: 'Self paced',
        summary: 'Introduces the transition from phonics to broader literacy instruction.',
        curriculum: 'Spelling, grammar, punctuation, reading, writing, planning and assessment.',
        experience: 'Professional modules, lesson demonstrations, planning tasks and knowledge checks.',
        award: 'Professional Certificate',
        status: 'Paid',
      },
      {
        id: 34,
        title: 'Teaching Spelling, Grammar & Punctuation',
        audience: 'Teachers',
        level: 'Professional',
        duration: 'Self paced',
        summary: 'Develops systematic teaching of spelling and language structure.',
        curriculum: 'Word structure, spelling patterns, parts of speech, sentence construction, punctuation, editing and assessment.',
        experience: 'Word analysis, sentence-building tasks and assessment scenarios.',
        award: 'Professional Certificate',
        status: 'Paid',
      },
      {
        id: 35,
        title: 'Teaching Reading Comprehension',
        audience: 'Teachers',
        level: 'Professional',
        duration: 'Self paced',
        summary: 'Builds a clear framework for teaching comprehension explicitly.',
        curriculum: 'Retrieval, prediction, vocabulary, sequencing, inference, summarising, evidence and discussion.',
        experience: 'Text analysis, questioning practice and lesson-planning activities.',
        award: 'Professional Certificate',
        status: 'Paid',
      },
      {
        id: 36,
        title: 'Teaching Creative & Independent Writing',
        audience: 'Teachers',
        level: 'Professional',
        duration: 'Self paced',
        summary: 'Supports progression from sentence-level work to purposeful independent composition.',
        curriculum: 'Planning, sentence development, paragraphs, vocabulary, narrative, non-fiction, editing and feedback.',
        experience: 'Model-text analysis, writing plans, feedback scenarios and portfolio tasks.',
        award: 'Professional Certificate',
        status: 'Paid',
      },
      {
        id: 37,
        title: 'Jolly Literacy Level 1 Practitioner Certificate',
        audience: 'Teachers',
        level: 'Level 1 Practitioner',
        duration: 'Self paced',
        summary: 'Complete Level 1 implementation course.',
        curriculum: 'Curriculum progression, lesson delivery, spelling, grammar, punctuation, reading, writing and assessment.',
        experience: 'Demonstrations, planning assignments and final professional assessment.',
        award: 'Practitioner Certificate',
        status: 'Paid',
      },
      {
        id: 38,
        title: 'Advanced Jolly Literacy Practitioner',
        audience: 'Experienced teachers',
        level: 'Advanced',
        duration: 'Self paced',
        summary: 'Advanced implementation, differentiation and intervention.',
        curriculum: 'Advanced spelling, grammar, comprehension, writing, assessment, differentiation and intervention.',
        experience: 'Case studies, implementation project and advanced final assessment.',
        award: 'Advanced Practitioner Certificate',
        status: 'Paid',
      },
    ],
  },
  {
    id: 'early-years',
    title: 'Early Years Professional Academy',
    label: 'Early Years',
    focus: 'ECCE, Montessori, storytelling, STEAM and classroom practice',
    audience: 'Early-years professionals',
    launch: 'Professional development',
    icon: 'sparkles',
    accent: 'bg-[#BE123C] text-white border-[#BE123C]',
    soft: 'bg-rose-50 text-[#BE123C] border-rose-200',
    courses: [
      {
        id: 39,
        title: 'Early Childhood Education Essentials',
        audience: 'Early-years professionals',
        level: 'Professional',
        duration: 'Self paced',
        summary: 'Core professional foundations for quality early-childhood practice.',
        curriculum: 'Child development, play, learning environments, observation, behaviour, communication and inclusion.',
        experience: 'Video learning, reflection tasks, observation templates and professional scenarios.',
        award: 'Professional Certificate',
        status: 'Paid',
      },
      {
        id: 40,
        title: 'Montessori Foundations for Early Years',
        audience: 'Early-years professionals',
        level: 'Professional',
        duration: 'Self paced',
        summary: 'Practical introduction to Montessori principles and classroom practice.',
        curriculum: 'Prepared environment, practical life, sensorial learning, language, mathematics, observation and teacher role.',
        experience: 'Demonstrations, environment-planning activities and observation tasks.',
        award: 'Professional Certificate',
        status: 'Paid',
      },
      {
        id: 41,
        title: 'STEM & STEAM in the Early Years',
        audience: 'Early-years professionals',
        level: 'Professional',
        duration: 'Self paced',
        summary: 'Shows how to create inquiry-rich early-years experiences.',
        curriculum: 'Inquiry, science, building, design, problem solving, art integration, maths thinking and projects.',
        experience: 'Activity design, mini-projects and classroom planning.',
        award: 'Professional Certificate',
        status: 'Paid',
      },
      {
        id: 42,
        title: 'Storytelling & Language Development',
        audience: 'Early-years professionals',
        level: 'Professional',
        duration: 'Self paced',
        summary: 'Develops oral language, vocabulary and comprehension through storytelling.',
        curriculum: 'Oral language, vocabulary, picture talk, retelling, role play, listening and comprehension.',
        experience: 'Story demonstration, questioning practice and activity planning.',
        award: 'Professional Certificate',
        status: 'Paid',
      },
      {
        id: 43,
        title: 'Classroom Management in Early Years',
        audience: 'Early-years professionals',
        level: 'Professional',
        duration: 'Self paced',
        summary: 'Builds calm, organised and engaging early-years classrooms.',
        curriculum: 'Routines, transitions, behaviour, learning centres, engagement, organisation and parent communication.',
        experience: 'Scenario practice, routine planning and classroom management toolkit.',
        award: 'Professional Certificate',
        status: 'Paid',
      },
    ],
  },
  {
    id: 'diplomas',
    title: 'Professional Diploma Academy',
    label: 'Diplomas',
    focus: 'Extended assessed programmes with assignments and capstone work',
    audience: 'Experienced professionals',
    launch: 'Application / paid',
    icon: 'award',
    accent: 'bg-[#4338CA] text-white border-[#4338CA]',
    soft: 'bg-indigo-50 text-[#4338CA] border-indigo-200',
    courses: [
      {
        id: 44,
        title: 'Professional Diploma in Synthetic Phonics & Early Reading',
        audience: 'Advanced professional',
        level: 'Diploma',
        duration: '40-60 hours',
        summary: 'Extended programme covering phonics, early reading, assessment and intervention.',
        curriculum: 'Literacy foundations, synthetic phonics, 42 sounds, blending, segmenting, reading, spelling and intervention.',
        experience: 'Unit learning, assignments, portfolio, case studies and final examination.',
        award: 'Phonics Club Professional Diploma',
        status: 'Applications Open / Paid',
      },
      {
        id: 45,
        title: 'Professional Diploma in Jolly Phonics Teaching Practice',
        audience: 'Advanced professional',
        level: 'Diploma',
        duration: 'Extended',
        summary: 'Extended implementation programme focused on sound teaching, the five skills and classroom practice.',
        curriculum: 'Programme implementation, 42 sounds, blending, segmenting, tricky words, planning, assessment and practicum.',
        experience: 'Assignments, portfolio and capstone teaching project.',
        award: 'Phonics Club Professional Diploma',
        status: 'Applications Open / Paid',
      },
      {
        id: 46,
        title: 'Professional Diploma in Early Literacy Education',
        audience: 'Advanced professional',
        level: 'Diploma',
        duration: 'Extended',
        summary: 'Covers the full early-literacy continuum beyond phonics alone.',
        curriculum: 'Phonological awareness, phonics, reading, fluency, spelling, handwriting, vocabulary and comprehension.',
        experience: 'Extended units, case studies, portfolio and final assessment.',
        award: 'Phonics Club Professional Diploma',
        status: 'Applications Open / Paid',
      },
      {
        id: 47,
        title: 'Professional Diploma in Early Childhood Education',
        audience: 'Advanced professional',
        level: 'Diploma',
        duration: 'Extended',
        summary: 'Comprehensive early-years professional development programme.',
        curriculum: 'Child development, ECCE, play, Montessori, literacy, phonics, storytelling, STEAM and family partnership.',
        experience: 'Unit assignments, observation portfolio and final project.',
        award: 'Phonics Club Professional Diploma',
        status: 'Applications Open / Paid',
      },
      {
        id: 48,
        title: 'Professional Diploma in Literacy Teaching & Intervention',
        audience: 'Advanced professional',
        level: 'Diploma',
        duration: 'Extended',
        summary: 'High-level pathway for literacy teaching, assessment and intervention.',
        curriculum: 'Phonics, spelling, morphology, fluency, vocabulary, comprehension, writing, assessment and intervention.',
        experience: 'Case-based learning, professional portfolio and final examination.',
        award: 'Phonics Club Professional Diploma',
        status: 'Applications Open / Paid',
      },
      {
        id: 49,
        title: 'Professional Diploma in Jolly Literacy Practice',
        audience: 'Advanced professional',
        level: 'Diploma',
        duration: 'Extended',
        summary: 'Extended programme in spelling, grammar, punctuation, comprehension and writing.',
        curriculum: 'Spelling, grammar, punctuation, vocabulary, comprehension, writing, planning, assessment and intervention.',
        experience: 'Assignments, teaching portfolio and final project.',
        award: 'Phonics Club Professional Diploma',
        status: 'Applications Open / Paid',
      },
    ],
  },
  {
    id: 'schools',
    title: 'Schools & Leadership',
    label: 'Schools',
    focus: 'Whole-school implementation and team training',
    audience: 'Leaders and coordinators',
    launch: 'Institutional packages',
    icon: 'school',
    accent: 'bg-[#334155] text-white border-[#334155]',
    soft: 'bg-slate-100 text-[#334155] border-slate-300',
    courses: [
      {
        id: 50,
        title: 'Implementing Synthetic Phonics Across a School',
        audience: 'Principals / coordinators',
        level: 'Leadership',
        duration: 'Institutional',
        summary: 'Whole-school implementation programme for consistent phonics practice.',
        curriculum: 'Planning, timetabling, resources, teacher consistency, assessment systems, intervention and parent engagement.',
        experience: 'Leadership modules, implementation templates and school action plan.',
        award: 'School Leadership Certificate',
        status: 'Institutional',
      },
      {
        id: 51,
        title: 'Phonics Coordinator Certificate',
        audience: 'Literacy leads / coordinators',
        level: 'Coordinator',
        duration: 'Institutional',
        summary: 'Prepares coordinators to lead, monitor and improve phonics provision.',
        curriculum: 'Teacher coaching, lesson observation, assessment, data review, intervention management and parent communication.',
        experience: 'Leadership scenarios, observation tasks and improvement-plan project.',
        award: 'Coordinator Certificate',
        status: 'Paid / Institutional',
      },
      {
        id: 52,
        title: 'Train Your Teaching Team',
        audience: 'Schools / groups',
        level: 'Group training',
        duration: 'Institutional',
        summary: 'Group training product rather than a standard individual course.',
        curriculum: 'Foundation training, implementation guide, team progress, coordinator support and staff certificates.',
        experience: 'Group licences, progress dashboard, staff certificates and school completion report.',
        award: 'Institutional Completion Report',
        status: 'Institutional',
      },
    ],
  },
]

export const DEFAULT_COURSE_CATALOGUE_PATHWAYS: CourseCataloguePathway[] = [
  { label: 'Child', path: 'Pre-Phonics | Groups 1-3 | Groups 4-7 | 42-Sound Mastery | Reading & Spelling' },
  { label: 'Parent', path: 'Parents Foundation | 42 Sounds at Home | Blending & Reading | Spelling & Writing' },
  { label: 'Teacher', path: 'Free Foundation | Professional Certificate | Specialist Certificates | Diploma' },
  { label: 'School', path: 'Professional Certificate | Coordinator Certificate | Whole-School Implementation' },
]

export const DEFAULT_COURSE_CATALOGUE_BUNDLES: CourseCatalogueBundle[] = [
  { title: 'Little Reader Starter Pack', includes: 'Pre-Phonics + Groups 1-3', audience: 'Children age 3-5' },
  { title: 'Complete Phonics Journey', includes: 'Groups 1-3 + Groups 4-7 + 42-Sound Mastery', audience: 'Children age 4-7' },
  { title: 'Confident Reader Bundle', includes: 'Complete Phonics + Fluency + Comprehension', audience: 'Children age 5-8' },
  { title: 'Parent Phonics Toolkit', includes: 'Parent foundation + blending + spelling + reading', audience: 'Parents' },
  { title: 'Teacher Starter Bundle', includes: 'Free Foundation + Professional Certificate', audience: 'Teachers' },
  { title: 'School Implementation Pack', includes: 'Teacher licences + Coordinator + Leadership', audience: 'Schools' },
]

export const DEFAULT_COURSE_CERTIFICATE_FRAMEWORK: CourseCatalogueCertificate[] = [
  ['Achievement Badge', 'Short skill or group milestone'],
  ['Certificate of Achievement', "Completed children's programme"],
  ['Certificate of Completion', 'Standard adult course'],
  ['Professional Certificate', 'Substantial assessed teacher or professional programme'],
  ['Specialist Certificate', 'Focused advanced professional course'],
  ['Professional Diploma', 'Extended assessed programme with portfolio or capstone'],
]

const ICON_KEYS = new Set<CourseCatalogueIconKey>([
  'baby',
  'library',
  'bookOpen',
  'home',
  'graduationCap',
  'briefcase',
  'sparkles',
  'award',
  'school',
])

export const DEFAULT_COURSE_CATALOGUE_CONTENT: CourseCatalogueContent = {
  showButton: false,
  buttonLabel: 'Preview Course Catalogue',
  buttonDescription: 'View the complete Phonics Club Learning Academy course catalogue.',
  buttonHref: '/courses/catalogue',
  hero: {
    badge: 'Preview catalogue',
    title: 'Phonics Club Learning Academy',
    subtitle: 'A structured course ecosystem for children, families, educators and schools, moving from first sounds to professional literacy practice.',
    cardTitle: 'Professional Course Catalogue',
    cardDescription: 'Children, parents, teachers, early years, diplomas and school implementation.',
  },
  overview: {
    kicker: 'Catalogue Overview',
    title: 'Choose a learning pathway',
    description: 'Each academy is grouped by learner type, outcome and award level so the full catalogue stays easy to scan.',
    totalLabel: 'total course entries from the source catalogue',
  },
  bundlesIntro: {
    kicker: 'Recommended bundles',
    title: 'Commercial pathways without the clutter',
    description: 'Bundles make the catalogue easier to sell, especially when users know their goal but not the exact course sequence.',
  },
  certificateIntro: {
    kicker: 'Certificate framework',
    title: 'Clear award hierarchy',
    description: 'The catalogue separates milestones, certificates and diploma-level work so learners understand the value of each pathway.',
  },
  academies: DEFAULT_COURSE_CATALOGUE_ACADEMIES,
  pathways: DEFAULT_COURSE_CATALOGUE_PATHWAYS,
  bundles: DEFAULT_COURSE_CATALOGUE_BUNDLES,
  certificateFramework: DEFAULT_COURSE_CERTIFICATE_FRAMEWORK,
}

function objectRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function stringValue(value: unknown, fallback: string): string {
  const text = String(value ?? '').trim()
  return text || fallback
}

function numberValue(value: unknown, fallback: number): number {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : fallback
}

function normalizeCourse(value: unknown, fallback: CatalogueCourse, index: number): CatalogueCourse {
  const item = objectRecord(value)
  return {
    id: numberValue(item.id, fallback.id || index + 1),
    title: stringValue(item.title, fallback.title),
    audience: stringValue(item.audience, fallback.audience),
    level: stringValue(item.level, fallback.level),
    duration: stringValue(item.duration, fallback.duration),
    summary: stringValue(item.summary, fallback.summary),
    curriculum: stringValue(item.curriculum, fallback.curriculum),
    experience: stringValue(item.experience, fallback.experience),
    award: stringValue(item.award, fallback.award),
    status: stringValue(item.status, fallback.status),
  }
}

function normalizeAcademy(value: unknown, fallback: CatalogueAcademy, index: number): CatalogueAcademy {
  const item = objectRecord(value)
  const coursesInput = Array.isArray(item.courses) ? item.courses : []
  const courses = coursesInput.length
    ? coursesInput.map((course, courseIndex) => normalizeCourse(course, fallback.courses[courseIndex] ?? fallback.courses[0], courseIndex))
    : fallback.courses
  const icon = String(item.icon ?? fallback.icon) as CourseCatalogueIconKey

  return {
    id: stringValue(item.id, fallback.id || `academy-${index + 1}`),
    title: stringValue(item.title, fallback.title),
    label: stringValue(item.label, fallback.label),
    focus: stringValue(item.focus, fallback.focus),
    audience: stringValue(item.audience, fallback.audience),
    launch: stringValue(item.launch, fallback.launch),
    icon: ICON_KEYS.has(icon) ? icon : fallback.icon,
    accent: stringValue(item.accent, fallback.accent),
    soft: stringValue(item.soft, fallback.soft),
    courses,
  }
}

function normalizePathway(value: unknown, fallback: CourseCataloguePathway): CourseCataloguePathway {
  const item = objectRecord(value)
  return {
    label: stringValue(item.label, fallback.label),
    path: stringValue(item.path, fallback.path),
  }
}

function normalizeBundle(value: unknown, fallback: CourseCatalogueBundle): CourseCatalogueBundle {
  const item = objectRecord(value)
  return {
    title: stringValue(item.title, fallback.title),
    includes: stringValue(item.includes, fallback.includes),
    audience: stringValue(item.audience, fallback.audience),
  }
}

function normalizeCertificates(value: unknown): CourseCatalogueCertificate[] {
  const input = Array.isArray(value) ? value : []
  const normalized = input
    .map((item, index) => {
      if (Array.isArray(item)) {
        const fallback = DEFAULT_COURSE_CERTIFICATE_FRAMEWORK[index] ?? DEFAULT_COURSE_CERTIFICATE_FRAMEWORK[0]
        return [stringValue(item[0], fallback[0]), stringValue(item[1], fallback[1])] as CourseCatalogueCertificate
      }
      const record = objectRecord(item)
      const fallback = DEFAULT_COURSE_CERTIFICATE_FRAMEWORK[index] ?? DEFAULT_COURSE_CERTIFICATE_FRAMEWORK[0]
      return [stringValue(record.award, fallback[0]), stringValue(record.use, fallback[1])] as CourseCatalogueCertificate
    })
    .filter(([award, use]) => award && use)
  return normalized.length ? normalized : DEFAULT_COURSE_CERTIFICATE_FRAMEWORK
}

function normalizeHero(value: unknown): CourseCatalogueContent['hero'] {
  const item = objectRecord(value)
  return {
    badge: stringValue(item.badge, DEFAULT_COURSE_CATALOGUE_CONTENT.hero.badge),
    title: stringValue(item.title, DEFAULT_COURSE_CATALOGUE_CONTENT.hero.title),
    subtitle: stringValue(item.subtitle, DEFAULT_COURSE_CATALOGUE_CONTENT.hero.subtitle),
    cardTitle: stringValue(item.cardTitle, DEFAULT_COURSE_CATALOGUE_CONTENT.hero.cardTitle),
    cardDescription: stringValue(item.cardDescription, DEFAULT_COURSE_CATALOGUE_CONTENT.hero.cardDescription),
  }
}

function normalizeIntro<T extends { kicker: string; title: string; description: string }>(
  value: unknown,
  fallback: T,
): T {
  const item = objectRecord(value)
  return {
    kicker: stringValue(item.kicker, fallback.kicker),
    title: stringValue(item.title, fallback.title),
    description: stringValue(item.description, fallback.description),
  } as T
}

export function normalizeCourseCatalogueContent(value: unknown): CourseCatalogueContent {
  const data = objectRecord(value)
  const academyInput = Array.isArray(data.academies) ? data.academies : []
  const academies = academyInput.length
    ? academyInput.map((academy, index) => normalizeAcademy(academy, DEFAULT_COURSE_CATALOGUE_ACADEMIES[index] ?? DEFAULT_COURSE_CATALOGUE_ACADEMIES[0], index))
    : DEFAULT_COURSE_CATALOGUE_ACADEMIES
  const pathwayInput = Array.isArray(data.pathways) ? data.pathways : []
  const bundleInput = Array.isArray(data.bundles) ? data.bundles : []

  return {
    showButton: data.showButton === true,
    buttonLabel: stringValue(data.buttonLabel, DEFAULT_COURSE_CATALOGUE_CONTENT.buttonLabel),
    buttonDescription: stringValue(data.buttonDescription, DEFAULT_COURSE_CATALOGUE_CONTENT.buttonDescription),
    buttonHref: stringValue(data.buttonHref, DEFAULT_COURSE_CATALOGUE_CONTENT.buttonHref),
    hero: normalizeHero(data.hero),
    overview: normalizeIntro(data.overview, DEFAULT_COURSE_CATALOGUE_CONTENT.overview),
    bundlesIntro: normalizeIntro(data.bundlesIntro, DEFAULT_COURSE_CATALOGUE_CONTENT.bundlesIntro),
    certificateIntro: normalizeIntro(data.certificateIntro, DEFAULT_COURSE_CATALOGUE_CONTENT.certificateIntro),
    academies,
    pathways: pathwayInput.length
      ? pathwayInput.map((pathway, index) => normalizePathway(pathway, DEFAULT_COURSE_CATALOGUE_PATHWAYS[index] ?? DEFAULT_COURSE_CATALOGUE_PATHWAYS[0]))
      : DEFAULT_COURSE_CATALOGUE_PATHWAYS,
    bundles: bundleInput.length
      ? bundleInput.map((bundle, index) => normalizeBundle(bundle, DEFAULT_COURSE_CATALOGUE_BUNDLES[index] ?? DEFAULT_COURSE_CATALOGUE_BUNDLES[0]))
      : DEFAULT_COURSE_CATALOGUE_BUNDLES,
    certificateFramework: normalizeCertificates(data.certificateFramework),
  }
}
