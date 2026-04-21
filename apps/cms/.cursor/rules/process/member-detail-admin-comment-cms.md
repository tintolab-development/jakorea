---
priority: high
category: process
---

# CMS — member detail “admin comment”

Product rules for the admin comment block on the **Detail info** tab. UI: `user-detail-admin-comment-section.tsx`.

## Visibility

- Comments are **not** private to the author. **Every** CMS admin who can open the member sees the **same** text (shared operational note per member).
- Do not filter to “only my comments” on the client. Render `adminComment` (or equivalent) from the member-detail response as returned.

## API

- The backend must not return different bodies per admin user. Model as **one comment per member** (or latest revision of a single thread).  
- If you add author labels or audit logs later, keep **read access** consistent with this rule unless product explicitly changes it.

**Last updated:** 2026-04-21
