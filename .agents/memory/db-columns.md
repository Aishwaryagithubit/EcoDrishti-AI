---
name: DB column naming gotchas
description: Key differences between DB column names and OpenAPI/frontend field names in EcoDrishti
---

The DB schema uses snake_case columns that differ from the camelCase OpenAPI names:

- `carbon_submissions`: `student_count`, `staff_count` (NOT `students`/`staff`)
- `shared_resources`: `donor_name` (NOT `school_name`), `available` boolean (NOT `available_from`/`contact_email`)
- `reports`: no `generated_at` column — use `created_at`
- `community_posts`: `author_name` and `author_role` are NOT NULL — must be provided on insert

**Why:** Schema was written before the OpenAPI spec, so there's some name drift.

**How to apply:** Always check `\d <tablename>` in psql before writing INSERT statements for these tables.
