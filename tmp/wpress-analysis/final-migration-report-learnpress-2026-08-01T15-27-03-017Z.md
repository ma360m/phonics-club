# LearnPress Migration Final Report

Batch: learnpress-2026-08-01T15-27-03-017Z
Generated: 2026-08-01T15:27:06.292Z
Mode: DRY RUN

## Cleanup Summary

- Duplicate lessons removed: 0
- Empty lessons skipped: 0
- Orphaned records skipped: 0
- Revisions/autosaves skipped: 0
- Unused archive media excluded from the import plan: 21918

## Recovered Hierarchy

- None

## Import Plan

| Old ID | Course | Modules | Lessons | Quizzes | Questions | Assets | Ordered items |
|---:|---|---:|---:|---:|---:|---:|---:|
| 37938 | Teaching of English through Jolly Phonics | 6 | 28 | 4 | 30 | 7 | 32 |
| 38375 | Teaching of English through Jolly Phonics Free Version | 1 | 2 | 1 | 10 | 1 | 3 |
| 38554 | Preschool Professional | 8 | 78 | 8 | 40 | 45 | 86 |
| 39801 | Pre K Crash Course | 1 | 48 | 0 | 0 | 27 | 48 |
| 39802 | Kindergarten 1 Crash Course (age 4 to 5) 6 months  or 24 weeks | 0 | 0 | 0 | 0 | 0 | 0 |
| 39803 | Kindergarten 2 Crash Course (age 5 to 6) 6 months or 24 weeks | 0 | 0 | 0 | 0 | 0 | 0 |
| 39807 | Complete Course (3 years) | 0 | 0 | 0 | 0 | 0 | 0 |

## Applied Import

- Dry run only. Use --apply to import.

## Skipped Items

- None

## Warnings

- None

## Files

- Plan JSON: C:\Users\DELL\Downloads\education-ecommerce-ui\tmp\wpress-analysis\learnpress-import-plan-learnpress-2026-08-01T15-27-03-017Z.json
- Rollback SQL: C:\Users\DELL\Downloads\education-ecommerce-ui\tmp\wpress-analysis\rollback-learnpress-2026-08-01T15-27-03-017Z.sql
- Report: C:\Users\DELL\Downloads\education-ecommerce-ui\tmp\wpress-analysis\final-migration-report-learnpress-2026-08-01T15-27-03-017Z.md

## Admin Review Notes

- Every imported course is saved as draft, hidden from the public Courses page, and tagged with metadata.migration_batch = learnpress-2026-08-01T15-27-03-017Z.
- Downloadable material is imported into Course Resources so students can access worksheets, reading files, presentations, videos, and teacher resources from a dedicated course page section.
- Existing LMS courses are not overwritten; slug collisions are imported with a learnpress- prefix.
