# LearnPress Migration Summary

Generated: 2026-08-01T08:25:33.630Z

## Source

- Backup: C:\Users\DELL\Downloads\www-phonicsclub-com-20260801.wpress
- Extracted SQL: C:\Users\DELL\Downloads\education-ecommerce-ui\tmp\wpress-analysis\database.sql
- Database size: 207,303,083 bytes
- Indexed media/download archive entries: 21,998

## Content Found

- Courses: 7
- Lessons: 593
- Quizzes: 57
- Questions: 440
- LearnPress sections/modules: 66
- LearnPress section items: 537
- Referenced course assets: 80

## Course Inventory

| Old ID | Course | Status | Instructor | Price | Modules | Lessons | Quizzes | Questions |
|---:|---|---|---|---:|---:|---:|---:|---:|
| 37938 | Teaching of English through Jolly Phonics | publish | Fatima tuz Zahra | 3499.86 | 6 | 28 | 4 | 30 |
| 38375 | Teaching of English through Jolly Phonics Free Version | publish | Fatima tuz Zahra | Free | 1 | 2 | 1 | 10 |
| 38554 | Preschool Professional | publish | Fatima tuz Zahra | 5000 | 8 | 78 | 8 | 40 |
| 39801 | Pre K Crash Course | publish | Fatima tuz Zahra | Free | 2 | 48 | 0 | 0 |
| 39802 | Kindergarten 1 Crash Course (age 4 to 5) 6 months  or 24 weeks | publish | Fatima tuz Zahra | Free | 0 | 0 | 0 | 0 |
| 39803 | Kindergarten 2 Crash Course (age 5 to 6) 6 months or 24 weeks | publish | Fatima tuz Zahra | Free | 0 | 0 | 0 | 0 |
| 39807 | Complete Course (3 years) | publish | Fatima tuz Zahra | Free | 0 | 0 | 0 | 0 |

## Supabase Mapping

- `lp_course` posts map to `courses` with `metadata.old_wordpress_id`, `metadata.source = "learnpress"`, `published = false` by default until reviewed.
- LearnPress sections map to `course_modules` with preserved `sort_order`.
- Section lesson items map to `course_lessons`; lesson text becomes `article_content` / `rich_content`; video/PDF/download URLs become lesson media or `course_resources`.
- Section quiz items map to `course_quizzes`; linked LearnPress questions map to `quiz_questions` with options and answer flags.
- WordPress terms with course taxonomies map to `course_categories` when possible; unknown categories are preserved in `metadata.old_categories` for admin review.
- Course authors map to text instructor fields first; matching Supabase profiles can later be connected in `course_instructors`.
- Referenced uploads should be extracted from `.wpress`, reviewed, then uploaded to Supabase Storage before final import.

## Import Guardrails

- Do not overwrite current LMS courses; import with new IDs and skip slugs that already exist unless admin explicitly chooses merge.
- Import as drafts/unlisted first, then let admin preview and publish.
- Keep WordPress themes, plugins, Elementor layouts, plugin settings, order/session history, and security logs out of the LMS import.

## Referenced Asset Preview

