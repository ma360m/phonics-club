-- Payment, training registration, trainer profile, research, and blog content updates.

ALTER TABLE training_registrations
  ADD COLUMN IF NOT EXISTS preferred_month TEXT,
  ADD COLUMN IF NOT EXISTS approx_participants INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'training_registrations_preferred_month_2026_check'
  ) THEN
    ALTER TABLE training_registrations
      ADD CONSTRAINT training_registrations_preferred_month_2026_check
      CHECK (preferred_month IS NULL OR preferred_month >= '2026-08');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'training_registrations_participants_check'
  ) THEN
    ALTER TABLE training_registrations
      ADD CONSTRAINT training_registrations_participants_check
      CHECK (approx_participants IS NULL OR approx_participants > 0);
  END IF;
END $$;

UPDATE site_content
SET content = jsonb_set(
      content,
      '{projects,1,links}',
      '[
        {
          "label": "Lahore Times press release",
          "href": "https://www.lhrtimes.com/2016/04/15/groups-call-greater-use-jolly-phonics-solve-challenge-illiteracy/"
        },
        {
          "label": "The Nation press release",
          "href": "https://nation.com.pk/16-Apr-2016/an-easy-way-to-teach-english-to-kids"
        }
      ]'::jsonb,
      true
    ),
    updated_at = NOW()
WHERE key = 'research_page'
  AND content ? 'projects';

INSERT INTO blog_posts (
  title,
  slug,
  excerpt,
  content,
  category,
  tags,
  cover_image,
  published,
  seo_title,
  seo_description,
  created_at,
  updated_at
)
VALUES (
  'Jolly Phonics 2017 Training Video',
  'jolly-phonics-2017-training-video',
  'A 2017 Phonics Club video resource highlighting Jolly Phonics training and literacy work.',
  $blog$<p>This 2017 video shares Phonics Club training and classroom literacy work using Jolly Phonics.</p><p><a href="https://youtu.be/F8Rfx7Bn-I4?si=rSB5jssgwYR8uQ_T" target="_blank" rel="noopener noreferrer">Watch on YouTube</a></p><div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;margin-top:16px"><iframe src="https://www.youtube.com/embed/F8Rfx7Bn-I4" title="Jolly Phonics 2017 Training Video" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>$blog$,
  'news',
  ARRAY['Jolly Phonics', '2017', 'Training Video']::TEXT[],
  '/logo.png',
  true,
  'Jolly Phonics 2017 Training Video',
  'Watch the 2017 Phonics Club Jolly Phonics training video.',
  '2017-04-15T00:00:00Z',
  NOW()
)
ON CONFLICT (slug) DO UPDATE
SET title = EXCLUDED.title,
    excerpt = EXCLUDED.excerpt,
    content = EXCLUDED.content,
    category = EXCLUDED.category,
    tags = EXCLUDED.tags,
    cover_image = EXCLUDED.cover_image,
    published = EXCLUDED.published,
    seo_title = EXCLUDED.seo_title,
    seo_description = EXCLUDED.seo_description,
    updated_at = NOW();

