-- Populate supplied children phonics course lesson shells with structured content
-- and final quiz question banks. Licensed Jolly action artwork/audio/worksheets
-- remain admin-uploadable assets.

ALTER TABLE public.course_quizzes
  ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES public.course_modules(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_course_quizzes_module
  ON public.course_quizzes (module_id, sort_order);

WITH lesson_specs(course_slug, lesson_title, sound_label, sound_hint, pictures, blending_words, recognition_note) AS (
  VALUES
    ('jolly-phonics-sounds-groups-1-3', 'Sound s', 's', '/s/', ARRAY['sun', 'snake', 'sock', 'star', 'sandwich', 'seal'], ARRAY['sat', 'sit', 'spin'], 'Tap the pictures that begin with /s/.'),
    ('jolly-phonics-sounds-groups-1-3', 'Sound a', 'a', '/a/', ARRAY['apple', 'ant', 'astronaut', 'animal', 'axe', 'ankle'], ARRAY['sat', 'pan', 'nap'], 'Tap the pictures that begin with /a/.'),
    ('jolly-phonics-sounds-groups-1-3', 'Sound t', 't', '/t/', ARRAY['tiger', 'tent', 'tap', 'teddy', 'top', 'tomato'], ARRAY['tap', 'tin', 'tip'], 'Tap the pictures that begin with /t/.'),
    ('jolly-phonics-sounds-groups-1-3', 'Sound i', 'i', '/i/', ARRAY['ink', 'insect', 'igloo', 'iguana', 'itch'], ARRAY['sit', 'pin', 'tin'], 'Tap the pictures that begin with /i/.'),
    ('jolly-phonics-sounds-groups-1-3', 'Sound p', 'p', '/p/', ARRAY['pig', 'pen', 'pan', 'parrot', 'pizza', 'pear'], ARRAY['pat', 'pin', 'pan'], 'Tap the pictures that begin with /p/.'),
    ('jolly-phonics-sounds-groups-1-3', 'Sound n', 'n', '/n/', ARRAY['nest', 'net', 'nose', 'nut', 'nurse', 'nail'], ARRAY['nap', 'pin', 'pan'], 'Tap the pictures that begin with /n/.'),
    ('jolly-phonics-sounds-groups-1-3', 'Sound c/k', 'c/k', '/k/', ARRAY['cat', 'cup', 'kite', 'king', 'kid', 'duck'], ARRAY['cat', 'kid', 'kit', 'can'], 'Find pictures with the /k/ sound.'),
    ('jolly-phonics-sounds-groups-1-3', 'Sound e', 'e', '/e/', ARRAY['egg', 'elephant', 'elbow', 'engine', 'envelope'], ARRAY['hen', 'red', 'men', 'den'], 'Tap the pictures that begin with /e/.'),
    ('jolly-phonics-sounds-groups-1-3', 'Sound h', 'h', '/h/', ARRAY['hat', 'hen', 'hand', 'horse', 'house', 'hammer'], ARRAY['hen', 'ham', 'hit', 'hand'], 'Tap the pictures that begin with /h/.'),
    ('jolly-phonics-sounds-groups-1-3', 'Sound r', 'r', '/r/', ARRAY['rabbit', 'robot', 'red', 'rocket', 'ring', 'rain'], ARRAY['red', 'rat', 'ram', 'run'], 'Tap the pictures that begin with /r/.'),
    ('jolly-phonics-sounds-groups-1-3', 'Sound m', 'm', '/m/', ARRAY['moon', 'mouse', 'map', 'mug', 'milk', 'monkey'], ARRAY['mat', 'mad', 'men', 'mug'], 'Tap the pictures that begin with /m/.'),
    ('jolly-phonics-sounds-groups-1-3', 'Sound d', 'd', '/d/', ARRAY['dog', 'duck', 'door', 'doll', 'drum', 'dinosaur'], ARRAY['dad', 'den', 'dip', 'dim'], 'Tap the pictures that begin with /d/.'),
    ('jolly-phonics-sounds-groups-1-3', 'Sound g', 'g', '/g/', ARRAY['goat', 'girl', 'gate', 'gift', 'goose', 'gum'], ARRAY['dog', 'log', 'bug', 'bag'], 'Tap the pictures that begin with /g/.'),
    ('jolly-phonics-sounds-groups-1-3', 'Sound o', 'o', '/o/', ARRAY['orange', 'octopus', 'ox', 'ostrich', 'olive'], ARRAY['dog', 'log', 'fog'], 'Tap the pictures that begin with /o/.'),
    ('jolly-phonics-sounds-groups-1-3', 'Sound u', 'u', '/u/', ARRAY['umbrella', 'up', 'under', 'uncle'], ARRAY['bug', 'bus', 'sun', 'mug'], 'Tap the pictures that begin with /u/.'),
    ('jolly-phonics-sounds-groups-1-3', 'Sound l', 'l', '/l/', ARRAY['lion', 'lamp', 'leg', 'leaf', 'lemon', 'log'], ARRAY['log', 'leg', 'lip'], 'Tap the pictures that begin with /l/.'),
    ('jolly-phonics-sounds-groups-1-3', 'Sound f', 'f', '/f/', ARRAY['fish', 'fan', 'fox', 'frog', 'fork', 'foot'], ARRAY['fun', 'fan', 'fit', 'frog'], 'Tap the pictures that begin with /f/.'),
    ('jolly-phonics-sounds-groups-1-3', 'Sound b', 'b', '/b/', ARRAY['ball', 'bag', 'bus', 'bat', 'bed', 'banana'], ARRAY['bug', 'bus', 'bag', 'bed'], 'Tap the pictures that begin with /b/.'),
    ('jolly-phonics-sounds-groups-4-7', 'Sound ai', 'ai', '/ai/', ARRAY['rain', 'train', 'snail', 'tail', 'paint', 'chain'], ARRAY['rain', 'train', 'tail'], 'Find pictures containing /ai/.'),
    ('jolly-phonics-sounds-groups-4-7', 'Sound j', 'j', '/j/', ARRAY['jam', 'jug', 'jet', 'jelly', 'jacket', 'jeep'], ARRAY['jam', 'jet', 'jog'], 'Find pictures beginning with /j/.'),
    ('jolly-phonics-sounds-groups-4-7', 'Sound oa', 'oa', '/oa/', ARRAY['boat', 'goat', 'coat', 'road', 'soap', 'toast'], ARRAY['boat', 'goat', 'coat'], 'Find pictures containing /oa/.'),
    ('jolly-phonics-sounds-groups-4-7', 'Sound ie', 'ie', '/ie/', ARRAY['pie', 'tie', 'lie', 'die'], ARRAY['pie', 'tie'], 'Find words containing /ie/.'),
    ('jolly-phonics-sounds-groups-4-7', 'Sound ee', 'ee', '/ee/', ARRAY['bee', 'tree', 'feet', 'sheep', 'seed', 'green'], ARRAY['bee', 'feet', 'seed'], 'Find pictures containing /ee/.'),
    ('jolly-phonics-sounds-groups-4-7', 'Sound or', 'or', '/or/', ARRAY['fork', 'corn', 'cork', 'horse', 'storm', 'torch'], ARRAY['fork', 'corn'], 'Find pictures containing /or/.'),
    ('jolly-phonics-sounds-groups-4-7', 'Sound z', 'z', '/z/', ARRAY['zebra', 'zip', 'zoo', 'zero', 'zigzag'], ARRAY['zip'], 'Find pictures beginning with /z/.'),
    ('jolly-phonics-sounds-groups-4-7', 'Sound w', 'w', '/w/', ARRAY['web', 'wig', 'wet', 'window', 'whale', 'watch'], ARRAY['web', 'wet', 'win'], 'Find pictures beginning with /w/.'),
    ('jolly-phonics-sounds-groups-4-7', 'Sound ng', 'ng', '/ng/', ARRAY['ring', 'king', 'wing', 'song', 'long', 'bang'], ARRAY['ring', 'king', 'song'], 'Find pictures with the /ng/ sound.'),
    ('jolly-phonics-sounds-groups-4-7', 'Sound v', 'v', '/v/', ARRAY['van', 'vet', 'vest', 'vase', 'violin'], ARRAY['van', 'vet'], 'Find pictures beginning with /v/.'),
    ('jolly-phonics-sounds-groups-4-7', 'Sound oo (moon)', 'oo as in moon', '/oo/', ARRAY['moon', 'food', 'spoon', 'boot', 'room', 'zoo'], ARRAY['moon', 'food', 'boot'], 'Sort long oo words under moon.'),
    ('jolly-phonics-sounds-groups-4-7', 'Sound oo (book)', 'oo as in book', '/oo/', ARRAY['book', 'cook', 'look', 'foot', 'wool', 'hook'], ARRAY['book', 'look', 'cook'], 'Sort short oo words under book.'),
    ('jolly-phonics-sounds-groups-4-7', 'Sound y', 'y', '/y/', ARRAY['yak', 'yellow', 'yo-yo', 'yarn', 'yacht'], ARRAY['yes'], 'Find pictures beginning with /y/.'),
    ('jolly-phonics-sounds-groups-4-7', 'Sound x', 'x', '/ks/', ARRAY['fox', 'box', 'six', 'wax', 'mix'], ARRAY['box', 'six'], 'Find pictures containing /ks/.'),
    ('jolly-phonics-sounds-groups-4-7', 'Sound ch', 'ch', '/ch/', ARRAY['chair', 'chick', 'cheese', 'chin', 'chips', 'cherry'], ARRAY['chin', 'chip'], 'Find pictures beginning with /ch/.'),
    ('jolly-phonics-sounds-groups-4-7', 'Sound sh', 'sh', '/sh/', ARRAY['ship', 'shop', 'shell', 'shoe', 'fish', 'dish'], ARRAY['ship', 'shop', 'fish'], 'Sort ch and sh pictures carefully.'),
    ('jolly-phonics-sounds-groups-4-7', 'Sound th (unvoiced)', 'th as in thin', '/th/', ARRAY['thumb', 'thin', 'thorn', 'three', 'bath', 'moth'], ARRAY['thin', 'bath'], 'Choose the unvoiced th sound.'),
    ('jolly-phonics-sounds-groups-4-7', 'Sound th (voiced)', 'th as in this', '/th/', ARRAY['this', 'that', 'them', 'then', 'mother', 'feather'], ARRAY['this', 'that'], 'Choose the voiced th sound.'),
    ('jolly-phonics-sounds-groups-4-7', 'Sound qu', 'qu', '/qu/', ARRAY['queen', 'quilt', 'quiz', 'quack', 'quick'], ARRAY['queen', 'quick'], 'Find pictures beginning with /qu/.'),
    ('jolly-phonics-sounds-groups-4-7', 'Sound ou', 'ou', '/ou/', ARRAY['cloud', 'mouth', 'house', 'round', 'out'], ARRAY['out', 'cloud', 'house'], 'Find pictures containing /ou/.'),
    ('jolly-phonics-sounds-groups-4-7', 'Sound oi', 'oi', '/oi/', ARRAY['coin', 'oil', 'boil', 'soil', 'point'], ARRAY['coin', 'oil'], 'Find pictures containing /oi/.'),
    ('jolly-phonics-sounds-groups-4-7', 'Sound ue', 'ue', '/ue/', ARRAY['blue', 'glue', 'clue', 'true'], ARRAY['blue', 'glue'], 'Find words containing /ue/.'),
    ('jolly-phonics-sounds-groups-4-7', 'Sound er', 'er', '/er/', ARRAY['fern', 'mixer', 'hammer', 'ladder'], ARRAY['fern'], 'Find pictures containing /er/.'),
    ('jolly-phonics-sounds-groups-4-7', 'Sound ar', 'ar', '/ar/', ARRAY['car', 'star', 'farm', 'park', 'arm'], ARRAY['car', 'star', 'farm'], 'Find pictures containing /ar/.')
),
lesson_html AS (
  SELECT
    course_slug,
    lesson_title,
    '<h2>Meet the Sound</h2>' ||
    '<p>Target sound: <strong>' || sound_label || '</strong> (' || sound_hint || ').</p>' ||
    '<p>Show a large centred flashcard, then add the admin-uploaded audio button beside the sound.</p>' ||
    '<h3>Picture Bank</h3><ul>' ||
    (SELECT string_agg('<li>' || item || '</li>', '') FROM unnest(pictures) AS item) ||
    '</ul><h3>Sound and Action</h3>' ||
    '<p>Use the official or licensed Jolly action artwork/audio for this sound. Do not invent proprietary action wording.</p>' ||
    '<h3>Formation</h3><p>Show the grapheme large, then use Watch, Trace, Try.</p>' ||
    '<h3>Song</h3><p>Embed the approved official Jolly song or teacher-uploaded video for this sound.</p>' ||
    '<h3>Mini Recognition</h3><p>' || recognition_note || '</p>' ||
    '<h3>Blending Help</h3><ul>' ||
    (SELECT string_agg('<li>' || item || ' - add [YOU PROVIDE: AUDIO] beside the centred word.</li>', '') FROM unnest(blending_words) AS item) ||
    '</ul>' AS html,
    pictures,
    blending_words,
    recognition_note
  FROM lesson_specs
)
UPDATE public.course_lessons lesson
SET
  description = replace(lesson.description, 'Content required: ', ''),
  rich_content = lesson_html.html,
  article_content = lesson_html.html,
  activity_data = COALESCE(lesson.activity_data, '{}'::jsonb) || jsonb_build_object(
    'contentStatus', 'content_ready',
    'pictureExamples', to_jsonb(lesson_html.pictures),
    'blendingWords', to_jsonb(lesson_html.blending_words),
    'recognitionPrompt', lesson_html.recognition_note,
    'adminAssetsNeeded', jsonb_build_array('approved audio', 'approved action media', 'approved song/video', 'worksheet where applicable')
  ),
  manual_completion_allowed = true,
  published = true,
  updated_at = NOW()
FROM lesson_html
JOIN public.courses course
  ON course.slug = lesson_html.course_slug
WHERE lesson.course_id = course.id
  AND lesson.title = lesson_html.lesson_title;

WITH review_specs(course_slug, lesson_title, html) AS (
  VALUES
    ('jolly-phonics-sounds-groups-1-3', 'Group 1 Flashcard Review', '<h2>Group 1 Flashcard Review</h2><p>Review s, a, t, i, p, n with one large card at a time. Learners say the sound first, then tap to check audio.</p>'),
    ('jolly-phonics-sounds-groups-1-3', 'Group 1 Formation Practice', '<h2>Group 1 Formation Practice</h2><p>Practise tracing s, a, t, i, p, n using Watch, Trace, Try. Keep each letter large and child friendly.</p>'),
    ('jolly-phonics-sounds-groups-1-3', 'Group 1 Listening Game', '<h2>s or a, t or i, p or n</h2><p>Use 8-picture listening rounds after every two sounds. Pictures should not show text labels during the recognition round.</p>'),
    ('jolly-phonics-sounds-groups-1-3', 'Group 1 Blending Practice', '<h2>My First Blending</h2><p>Centre each word with a small audio help button. Use sat, sit, tap, pat, pin, tin, tip, pan, nap, spin. Audio does not autoplay.</p>'),
    ('jolly-phonics-sounds-groups-1-3', 'Group 1 Segmenting Practice', '<h2>Segmenting Group 1</h2><p>Play the spoken word, then let the child build it with shuffled sound tiles. Use sat, sit, tap, pat, pin, tin, pan, nap.</p>'),
    ('jolly-phonics-sounds-groups-1-3', 'Group 1 Checkpoint', '<h2>Group 1 Checkpoint</h2><p>Short check covering sound recognition, picture choice, blending, segmenting and Worksheet 1 upload slot.</p>'),
    ('jolly-phonics-sounds-groups-1-3', 'Group 1 Practice and Review', '<h2>Group 1 Review</h2><p>Flashcards, recognition, blending, segmenting and Worksheet 1. Admin uploads the actual worksheet PDF later.</p>'),
    ('jolly-phonics-sounds-groups-1-3', 'Group 2 Flashcard Review', '<h2>Group 2 Flashcard Review</h2><p>Review c/k, e, h, r, m, d with previous Group 1 sounds for discrimination.</p>'),
    ('jolly-phonics-sounds-groups-1-3', 'Group 2 Formation Practice', '<h2>Group 2 Formation Practice</h2><p>Practise c/k, e, h, r, m, d with large traceable letters.</p>'),
    ('jolly-phonics-sounds-groups-1-3', 'Group 2 Listening Game', '<h2>Group 2 Listening</h2><p>Use /k/ or /e/, h or r, m or d picture rounds with teacher-uploaded audio.</p>'),
    ('jolly-phonics-sounds-groups-1-3', 'Groups 1-2 Blending', '<h2>Blend It: Groups 1 and 2</h2><p>Use cat, hen, red, rat, mat, mad, dad, den, men, ham, dip, dim, ram, hit, kid, kit, can, hand.</p>'),
    ('jolly-phonics-sounds-groups-1-3', 'Groups 1-2 Segmenting', '<h2>Segment It: Groups 1 and 2</h2><p>Use cat, hen, red, rat, mat, dad, den, ham, dip, ram. Play the word first, then drag tiles into boxes.</p>'),
    ('jolly-phonics-sounds-groups-1-3', 'Group 2 Checkpoint', '<h2>Group 2 Checkpoint</h2><p>Short check for sound recognition, blending, segmenting and Worksheet 2 upload slot.</p>'),
    ('jolly-phonics-sounds-groups-1-3', 'Group 2 Practice and Review', '<h2>Group 2 Review</h2><p>Review c/k, e, h, r, m, d plus blending and segmenting with Groups 1 and 2 words. Admin uploads Worksheet 2 later.</p>'),
    ('jolly-phonics-sounds-groups-1-3', 'Group 3 Flashcard Review', '<h2>Group 3 Flashcard Review</h2><p>Review g, o, u, l, f, b with earlier sounds mixed in.</p>'),
    ('jolly-phonics-sounds-groups-1-3', 'Group 3 Formation Practice', '<h2>Group 3 Formation Practice</h2><p>Trace g, o, u, l, f, b with clear Watch, Trace, Try steps.</p>'),
    ('jolly-phonics-sounds-groups-1-3', 'Group 3 Listening Game', '<h2>Group 3 Listening</h2><p>Use g or o, u or l, f or b picture-selection rounds.</p>'),
    ('jolly-phonics-sounds-groups-1-3', 'Groups 1-3 Blending', '<h2>Blending Challenge</h2><p>Use dog, log, fog, bug, bus, bag, bed, leg, lip, fun, fan, fit, run, mug, sun, frog, flag, drum, flat, grab.</p>'),
    ('jolly-phonics-sounds-groups-1-3', 'Groups 1-3 Segmenting', '<h2>Segmenting Challenge</h2><p>Use dog, log, bug, bus, bag, leg, fan, mug, frog, flag. Keep each sound tile separate.</p>'),
    ('jolly-phonics-sounds-groups-1-3', 'Group 3 Checkpoint', '<h2>Group 3 Checkpoint</h2><p>Short check for all Group 3 sounds plus Worksheet 3 upload slot.</p>'),
    ('jolly-phonics-sounds-groups-1-3', 'Group 3 Practice and Review', '<h2>Group 3 Review</h2><p>Review Groups 1 to 3 with sound sorting, picture matching, word building and Worksheet 3.</p>'),
    ('jolly-phonics-sounds-groups-1-3', 'Groups 1-3 Blending Activities', '<h2>Groups 1 to 3 Blend It</h2><p>Use sat, pin, cat, hen, dog, sun, frog, flag, drum, hand. Centre each word with optional audio help.</p>'),
    ('jolly-phonics-sounds-groups-1-3', 'Groups 1-3 Segmenting Activities', '<h2>Groups 1 to 3 Segment It</h2><p>Use sat, pin, cat, hen, dog, sun, frog, flag. Audio first, then build with tiles.</p>'),
    ('jolly-phonics-sounds-groups-1-3', 'Groups 1-3 Review', '<h2>Groups 1 to 3 Review</h2><p>Use Sound Flash, Picture Detective, Sound Sorting, Blend It and Build the Word. Admin uploads Worksheet 4 later.</p>'),
    ('jolly-phonics-sounds-groups-4-7', 'Group 4 Practice and Review', '<h2>Group 4 Review</h2><p>Review ai, j, oa, ie, ee, or. Include ai/j, oa/ie, ee/or picture games, blending and Worksheet 4.</p>'),
    ('jolly-phonics-sounds-groups-4-7', 'Group 5 Practice and Review', '<h2>Group 5 Review</h2><p>Review z, w, ng, v, oo as in moon and oo as in book. Include long/short oo sorting and Worksheet 5.</p>'),
    ('jolly-phonics-sounds-groups-4-7', 'Group 6 Practice and Review', '<h2>Group 6 Review</h2><p>Review y, x, ch, sh, th as in thin and th as in this. Keep ch, sh and th as single sound tiles. Include Worksheet 6.</p>'),
    ('jolly-phonics-sounds-groups-4-7', 'Group 7 Practice and Review', '<h2>Group 7 Review</h2><p>Review qu, ou, oi, ue, er, ar with picture recognition, blending, segmenting and Worksheet 7.</p>'),
    ('jolly-phonics-sounds-groups-4-7', 'Groups 4-7 Blending Activities', '<h2>Groups 4 to 7 Blend It</h2><p>Use train, boat, feet, ring, moon, ship, chin, cloud, coin, blue, star. Audio help sits beside the centred word and does not autoplay.</p>'),
    ('jolly-phonics-sounds-groups-4-7', 'Groups 4-7 Segmenting Activities', '<h2>Groups 4 to 7 Segment It</h2><p>Use rain, boat, feet, ring, moon, book, ship, chin, coin, blue, star. Keep digraphs as one sound tile.</p>'),
    ('jolly-phonics-sounds-groups-4-7', 'Groups 4-7 Review', '<h2>Groups 4 to 7 Review Games</h2><p>Use Sound Flashcards, Picture Sound Detective, Digraph Sorting, Blend It, Segment It and Picture to Build Word.</p>')
)
UPDATE public.course_lessons lesson
SET
  description = regexp_replace(COALESCE(lesson.description, ''), '^Content required: ', ''),
  rich_content = review_specs.html,
  article_content = review_specs.html,
  activity_data = COALESCE(lesson.activity_data, '{}'::jsonb) || jsonb_build_object(
    'contentStatus', 'content_ready',
    'adminAssetsNeeded', jsonb_build_array('approved audio', 'approved pictures', 'worksheet upload where applicable')
  ),
  manual_completion_allowed = true,
  published = true,
  updated_at = NOW()
FROM review_specs
JOIN public.courses course
  ON course.slug = review_specs.course_slug
WHERE lesson.course_id = course.id
  AND lesson.title = review_specs.lesson_title;

WITH target_courses AS (
  SELECT id, slug
  FROM public.courses
  WHERE slug IN ('jolly-phonics-sounds-groups-1-3', 'jolly-phonics-sounds-groups-4-7')
)
UPDATE public.course_quizzes quiz
SET
  title = 'Final Quiz',
  lesson_id = NULL,
  module_id = NULL,
  published = true,
  sort_order = 999,
  updated_at = NOW()
FROM target_courses
WHERE quiz.course_id = target_courses.id
  AND quiz.title IN ('Final Quiz', 'Final Assessment');

WITH target_courses AS (
  SELECT id, slug
  FROM public.courses
  WHERE slug IN ('jolly-phonics-sounds-groups-1-3', 'jolly-phonics-sounds-groups-4-7')
)
INSERT INTO public.course_quizzes (course_id, lesson_id, module_id, title, description, passing_score, max_attempts, sort_order, published)
SELECT
  target_courses.id,
  NULL,
  NULL,
  'Final Quiz',
  CASE target_courses.slug
    WHEN 'jolly-phonics-sounds-groups-1-3' THEN 'Final visual quiz for Jolly Phonics Groups 1 to 3.'
    ELSE 'Final visual quiz for Jolly Phonics Groups 4 to 7.'
  END,
  70,
  3,
  999,
  true
FROM target_courses
WHERE NOT EXISTS (
  SELECT 1
  FROM public.course_quizzes existing
  WHERE existing.course_id = target_courses.id
    AND existing.title = 'Final Quiz'
);

WITH quiz_seed(course_slug, sort_order, question, options, correct_option) AS (
  VALUES
    ('jolly-phonics-sounds-groups-1-3', 1, 'Hear /s/. Choose the grapheme.', '["s","a","t","p"]'::jsonb, 0),
    ('jolly-phonics-sounds-groups-1-3', 2, 'Hear /a/. Choose the grapheme.', '["t","a","i","n"]'::jsonb, 1),
    ('jolly-phonics-sounds-groups-1-3', 3, 'Which sound starts sun?', '["s","m","d","b"]'::jsonb, 0),
    ('jolly-phonics-sounds-groups-1-3', 4, 'Which sound starts moon?', '["n","m","h","r"]'::jsonb, 1),
    ('jolly-phonics-sounds-groups-1-3', 5, 'Choose the word made by d-o-g.', '["dig","dog","log","fog"]'::jsonb, 1),
    ('jolly-phonics-sounds-groups-1-3', 6, 'Choose the first sound in frog.', '["f","b","g","l"]'::jsonb, 0),
    ('jolly-phonics-sounds-groups-1-3', 7, 'Choose the first sound in ball.', '["d","b","p","f"]'::jsonb, 1),
    ('jolly-phonics-sounds-groups-1-3', 8, 'Build sun. Which order is correct?', '["s-u-n","n-u-s","u-s-n","s-n-u"]'::jsonb, 0),
    ('jolly-phonics-sounds-groups-1-3', 9, 'Choose the word made by c-a-t.', '["cat","tap","can","rat"]'::jsonb, 0),
    ('jolly-phonics-sounds-groups-1-3', 10, 'Which word begins with /h/?', '["red","hen","men","den"]'::jsonb, 1),
    ('jolly-phonics-sounds-groups-1-3', 11, 'Which word begins with /r/?', '["rat","mat","dad","pan"]'::jsonb, 0),
    ('jolly-phonics-sounds-groups-1-3', 12, 'Which word begins with /g/?', '["dog","goat","bus","fan"]'::jsonb, 1),
    ('jolly-phonics-sounds-groups-1-3', 13, 'Choose the word made by f-l-a-g.', '["frog","flat","flag","fog"]'::jsonb, 2),
    ('jolly-phonics-sounds-groups-1-3', 14, 'Build pin. Which order is correct?', '["p-i-n","n-i-p","i-p-n","p-n-i"]'::jsonb, 0),
    ('jolly-phonics-sounds-groups-1-3', 15, 'Choose the first sound in dog.', '["b","d","g","o"]'::jsonb, 1),
    ('jolly-phonics-sounds-groups-1-3', 16, 'Which word begins with /l/?', '["log","dog","fog","bug"]'::jsonb, 0),
    ('jolly-phonics-sounds-groups-1-3', 17, 'Choose the word made by h-e-n.', '["hen","men","den","ham"]'::jsonb, 0),
    ('jolly-phonics-sounds-groups-1-3', 18, 'Build drum. Which order is correct?', '["d-r-u-m","d-u-r-m","r-d-u-m","d-r-m-u"]'::jsonb, 0),
    ('jolly-phonics-sounds-groups-1-3', 19, 'Which word begins with /u/?', '["umbrella","lamp","fish","ball"]'::jsonb, 0),
    ('jolly-phonics-sounds-groups-1-3', 20, 'Choose the word made by f-r-o-g.', '["flag","frog","fog","log"]'::jsonb, 1),
    ('jolly-phonics-sounds-groups-4-7', 1, 'Hear /ai/. Choose the grapheme.', '["ai","oa","ee","or"]'::jsonb, 0),
    ('jolly-phonics-sounds-groups-4-7', 2, 'Hear /j/. Choose the grapheme.', '["z","j","v","w"]'::jsonb, 1),
    ('jolly-phonics-sounds-groups-4-7', 3, 'Which word contains /oa/?', '["rain","boat","feet","fork"]'::jsonb, 1),
    ('jolly-phonics-sounds-groups-4-7', 4, 'Which word contains /ee/?', '["bee","pie","corn","jam"]'::jsonb, 0),
    ('jolly-phonics-sounds-groups-4-7', 5, 'Choose the word made by r-ai-n.', '["ran","rain","ring","road"]'::jsonb, 1),
    ('jolly-phonics-sounds-groups-4-7', 6, 'Choose the word made by b-oa-t.', '["boot","boat","bat","bite"]'::jsonb, 1),
    ('jolly-phonics-sounds-groups-4-7', 7, 'Which word has /ng/?', '["van","ring","wet","zip"]'::jsonb, 1),
    ('jolly-phonics-sounds-groups-4-7', 8, 'Choose long oo as in moon.', '["book","cook","moon","foot"]'::jsonb, 2),
    ('jolly-phonics-sounds-groups-4-7', 9, 'Choose short oo as in book.', '["food","moon","spoon","book"]'::jsonb, 3),
    ('jolly-phonics-sounds-groups-4-7', 10, 'Which word begins with /ch/?', '["ship","chin","thin","fish"]'::jsonb, 1),
    ('jolly-phonics-sounds-groups-4-7', 11, 'Which word contains /sh/?', '["chip","ship","this","coin"]'::jsonb, 1),
    ('jolly-phonics-sounds-groups-4-7', 12, 'Which word uses th as in thin?', '["this","that","thin","them"]'::jsonb, 2),
    ('jolly-phonics-sounds-groups-4-7', 13, 'Which word uses th as in this?', '["bath","moth","thin","that"]'::jsonb, 3),
    ('jolly-phonics-sounds-groups-4-7', 14, 'Choose the word made by sh-i-p.', '["chip","ship","shop","fish"]'::jsonb, 1),
    ('jolly-phonics-sounds-groups-4-7', 15, 'Choose the word made by ch-i-n.', '["chin","ship","thin","coin"]'::jsonb, 0),
    ('jolly-phonics-sounds-groups-4-7', 16, 'Which word begins with /qu/?', '["out","queen","coin","blue"]'::jsonb, 1),
    ('jolly-phonics-sounds-groups-4-7', 17, 'Which word contains /ou/?', '["coin","cloud","blue","star"]'::jsonb, 1),
    ('jolly-phonics-sounds-groups-4-7', 18, 'Which word contains /oi/?', '["coin","cloud","glue","car"]'::jsonb, 0),
    ('jolly-phonics-sounds-groups-4-7', 19, 'Which word contains /ue/?', '["star","blue","corn","fork"]'::jsonb, 1),
    ('jolly-phonics-sounds-groups-4-7', 20, 'Which word contains /ar/?', '["fern","car","coin","book"]'::jsonb, 1),
    ('jolly-phonics-sounds-groups-4-7', 21, 'Build coin. Which order is correct?', '["c-oi-n","c-o-i-n","oi-c-n","c-n-oi"]'::jsonb, 0),
    ('jolly-phonics-sounds-groups-4-7', 22, 'Build blue. Which order is correct?', '["b-l-ue","b-u-e","bl-u-e","b-ue-l"]'::jsonb, 0),
    ('jolly-phonics-sounds-groups-4-7', 23, 'Build star. Which order is correct?', '["s-t-ar","st-a-r","s-ar-t","t-s-ar"]'::jsonb, 0),
    ('jolly-phonics-sounds-groups-4-7', 24, 'Choose the word made by qu-ee-n.', '["quick","queen","quack","quiz"]'::jsonb, 1)
),
quiz_ref AS (
  SELECT quiz.id AS quiz_id, course.slug
  FROM public.course_quizzes quiz
  JOIN public.courses course
    ON course.id = quiz.course_id
  WHERE course.slug IN ('jolly-phonics-sounds-groups-1-3', 'jolly-phonics-sounds-groups-4-7')
    AND quiz.title = 'Final Quiz'
)
INSERT INTO public.quiz_questions (
  quiz_id,
  question,
  question_type,
  options,
  correct_option,
  explanation,
  sort_order,
  points,
  difficulty
)
SELECT
  quiz_ref.quiz_id,
  quiz_seed.question,
  'mcq',
  quiz_seed.options,
  quiz_seed.correct_option,
  'Review the sound, picture and blending pattern for this item.',
  quiz_seed.sort_order,
  1,
  'standard'
FROM quiz_seed
JOIN quiz_ref
  ON quiz_ref.slug = quiz_seed.course_slug
WHERE NOT EXISTS (
  SELECT 1
  FROM public.quiz_questions existing
  WHERE existing.quiz_id = quiz_ref.quiz_id
    AND existing.question = quiz_seed.question
);

UPDATE public.courses
SET updated_at = NOW()
WHERE slug IN ('jolly-phonics-sounds-groups-1-3', 'jolly-phonics-sounds-groups-4-7');

NOTIFY pgrst, 'reload schema';
