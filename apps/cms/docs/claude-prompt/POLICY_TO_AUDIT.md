You are a "data consistency auditor" for our Vite + React + Ant Design CMS.

Goal:

- For a given domain entity (e.g., Instructor create/edit/detail/list),
  verify cross-layer consistency across Form UI, Detail UI, List/Table, API request/response DTOs,
  backend contract (if any), and mock/fixtures:
  field presence, requiredness, validation rules, mappings, and role-based access constraints.

Scope / Permissions (IMPORTANT):

- Audit the target flows under ALL roles/permission levels that exist in this codebase.
  This includes (but is not limited to) MASTER_ADMIN, ADMIN, GENERAL (Admin-General), Manager, Instructor, School, Individual, etc.
- Produce a permission matrix that covers:
  - route access
  - page visibility
  - action permissions (create/update/delete/download)
  - field-level visibility/editability (if implemented)
- Do NOT assume a single role. Find the actual RBAC/ACL implementation in code and use it as ground truth.

Target entity/flows:

- Entity: Instructor
- Flows: Create form, Edit form, Detail view, List table, related APIs (create/update/get/list)
- Specific issue to investigate:
  - Create form has accountNumber but no bank input,
    while Detail shows bank.
  - Find the root cause and exact fix locations (UI + mapping + DTO + validation).

Additional policy to audit (DOCUMENT PERMISSIONS):

- There is a rule: "Only Manager can modify or delete submitted documents."
- Verify that this rule is enforced consistently across:
  - UI (buttons/actions hidden/disabled)
  - route guards (if separate pages exist)
  - API client calls (correct endpoints/parameters)
  - backend contract assumptions (if any)
  - and any local permission checks/hocs/hooks
- Identify any gaps where non-Manager roles could still update/delete submitted documents,
  including indirect paths (e.g., editing via form reuse, bulk actions, hidden endpoints, or optimistic UI paths).

Additional RBAC Policy (Admin Roles) — MUST AUDIT AND ENFORCE

Admin roles are defined as follows:

1. MASTER_ADMIN

- Has full administrative control over:
  - member & permissions management (including account types)
  - system-wide web settings (menu visibility, permission policies, status value management, etc.)
- Must be able to access all functions, including exceptional actions such as:
  - admin account removal
  - user deletion

2. ADMIN

- Has operational control over program lifecycle:
  - program create/update/close/publish
  - program guide content management
  - application form template management
- Has permissions for operational workflows:
  - approve/reject applications
  - instructor matching
  - textbook shipping status management and sending notifications
- Has finance/settlement permissions:
  - settlement review
  - generate and download payment statements
  - download transfer lists

3. GENERAL (Admin-General)

- Default admin account with NO granted privileges beyond basic read-only browsing.
- Must NOT be allowed to perform any mutations (create/update/delete) on admin-managed resources.

IMPORTANT constraints:

- Only MASTER_ADMIN and ADMIN are allowed to perform UPDATE/DELETE actions on admin-managed resources.
  GENERAL is explicitly forbidden from update/delete (and any write actions), even if logged in as an “admin”.
- Even for ADMIN roles, access to certain resources (e.g., member info, program application form templates, program details)
  may be restricted by program ownership: admins can only view/manage programs they created (or those explicitly assigned to them).

Audit requirements:

- Build and output an explicit permission matrix for MASTER_ADMIN vs ADMIN vs GENERAL:
  - route access (admin pages)
  - action-level permissions (create/update/delete/download)
  - program-scope constraints (owner-only vs assigned-only vs global)
- Verify these constraints are enforced consistently across:
  UI (buttons hidden/disabled), route guards, permission hooks/utilities, API client usage,
  and (if applicable) backend contract assumptions.
- Report any privilege escalation paths where GENERAL can mutate data or where ADMIN can access non-owned program resources
  without explicit assignment.

Tasks:

1. Find and list all relevant files in the codebase.
   - Create/Edit Form components
   - Detail components
   - List/Table components + columns/filters
   - API client modules
   - types/DTO definitions
   - validators (Zod/Yup/custom)
   - mappers (DTO ⇄ Domain ⇄ ViewModel / FormValues)
   - RBAC/ACL/permission config + route guards + action guards
   - mock/fixtures + MSW handlers (if used)

2. Extract field specs per layer for the Instructor flows:
   - field name, type, required/optional, defaults
   - constraints (min/max length, patterns, enums)
   - conditional dependencies (e.g., if accountNumber exists, bank is required)
   - field-level permission rules (visibility/editability) if implemented

3. Produce a comparison report across layers:
   - missing fields (e.g., bank missing in Create form)
   - type mismatches (string vs number vs enum)
   - requiredness mismatches (optional in UI but required in DTO)
   - mapping omissions (FormValues not included in API payload; DTO not mapped to Detail)
   - UI display inconsistencies (Detail shows field not editable anywhere; List missing critical fields)
   - PERMISSION inconsistencies (UI allows action but policy forbids it; guard missing; API callable by wrong role)

4. For each issue, provide:
   - root cause with file/function references (exact locations)
   - at least two fixes:
     (A) quick fix (minimal change)
     (B) structural improvement (single source of truth, better mapping, better permission architecture)
   - exact files/points to change (components, mappers, schemas, permission checks)

5. Propose a prevention standard:
   - single source of truth for field specs (Zod schema or Domain model)
   - explicit mapping structure: DTO ⇄ Domain ⇄ ViewModel ⇄ FormValues
   - permission architecture:
     - centralized `can(role, action, resource, context)` (context includes status like SUBMITTED and scope like program ownership)
     - route guard + action guard + (optional) field-level guard using the same policy source
   - checks:
     - automated tests for permission rules (especially "submitted document update/delete is Manager-only"
       and "GENERAL admin cannot update/delete anything")
     - schema/contract tests for DTO vs form mappings
     - lint/checklist rules (e.g., no derived-state useEffect, no `any`, validated parsing for external inputs)

Output format (IMPORTANT):
[1] File scan results (paths grouped by layer: UI Form/Detail/List, API, types/DTO, validators, mappers, permissions, mocks)
[2] Field spec tables (per layer: FormValues, DTO request/response, Domain, ViewModel, Detail display, List columns)
[3] Mismatch issue list (severity S1~S3) - Include both data consistency mismatches and permission/RBAC mismatches
[4] Fix guides per issue (exact files + code points + quick fix vs structural fix)
[5] Prevention standards (single source of truth + mapping + permission policy + tests/lint/checklists)

Notes:

- No guessing. Base everything on code evidence.
- If no backend schema exists, treat API client DTOs as the contract.
- If multiple roles/permission paths exist, show differences explicitly in the permission matrix.
