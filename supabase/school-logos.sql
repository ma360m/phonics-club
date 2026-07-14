-- Repair and seed the homepage school logo ticker.
-- Run this in Supabase SQL Editor if the front page still shows broken logo icons.

INSERT INTO public.site_content (key, content)
VALUES (
  'school_logos',
  '[
    {"id":"tns","name":"TNS","imageUrl":"/images/logos/tns.jpg","sortOrder":1},
    {"id":"froebels","name":"Froebel''s International","imageUrl":"/images/logos/froebels.jpg","sortOrder":2},
    {"id":"starfish","name":"Starfish School","imageUrl":"/images/logos/starfish.jpg","sortOrder":3},
    {"id":"quixotic","name":"Quixotic Academy","imageUrl":"/images/logos/quixotic.jpg","sortOrder":4},
    {"id":"lgs","name":"LGS","imageUrl":"/images/logos/lgs.jpg","sortOrder":5},
    {"id":"beaconhouse","name":"Beaconhouse","imageUrl":"/images/logos/beaconhouse.png","sortOrder":6},
    {"id":"rwis","name":"RWIS","imageUrl":"/images/logos/RWIS.jpg","sortOrder":7},
    {"id":"dynamic","name":"Dynamic International","imageUrl":"","sortOrder":8},
    {"id":"academus","name":"Academus","imageUrl":"/images/logos/ACADEMUS.png","sortOrder":9},
    {"id":"alda","name":"ALDA","imageUrl":"/images/logos/ALDA.png","sortOrder":10},
    {"id":"horizon","name":"Horizon School System","imageUrl":"/images/logos/HORIZON.jpg","sortOrder":11},
    {"id":"aksp","name":"AKSP","imageUrl":"/images/logos/AKSP.png","sortOrder":12},
    {"id":"akrsp","name":"AKRSP","imageUrl":"/images/logos/AKRSP.jpg","sortOrder":13}
  ]'::jsonb
)
ON CONFLICT (key) DO UPDATE SET
  content = EXCLUDED.content,
  updated_at = NOW();
