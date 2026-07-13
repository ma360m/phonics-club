UPDATE site_content
SET content = jsonb_set(
  content,
  '{websiteUrl}',
  '"https://officialvortexlear.wixsite.com/vortex-learning"'::jsonb,
  true
)
WHERE key = 'vortex_learning';
