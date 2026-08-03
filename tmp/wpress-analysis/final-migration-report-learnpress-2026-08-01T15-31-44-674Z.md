# LearnPress Migration Final Report

Batch: learnpress-2026-08-01T15-31-44-674Z
Generated: 2026-08-01T16:19:04.957Z
Mode: APPLIED + VALIDATED

## Cleanup Summary

- Duplicate lessons removed: 0
- Empty lessons skipped: 0
- Orphaned records skipped: 0
- Revisions/autosaves skipped: 0
- Unused archive media excluded from the import plan: 21918

## Recovered Hierarchy

- 39802 Kindergarten 1 Crash Course (age 4 to 5) 6 months  or 24 weeks: recovered 1 modules / 5 items from course body plus /kindergarten-1/ linked page
- 39803 Kindergarten 2 Crash Course (age 5 to 6) 6 months or 24 weeks: recovered 1 modules / 7 items from course body plus /kindergarten-2/ linked page
- 39807 Complete Course (3 years): recovered 3 modules / 60 items from Pre K hierarchy plus Complete Course body

## Import Plan

| Old ID | Course | Modules | Lessons | Quizzes | Questions | Assets | Ordered items |
|---:|---|---:|---:|---:|---:|---:|---:|
| 37938 | Teaching of English through Jolly Phonics | 6 | 28 | 4 | 30 | 7 | 32 |
| 38375 | Teaching of English through Jolly Phonics Free Version | 1 | 2 | 1 | 10 | 1 | 3 |
| 38554 | Preschool Professional | 8 | 78 | 8 | 40 | 45 | 86 |
| 39801 | Pre K Crash Course | 1 | 48 | 0 | 0 | 27 | 48 |
| 39802 | Kindergarten 1 Crash Course (age 4 to 5) 6 months  or 24 weeks | 1 | 5 | 0 | 0 | 0 | 5 |
| 39803 | Kindergarten 2 Crash Course (age 5 to 6) 6 months or 24 weeks | 1 | 7 | 0 | 0 | 0 | 7 |
| 39807 | Complete Course (3 years) | 3 | 60 | 0 | 0 | 27 | 60 |

## Applied Import

- Teaching of English through Jolly Phonics: 6 modules, 32 lessons, 4 quizzes, 30 questions, 6 resources
- Preschool Professional: 8 modules, 86 lessons, 8 quizzes, 40 questions, 44 resources
- Teaching of English through Jolly Phonics Free Version: 1 modules, 3 lessons, 1 quizzes, 10 questions, 0 resources
- Pre K Crash Course: 1 modules, 48 lessons, 0 quizzes, 0 questions, 27 resources
- Kindergarten 1 Crash Course (age 4 to 5) 6 months  or 24 weeks: 1 modules, 5 lessons, 0 quizzes, 0 questions, 0 resources
- Complete Course (3 years): 3 modules, 60 lessons, 0 quizzes, 0 questions, 27 resources
- Kindergarten 2 Crash Course (age 5 to 6) 6 months or 24 weeks: 1 modules, 7 lessons, 0 quizzes, 0 questions, 0 resources

## Validation Totals

- Imported courses: 7
- Modules: 21
- Lessons: 241
- Quizzes: 13
- Questions: 80
- Course resources: 104
- Storage-backed assets: 104

## Skipped Items

- None

## Warnings

- None

## Files

- Plan JSON: C:\Users\DELL\Downloads\education-ecommerce-ui\tmp\wpress-analysis\learnpress-import-plan-learnpress-2026-08-01T15-31-44-674Z.json
- Rollback SQL: C:\Users\DELL\Downloads\education-ecommerce-ui\tmp\wpress-analysis\rollback-learnpress-2026-08-01T15-31-44-674Z.sql
- Report: C:\Users\DELL\Downloads\education-ecommerce-ui\tmp\wpress-analysis\final-migration-report-learnpress-2026-08-01T15-31-44-674Z.md

## Admin Review Notes

- Every imported course is saved as draft, hidden from the public Courses page, and tagged with metadata.migration_batch = learnpress-2026-08-01T15-31-44-674Z.
- Downloadable material is imported into Course Resources so students can access worksheets, reading files, presentations, videos, and teacher resources from a dedicated course page section.
- Existing LMS courses are not overwritten; slug collisions are imported with a learnpress- prefix.
