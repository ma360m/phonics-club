-- Ensure homepage embedded video and Watch Demo button use separate requested links

INSERT INTO site_content (key, content)
VALUES (
  'hero_video',
  '{"videoUrl":"https://youtu.be/8Tjs_Z1I0cM?si=jlpQPO-_UfeqUwVa","demoButtonUrl":"https://youtu.be/AyZdFB8s2IA?si=NeSy2O37jZCVQdmf"}'::jsonb
)
ON CONFLICT (key) DO UPDATE SET
  content = EXCLUDED.content,
  updated_at = NOW();