- image: uploads/2022/01/Phonics-Club_20250302_234721_0001.png (found)
- image: uploads/2022/03/Phonics-Club_20250302_234721_0002.png (found)
- pdf: uploads/2022/03/Phonics-Sample-Lesson-LR.pdf (found)
- pdf: uploads/2022/03/Phonics-Sample-Lesson-US.pdf (found)
- download: uploads/2022/03/worksheet-module-2-long-short-comparison.docx (found)
- download: uploads/2022/06/ECCE-module-1.pptx (found)
- download: uploads/2022/06/ECCE-module-2-e.pptx (found)
- download: uploads/2022/06/ECCE-module-3-2.pptx (found)
- download: uploads/2022/06/ECCE-teaching-methodology-reading-material-1.docx (found)
- download: uploads/2022/06/Montessori-Week-1-e.pptx (found)
- download: uploads/2022/06/MTT-module-3-1.pptx (found)
- download: uploads/2022/06/mtt-sensorial-reading-material.docx (found)
- download: uploads/2022/06/MTT-week-2.pptx (found)
- image: uploads/2022/06/Phonics-Club_20250302_234722_0003.png (found)
- download: uploads/2022/06/Preschool-professional-2022-Sidra-Rauf.pptx (found)
- download: uploads/2022/06/preschool-professional-STEM-STEAM-2-2.docx (found)
- download: uploads/2022/06/preschool-professional-STEM-STEAM.docx (found)
- download: uploads/2022/07/ECCE-reading-material-5.docx (found)
- download: uploads/2022/07/ECCE-week-4.pptx (found)
- download: uploads/2022/07/ECCE-week-5.pptx (found)
- download: uploads/2022/07/ECCE-week-6.pptx (found)
- download: uploads/2022/07/ECCE-week-7.pptx (found)
- download: uploads/2022/07/ECCE-week-8.pptx (found)
- download: uploads/2022/07/MTT-module-4.pptx (found)
- download: uploads/2022/07/MTT-module-5-.pptx (found)
- download: uploads/2022/07/MTT-Week-6.pptx (found)
- download: uploads/2022/07/Preschool-professional-2022-STEAM-P2-2.pptx (found)
- download: uploads/2022/07/Preschool-professional-2022-STEAM-P3-1.pptx (found)
- download: uploads/2022/07/Preschool-professional-2022-STEAM-P4-1.pptx (found)
- download: uploads/2022/07/Preschool-professional-2022-STEAM-P5-Copy.pptx (found)
- download: uploads/2022/07/Preschool-professional-2022-STEAM-P6-Copy-1.pptx (found)
- download: uploads/2022/07/Preschool-professional-2022-STEAM-P7-Copy.pptx (found)
- download: uploads/2022/07/Preschool-professional-2022-STEAM-P8.pptx (found)
- download: uploads/2022/07/preschool-professional-STEM-STEAM-3-4.docx (found)
- download: uploads/2022/07/preschool-professional-STEM-STEAM-4-2.docx (found)
- download: uploads/2022/07/preschool-professional-STEM-STEAM-5-Copy.docx (found)
- download: uploads/2022/07/preschool-professional-STEM-STEAM-6-Copy-Copy.docx (found)
- download: uploads/2022/07/preschool-professional-STEM-STEAM-7-Copy.docx (found)
- download: uploads/2022/07/preschool-professional-STEM-STEAM-8.docx (found)
- download: uploads/2022/07/Reading-material-8.docx (found)
- download: uploads/2022/07/Reading-material-ECCE.docx (found)
- download: uploads/2022/07/Reading-material-MTT-5.docx (found)
- download: uploads/2022/07/Reading-material-week-6-ECCE.docx (found)
- download: uploads/2022/07/reading-material-week-6-MTT.docx (found)
- download: uploads/2022/07/Reading-material-week-7-ECCE.docx (found)
- download: uploads/2022/07/Reading-material-week8-MTT.docx (found)
- download: uploads/2022/07/Reading-material.docx (found)
- pdf: uploads/2022/07/Stages-and-Steps-of-Teaching-Jolly-Phonics-1.pdf (found)
- download: uploads/2022/07/week-7-MTT-1.pptx (found)
- download: uploads/2022/07/week-7-reading-material-MTT.docx (found)
- download: uploads/2022/07/Week-8-MTT.pptx (found)
- pdf: uploads/2022/08/Word-Blending-Boxes-Introduction.pdf (found)
- pdf: uploads/2022/08/Words-Blending-Boxes-Words-for-Groups-1-8.pdf (found)
- video: uploads/2022/11/Jolly-phonics-s-song.mp4 (found)
- image: uploads/2023/04/Screenshot_521-300x224.png (found)
- image: uploads/2023/04/Screenshot_521.png (found)
- image: uploads/2023/04/Screenshot_522-300x223.png (found)
- image: uploads/2023/04/Screenshot_522.png (found)
- video: uploads/2023/08/Jolly-song-d-1.mp4 (found)
- video: uploads/2023/08/Jolly-Song-m.mp4 (found)
- ...and 20 more assets in learnpress-summary.json

## Not Imported Yet

This is analysis only. No Supabase rows or storage files were created by this script.
