-- Professional landing-page content and access settings for the Jolly Phonics free course.

UPDATE courses
SET
  description = 'Teaching of English through Jolly Phonics (Free Version) introduces educators to the internationally recognized Synthetic Phonics approach used in the Jolly Phonics programme. This foundational course equips teachers with the knowledge and practical understanding required to confidently begin teaching reading, writing, and spelling through systematic phonics instruction.

Participants will explore the five core skills of Jolly Phonics, including learning the 42 letter sounds, letter formation, blending, identifying sounds in words, and teaching tricky words. The course also explains the recommended teaching sequence, classroom practices, alternative spellings, independent writing, language assessment, and the effective use of decodable readers and teaching resources.

Designed for teachers, trainee educators, and literacy practitioners, this course provides the essential groundwork for successful implementation of the Jolly Phonics programme in the classroom.',
  rich_description = 'Teaching of English through Jolly Phonics (Free Version) introduces educators to the internationally recognized Synthetic Phonics approach used in the Jolly Phonics programme. This foundational course equips teachers with the knowledge and practical understanding required to confidently begin teaching reading, writing, and spelling through systematic phonics instruction.

Participants will explore the five core skills of Jolly Phonics, including learning the 42 letter sounds, letter formation, blending, identifying sounds in words, and teaching tricky words. The course also explains the recommended teaching sequence, classroom practices, alternative spellings, independent writing, language assessment, and the effective use of decodable readers and teaching resources.

Designed for teachers, trainee educators, and literacy practitioners, this course provides the essential groundwork for successful implementation of the Jolly Phonics programme in the classroom.',
  excerpt = 'A free foundational Jolly Phonics course for teachers, trainee educators and literacy practitioners.',
  price = 0,
  discounted_price = NULL,
  is_free = TRUE,
  certificate_enabled = FALSE,
  banner_url = COALESCE(NULLIF(banner_url, ''), image_url, thumbnail_url),
  objectives = ARRAY[
    'Understand the principles of the Jolly Phonics programme and Synthetic Phonics methodology.',
    'Explain the five core skills that form the foundation of Jolly Phonics.',
    'Teach the 42 English letter sounds using the recommended teaching sequence.',
    'Demonstrate correct letter formation techniques using the Sassoon Infant font.',
    'Apply effective strategies for blending and segmenting sounds for reading and spelling.',
    'Teach children to identify beginning, middle, and ending sounds in words.',
    'Introduce and teach tricky words using proven teaching strategies.',
    'Support independent reading, writing, and spelling development.',
    'Teach alternative vowel spellings and common digraphs.',
    'Conduct basic language assessments to monitor student progress.',
    'Use decodable readers and classroom resources effectively.',
    'Plan daily phonics lessons following the recommended Jolly Phonics progression.',
    'Build children''s confidence in reading, writing, and communication skills.'
  ],
  requirements = ARRAY[
    'Have a basic understanding of English language teaching.',
    'Be interested in teaching early literacy or phonics.',
    'No previous experience with Jolly Phonics is required.',
    'Have access to a computer, tablet, or smartphone with an internet connection.',
    'Be able to view online videos and complete quizzes.',
    'Be willing to participate in practical classroom activities and independent reading.'
  ],
  curriculum = '[
    {
      "title": "Foundations of Jolly Phonics",
      "duration": "Module 1",
      "description": "Introduction to Jolly Phonics, Synthetic Phonics principles, the five core skills, letter sounds, letter formation, blending, segmenting, tricky words and the course introduction quiz.",
      "lessons": []
    },
    {
      "title": "Letter Sounds and Alternative Spellings",
      "duration": "Module 2",
      "description": "The seven sound groups, short and long vowel sounds, digraphs, alternative vowel spellings and pronunciations, flashcards, daily sound review and sound assessment activities.",
      "lessons": []
    },
    {
      "title": "Reading, Writing and Language Development",
      "duration": "Module 3",
      "description": "Independent writing, guided writing, sentence building, creative writing, picture writing, news writing, vocabulary, language assessment and reading fluency development.",
      "lessons": []
    },
    {
      "title": "Classroom Teaching Strategies",
      "duration": "Module 4",
      "description": "Recommended teaching sequence, daily lesson structure, dictation, blending and segmenting practice, decodable readers, parent involvement and monitoring student progress.",
      "lessons": []
    },
    {
      "title": "Teaching Resources and Course Completion",
      "duration": "Module 5",
      "description": "Student books, teacher guides, decodable reader series, book lists, digital resources, classroom materials, final review and final assessment.",
      "lessons": []
    }
  ]'::jsonb,
  metadata = COALESCE(metadata, '{}'::jsonb) || '{
    "free": true,
    "certificateEnabled": false,
    "lessons": 0,
    "quizzes": 1,
    "format": "online",
    "pathway": "Teaching of English",
    "courseFamily": "Jolly Phonics"
  }'::jsonb,
  updated_at = NOW()
WHERE slug = 'teaching-english-through-jolly-phonics-free-version';

WITH course_ref AS (
  SELECT id FROM courses WHERE slug = 'teaching-english-through-jolly-phonics-free-version'
),
module_seed(sort_order, title, description) AS (
  VALUES
    (1, 'Foundations of Jolly Phonics', 'Introduction to Jolly Phonics, Synthetic Phonics principles, the five core skills, letter sounds, letter formation, blending, segmenting, tricky words and the course introduction quiz.'),
    (2, 'Letter Sounds and Alternative Spellings', 'The seven sound groups, short and long vowel sounds, digraphs, alternative vowel spellings and pronunciations, flashcards, daily sound review and sound assessment activities.'),
    (3, 'Reading, Writing and Language Development', 'Independent writing, guided writing, sentence building, creative writing, picture writing, news writing, vocabulary, language assessment and reading fluency development.'),
    (4, 'Classroom Teaching Strategies', 'Recommended teaching sequence, daily lesson structure, dictation, blending and segmenting practice, decodable readers, parent involvement and monitoring student progress.'),
    (5, 'Teaching Resources and Course Completion', 'Student books, teacher guides, decodable reader series, book lists, digital resources, classroom materials, final review and final assessment.')
)
UPDATE course_modules AS m
SET
  title = module_seed.title,
  description = module_seed.description
FROM course_ref, module_seed
WHERE m.course_id = course_ref.id
  AND m.sort_order = module_seed.sort_order;
