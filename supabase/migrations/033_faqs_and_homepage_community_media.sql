-- Add richer FAQ defaults and fill homepage community media slots without
-- changing the existing Student Progress tile.

WITH new_faqs(content) AS (
  VALUES (
    '[
      {"q":"Can I register for trainings or webinars online?","a":["Yes. Published trainings and webinars appear on the Trainings page. Choose the event, submit your registration details, and wait for confirmation or payment instructions where required.","Your registered trainings and webinars also appear in your dashboard after they are linked to your account or email address."]},
      {"q":"Where will my training or webinar certificate appear?","a":["If a certificate is issued for a training or webinar, it may be uploaded to your dashboard, emailed to you, or both depending on the event process.","If you cannot see an expected certificate, contact support with your registration name, email address, event title, and date."]},
      {"q":"How do course certificates work?","a":["Course certificates are available only for courses that explicitly include a certificate pathway.","Certificate eligibility may depend on lesson completion, quiz requirements, assignment review, learning time, active enrollment, and instructor or admin approval."]},
      {"q":"Why is a course not showing as completed?","a":["Some courses require more than opening a lesson. Completion can depend on required lessons, quizzes, assignments, approved offline activity, or active enrollment status.","Open your dashboard or course workspace to review the exact progress and certificate requirements for that course."]},
      {"q":"Can I update my account details or password?","a":["Yes. Signed-in users can open Profile Settings from the dashboard to update their display name, username, and password.","Admins cannot see customer passwords. If you forget your password, use the secure password reset email flow."]},
      {"q":"How do member IDs and coupons work?","a":["Coupons and member IDs are validated during checkout and discounts are calculated by the website, not by manually changing invoice totals.","If a member ID includes a shipping-fee benefit, the invoice preview will show the shipping discount before the order is placed."]}
    ]'::jsonb
  )
)
INSERT INTO public.site_content (key, content)
SELECT 'faqs', content FROM new_faqs
ON CONFLICT (key) DO UPDATE
SET
  content = (
    WITH existing_items AS (
      SELECT item, ord
      FROM jsonb_array_elements(public.site_content.content) WITH ORDINALITY AS existing(item, ord)
    ),
    added_items AS (
      SELECT item, ord
      FROM jsonb_array_elements((SELECT content FROM new_faqs)) WITH ORDINALITY AS added(item, ord)
      WHERE NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(public.site_content.content) AS existing(item)
        WHERE LOWER(existing.item->>'q') = LOWER(added.item->>'q')
      )
    )
    SELECT jsonb_agg(item ORDER BY ord)
    FROM (
      SELECT item, ord FROM existing_items
      UNION ALL
      SELECT item, ord + 10000 FROM added_items
    ) merged
  ),
  updated_at = NOW();

WITH default_reels(content) AS (
  VALUES (
    '[
      {"id":"1","thumbnail":"/images/gallery/pilott.jpeg","videoUrl":"","title":"Pilot project classroom"},
      {"id":"2","thumbnail":"","videoUrl":"/images/gallery/vowels.mp4","title":"Vowel sounds practice"},
      {"id":"3","thumbnail":"/images/gallery/pilottttt.jpeg","videoUrl":"","title":"Pilot project learning"},
      {"id":"4","thumbnail":"/images/gallery/pilottttt1.jpeg","videoUrl":"","title":"Teacher workshop"},
      {"id":"5","thumbnail":"","videoUrl":"","title":"Student progress"},
      {"id":"6","thumbnail":"","videoUrl":"/images/gallery/pilothunza.mp4","title":"Phonics Club community"}
    ]'::jsonb
  )
)
INSERT INTO public.site_content (key, content)
SELECT 'social_reels', content FROM default_reels
ON CONFLICT (key) DO UPDATE
SET
  content = (
    WITH existing_items AS (
      SELECT existing.item, existing.ord, defaults.item AS default_item
      FROM jsonb_array_elements(public.site_content.content) WITH ORDINALITY AS existing(item, ord)
      LEFT JOIN jsonb_array_elements((SELECT content FROM default_reels)) AS defaults(item)
        ON defaults.item->>'id' = existing.item->>'id'
    ),
    patched_items AS (
      SELECT
        CASE
          WHEN item->>'id' = '5' THEN item
          WHEN default_item IS NOT NULL
            AND (
              COALESCE(item->>'thumbnail', '') = ''
              OR COALESCE(item->>'videoUrl', '') IN ('', 'https://www.youtube.com/@phonicsclub', 'https://www.instagram.com/phonics.club/', 'https://www.facebook.com/phonicsclub')
            )
          THEN item || default_item
          ELSE item
        END AS item,
        ord
      FROM existing_items
    ),
    missing_items AS (
      SELECT defaults.item, defaults.ord + 10000 AS ord
      FROM jsonb_array_elements((SELECT content FROM default_reels)) WITH ORDINALITY AS defaults(item, ord)
      WHERE NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(public.site_content.content) AS existing(item)
        WHERE existing.item->>'id' = defaults.item->>'id'
      )
    )
    SELECT jsonb_agg(item ORDER BY ord)
    FROM (
      SELECT item, ord FROM patched_items
      UNION ALL
      SELECT item, ord FROM missing_items
    ) merged
  ),
  updated_at = NOW();
