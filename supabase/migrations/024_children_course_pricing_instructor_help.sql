-- Price the two children phonics courses and show the instructor-help option.
-- Course access stays Rs 2,500. Course + instructor help is Rs 5,000 total.

UPDATE courses
SET
  price = 2500,
  discounted_price = NULL,
  currency = 'PKR',
  is_free = FALSE,
  certificate_enabled = FALSE,
  metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'selfPacedPrice', 2500,
    'instructorHelpEnabled', TRUE,
    'instructorHelpPrice', 5000,
    'instructorHelpLabel', 'Instructor Help',
    'instructorHelpDescription', 'Choose instructor help when your child needs guided support, parent check-ins and help staying on track. Rs 5,000 is the total course price with instructor help included.',
    'instructorHelpIncludes', jsonb_build_array(
      'Course access plus guided instructor support',
      'Parent guidance for practice at home',
      'Help with pronunciation, blending, segmenting and spelling practice',
      'Progress check-ins and next-step recommendations'
    ),
    'certificateEnabled', FALSE
  ),
  updated_at = NOW()
WHERE slug IN (
  'jolly-phonics-sounds-groups-1-3',
  'jolly-phonics-sounds-groups-4-7'
);