INSERT INTO trainers (
  name,
  slug,
  title,
  bio,
  image_url,
  achievements,
  credentials,
  specialties,
  profile_details,
  sort_order,
  published
)
VALUES
(
  'Fatima Tuz Zahra',
  'fatima-tuz-zahra',
  'Certified Jolly Phonics Trainer and Literacy Consultant',
  'Fatima Tuz Zahra leads Phonics Club and supports schools, teachers, parents, and learners through lively Jolly Phonics and Jolly Literacy training.',
  NULL,
  ARRAY['Founder and lead trainer at Phonics Club', 'Worked with government, foundations, publishers, and schools', 'Designed curricula and training for schools across budget levels']::TEXT[],
  ARRAY['Certified Jolly Phonics trainer', 'Literacy consultant', 'Synthetic Phonics implementation specialist']::TEXT[],
  ARRAY['Jolly Phonics', 'Jolly Literacy Training', 'School implementation', 'Teacher training']::TEXT[],
  $trainer$City: Lahore
Phone: 03084432015
Email: fatematuzzehra@gmail.com

Fatima is a trainer and literacy consultant currently running Phonics Club in Pakistan, where children, parents, and teachers benefit from her lively training. She provides Jolly Phonics and Jolly Literacy training along with concept progression, school consultancy, and practical classroom support.

She works closely with local education foundations, authorities, and publishers, and has piloted Jolly Phonics in low-cost public and private schools. She is acknowledged for her sessions on teaching with Jolly Learning products in Pakistan and abroad.$trainer$,
  1,
  true
),
(
  'Anum Zehra Zaidi',
  'anum-zehra-zaidi',
  'Certified Jolly Phonics Trainer',
  'Anum Zehra Zaidi is a seasoned trainer with deep classroom experience and a strong understanding of Synthetic Phonics theory.',
  NULL,
  ARRAY['Trained hundreds of teachers across Pakistan', 'Worked with private, government, and non-profit institutions', 'Collaborated with global Jolly Phonics trainers']::TEXT[],
  ARRAY['Certified Jolly Phonics trainer', 'Classroom teaching and teacher training specialist']::TEXT[],
  ARRAY['Classroom implementation', 'Teacher training', 'Synthetic Phonics theory and practice']::TEXT[],
  $trainer$City: Karachi
Phone: 92 (336) 2093055
Email: zaidi.anumzehra@gmail.com

Anum Zehra is a passionate and seasoned trainer of Jolly Phonics with thorough classroom teaching experience. Her diverse training work across Pakistan enables her to support teachers from different academic, ethnic, and geographical backgrounds. She integrates real classroom experience with a strong understanding of phonics concepts.$trainer$,
  2,
  true
),
(
  'Zaibunnissa Sadozai',
  'zaibunnissa-sadozai',
  'Certified Jolly Phonics Trainer',
  'Zaibunnissa Sadozai brings primary teaching, leadership, and Jolly Phonics implementation experience from Pakistan and the USA.',
  NULL,
  ARRAY['Primary teacher and school leader', 'Lead teacher experience in Virginia, USA', 'Involved in AFAQ adoption work for Jolly Phonics']::TEXT[],
  ARRAY['Masters in International Relations', 'Certified Jolly Phonics trainer']::TEXT[],
  ARRAY['Primary literacy', 'School leadership', 'Jolly Phonics adoption support']::TEXT[],
  $trainer$City: Karachi
Phone: 03362451379
Email: zaibapk@yahoo.com

Zaibunnissa completed her Masters in International Relations from the University of Peshawar and began her career as a primary teacher. She served in prestigious schools in Pakistan and also worked in Virginia, USA as a lead preschool teacher. After using Jolly Phonics, she saw strong development in children reading and writing, especially for learners with weak visual skills.$trainer$,
  3,
  true
),
(
  'Tahira Sheikh',
  'tahira-sheikh',
  'Certified Jolly Phonics Trainer',
  'Tahira Sheikh is an Islamabad-based trainer known for private school implementation and large-scale government training work.',
  NULL,
  ARRAY['Secured and led Jolly Phonics work with KPK government partners', 'Supported monitoring for large-scale implementation', 'Conducted workshops for schools and parents in Islamabad']::TEXT[],
  ARRAY['MBA in Management from the UK', 'Certified Jolly Phonics trainer']::TEXT[],
  ARRAY['Government implementation', 'Jolly Phonics and literacy monitoring', 'School mentoring']::TEXT[],
  $trainer$City: Islamabad
Phone: +92 300 5275097
Email: tee.irfan@gmail.com

Tahira is originally from London, UK, and now lives in Islamabad. She moved from management into literacy education after seeing the need for stronger reading and writing outcomes. She first used Jolly Phonics in 2004 and later became a private tutor focused on Jolly Phonics and Jolly Literacy. She has helped schools implement the programme and has supervised teachers using it.$trainer$,
  4,
  true
),
(
  'Tamkanat Zafar',
  'tamkanat-zafar',
  'Certified Jolly Phonics Trainer',
  'Tamkanat Zafar is an artist, English language instructor, trainer, curriculum coordinator, and education consultant.',
  NULL,
  ARRAY['More than two decades in education', 'Taught preschoolers, secondary students, and adults', 'Served as trainer, curriculum coordinator, and consultant']::TEXT[],
  ARRAY['Certified Jolly Phonics trainer', 'English language and art instructor']::TEXT[],
  ARRAY['Creative literacy instruction', 'Teacher training', 'Curriculum coordination']::TEXT[],
  $trainer$City: Islamabad
Phone: 0321-5234905
Email: tamkanat.zafar@gmail.com

Tamkanat discovered Jolly Phonics in 2005 and was inspired by the outcomes in reading and writing. She has used the method with many age groups and is passionate about training teachers through fun, practical, and effective methodology.$trainer$,
  5,
  true
),
(
  'Fatemah Imran',
  'fatemah-imran',
  'Certified Jolly Phonics Trainer',
  'Fatemah Imran is an early years teacher and trainer who supports Jolly Phonics and Jolly Literacy implementation from early years to Grade 3.',
  NULL,
  ARRAY['Founded EYRIE preschool and daycare in Islamabad', 'Implemented Jolly Phonics in nurseries, reception, and elementary classes', 'Supports teachers, assistants, coordinators, and parents']::TEXT[],
  ARRAY['Certified Jolly Phonics trainer', 'Early years educator']::TEXT[],
  ARRAY['Early years literacy', 'Play-based learning', 'Jolly Phonics setup and implementation']::TEXT[],
  $trainer$City: Islamabad
Phone: +92 3335159565
Email: eyrie.isl@gmail.com

Fatemah has taught in private preschools for more than ten years. She first encountered Jolly Phonics in 2009 and was inspired by its structure and enjoyable approach to reading. In 2018 she launched EYRIE, a play-based preschool and daycare in Islamabad, using Jolly Phonics to support children literacy development.$trainer$,
  6,
  true
),
(
  'Erum Tehreem',
  'erum-tehreem',
  'Certified Jolly Phonics Trainer',
  'Erum Tehreem is a trainer and section head focused on early years education and practical Jolly Phonics implementation.',
  NULL,
  ARRAY['More than 11 years of teaching and management experience', 'Implemented Jolly Phonics curriculum at Margalla Grammar School Wah Cantt', 'Trained more than 100 teachers']::TEXT[],
  ARRAY['Certified Jolly Phonics trainer', 'Business and Economics background']::TEXT[],
  ARRAY['Early years education', 'Parent orientation', 'Teacher training']::TEXT[],
  $trainer$City: Islamabad
Phone: +92 334 9192929
Email: erum.tehreem4@gmail.com

Erum Tehreem has taught at several prestigious institutions and worked as a lead teacher at Froebel International School. She now works as a section head at the kindergarten branch of a private institute. Since discovering Jolly Phonics in 2013, she has seen strong changes in student reading and writing and continues to train teachers and guide parents.$trainer$,
  7,
  true
),
(
  'Sadaf Asif',
  'sadaf-asif',
  'Certified Jolly Phonics Trainer',
  'Sadaf Asif is an early years educator, school leader, trainer, and the first Jolly Phonics YouTuber in Pakistan.',
  NULL,
  ARRAY['Runs an early years school and Jolly Phonics training centre in Islamabad', 'First Jolly Phonics YouTuber in Pakistan', 'Worked on AFAQ and KPK implementation projects']::TEXT[],
  ARRAY['Certified Jolly Phonics trainer', 'Early years educator']::TEXT[],
  ARRAY['Early years teaching', 'Teacher and parent training', 'Digital phonics resources']::TEXT[],
  $trainer$City: Islamabad
Phone: 03445037461
Email: sadaf_asif2000@hotmail.com

Sadaf has over 10 years of early years teaching experience across Islamabad and Wah Cantt. She works with playgroup, nursery, and KG children and is passionate about creating engaging activities. She has conducted staff, parent, and teacher training sessions across major cities and has supported Jolly Phonics implementation projects in Punjab and KPK.$trainer$,
  8,
  true
),
(
  'Ambreen Owais',
  'ambreen-owais',
  'Certified Jolly Phonics Trainer',
  'Ambreen Owais is a teacher and trainer who supports teachers and parents through her Phonics World work.',
  NULL,
  ARRAY['15 years of teaching experience', 'Runs Phonics World', 'Supports teachers and parents with Jolly Phonics understanding']::TEXT[],
  ARRAY['Certified Jolly Phonics trainer', 'Experienced classroom teacher']::TEXT[],
  ARRAY['Reading support', 'Teacher training', 'Parent guidance']::TEXT[],
  $trainer$City: Lahore
Phone: +92 3009500828
Email: ambowais@gmail.com

Ambreen has taught for 15 years in a renowned institution. She came across Jolly Phonics in 2015 and found it valuable for children who face difficulty in reading and writing. Through Phonics World, she aims to train teachers and parents so more children can benefit from the programme.$trainer$,
  9,
  true
),
(
  'Sonia Saleem',
  'sonia-saleem',
  'Certified Jolly Phonics Trainer',
  'Sonia Saleem is an experienced teacher and certified trainer with international school experience in Jeddah, Saudi Arabia.',
  NULL,
  ARRAY['Trained teachers after achieving strong classroom results with Jolly Phonics', 'Works as Head Teacher Trainer for MEET, KSA', 'Presented in KSAALT']::TEXT[],
  ARRAY['Certified Jolly Phonics trainer', 'Graduate Diploma in TESOL']::TEXT[],
  ARRAY['International school literacy', 'Teacher training', 'TESOL-informed instruction']::TEXT[],
  $trainer$City: Lahore
Email: miss.sonia2011@gmail.com

Sonia has used Jolly Phonics successfully in international schools in Jeddah, Saudi Arabia. The results led her to train other teachers so they could teach effectively. She has completed a Graduate Diploma in TESOL and is eager to support teachers and children in schools across Pakistan.$trainer$,
  10,
  true
)
ON CONFLICT (slug) WHERE slug IS NOT NULL DO UPDATE
SET name = EXCLUDED.name,
    title = EXCLUDED.title,
    bio = EXCLUDED.bio,
    image_url = COALESCE(trainers.image_url, EXCLUDED.image_url),
    achievements = EXCLUDED.achievements,
    credentials = EXCLUDED.credentials,
    specialties = EXCLUDED.specialties,
    profile_details = EXCLUDED.profile_details,
    sort_order = EXCLUDED.sort_order,
    published = EXCLUDED.published,
    updated_at = NOW();
