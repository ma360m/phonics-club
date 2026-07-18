-- Editable public website video slots.

INSERT INTO site_content (key, content)
VALUES (
  'site_videos',
  '{
    "homeHeroVideoUrl": "https://youtu.be/8Tjs_Z1I0cM?si=jlpQPO-_UfeqUwVa",
    "homeHeroDemoUrl": "https://youtu.be/AyZdFB8s2IA?si=NeSy2O37jZCVQdmf",
    "readingSuccessVideoUrl": "/images/schools/Watch the Transformation!.mp4",
    "trainingsHeroVideoUrl": "/images/schools/cover video jolly experience day.mp4",
    "trainingsOnsiteVideoUrl": "/images/schools/trainingclip.mp4"
  }'::jsonb
)
ON CONFLICT (key) DO UPDATE
SET content = site_content.content || EXCLUDED.content,
    updated_at = NOW();
