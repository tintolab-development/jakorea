---
priority: high
category: process
---

# CMS — member detail “information consent” block

Spec for the **Detail info** tab consent section. Keep in sync with `user-consent-agreement-section.tsx` and `resolveUserConsentAgreementPreset`.

## Common

- Each item tracks **consent status**, **timestamp**, and **document** when required.  
- Items marked **optional** in law may still block features below if declined.  
- Items needing a **written agreement** integrate with document workflow; CMS shows status and “view agreement” where applicable.

## Items (business rules)

1. **PII collection (signup)** — Required for signup; without consent, signup cannot complete.  
2. **Marketing** — Optional; if declined, **no marketing alerts** (align channels with policy).  
3. **Portrait rights** — Document required; optional, but **no program participation** without consent.  
4. **Payment statement consent** — Document required; optional for ongoing use, but **no payroll line payments** without it. **First settlement application** must complete the flow once. **Re-consent** when PII expires/changes.  
5. **Sex-offense record check** (instructors only) — Document; optional, but **no teaching** without consent.  
6. **Administrative data-sharing pre-consent** (instructors) — Same pattern as 5.  
7. **Educator undertaking** (instructors) — Same pattern as 5.

## Visibility by role (summary)

| Item | Individual / school flows | Instructor |
|------|---------------------------|------------|
| PII, Marketing | ✓ | ✓ |
| Portrait | Per preset | Per preset |
| Payment statement | Per preset | ✓ |
| Items 5–7 | — | ✓ |

**ADMIN** preset may hide items — if code diverges, update both doc and component.

## API

- Store per-item timestamps, document ids/versions, first-settlement flags, re-consent flags — align with backend.  
- CMS is mostly **read + status**; PDF/e-sign can live in a separate spec.

**Last updated:** 2026-04-21
