-- Set the public free course thumbnail to the Dr. Fatima Tuz Zahra course image.

UPDATE courses
SET
  image_url = '/images/courses/Instructor Name Dr. Fatima Tuz Zahra.png',
  thumbnail_url = '/images/courses/Instructor Name Dr. Fatima Tuz Zahra.png',
  updated_at = NOW()
WHERE slug = 'teaching-english-through-jolly-phonics-free-version';
