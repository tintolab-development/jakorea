---
priority: high
category: process
---

# CMS — admin-provisioned vs self-serve members

Align UI and mocks with `User.registeredByAdmin`, `User.identitySelfSignupCompletedAfterAdminRegistration`, and `admin-provisioned-member-policy.ts`.

## Registration type

| Treat as | Condition |
|----------|-----------|
| **Admin-provisioned** (broader CMS edit) | `registeredByAdmin === true` **and** `identitySelfSignupCompletedAfterAdminRegistration !== true` |
| **Self-registered** | Otherwise — signed up directly, or finished self-signup after admin invite |

`shouldShowCmsMemberInfoEditButton` ≈ admin-provisioned; `isSelfRegisteredMemberForCmsBasicInfo` ≈ inverse for basic-info rules.

## Who can edit what

- **Admin-provisioned:** admins can edit basic info except fields marked read-only (join date, linked socials, system counts, etc.).  
- **Self-registered:** basic info stays read-only for admins; exceptions:  
  - **ADMIN** self-registered: saving may use `draftToAdminMemberRestrictedPatch` (comment + permission type).  
  - **Admin comment**: only when permission approval is **APPROVED**.  
  - **INSTRUCTOR** self-registered: when allowed, also **instructor fee tier** with comment patch.  
- **ADMIN member detail:** all admin roles can edit comment + permission type; **only master** edits other profile fields when member is admin-provisioned (`canEditAdminMemberInfo`). Non-master saves comment/permission only via restricted patch.  
- Captions “registered by admin” live in **`DetailInfoForm` `description`** only — no duplicate titles.

## Institution (school) detail

- Admin-provisioned: editable name, location, admin comment; **createdAt** and **application/enrollment counts** read-only.  
- Self-registered: lock basic fields; **admin comment** editable.  
- Use `InstitutionFields` + `draftToSchoolInstitutionBasicInfoPatch` (counts excluded).

## API / mock

Normalize API fields to the two flags above. CMS-created users get `registeredByAdmin: true` in mocks (`user-service.ts`, `mock/users.ts`).

## Header actions

Follow existing `user-detail-header` / full-page shell (delete, edit, PII view, etc.).

## Implementation map

- Policy: `admin-provisioned-member-policy.ts`  
- UI locks: `user-basic-info-section.tsx`  
- Save: `use-user-detail-controller.ts`, `admin-provisioned-member-basic-info-draft.ts`  
- Types: `types/user.ts`  

**Last updated:** 2026-04-21
