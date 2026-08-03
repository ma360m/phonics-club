-- Children course pricing and instructor-help package.
--
-- Base course access is Rs 2500. Course access with instructor help is Rs 5000 total.
-- Admins can later change these values from the course settings form.

UPDATE courses
SET
  price = 2500,
  discounted_price = NULL,
  is_free = FALSE,
  currency = 'PKR',
  metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'instructorHelpEnabled', TRUE,
    'instructorHelpTotalPrice', 5000,
    'instructorHelpLabel', 'Course + instructor help',
    'instructorHelpNote', 'Includes guided instructor support alongside course access.',
    'instructorHelpContactUrl', CASE slug
      WHEN 'jolly-phonics-sounds-groups-1-3' THEN '/contact?subject=Instructor%20help%20for%20Groups%201-3'
      WHEN 'jolly-phonics-sounds-groups-4-7' THEN '/contact?subject=Instructor%20help%20for%20Groups%204-7'
      ELSE '/contact?subject=Instructor%20help'
    END
  ),
  updated_at = NOW()
WHERE slug IN ('jolly-phonics-sounds-groups-1-3', 'jolly-phonics-sounds-groups-4-7');
