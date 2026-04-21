---
priority: medium
category: process
---

# Member detail — program history — certificates (product rules)

Applies when implementing bulk/individual **completion certificate** vs **participation certificate** flows on member program history.

Reason-picker UI and option values follow `certificate-bulk-issue-reason-modal.tsx` (`REASON_OPTIONS`) and domain specs.

## Issuance logic

1. Users may re-issue freely **until personal-data retention expires**.  
2. **Completion certificate** when the user **meets completion criteria**.  
3. **Participation certificate** when they **do not** meet completion criteria.  
Keep API/mock models consistent with this split.

## UI copy

- Do **not** paste these rules as permanent on-screen banners without product/design approval.  
- Document intent in this file and short code comments near handlers.  
- If Figma specifies copy, follow Figma.

**Last updated:** 2026-04-21
