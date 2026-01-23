Run a project-wide audit for consistency between form submit payloads and detail/list displayed data.

Rules:

- If a field is shown in Detail and is meant to be editable, it must exist in Create/Edit forms and payload/DTO mapping.
- If a field is collected by a form but absent from DTO/Detail, flag as data-loss risk (S1).
- Detect and report conditional dependencies based on code/schema validation.

Output:

- Per-entity field set comparisons (Form/DTO/Detail/List)
- Issues categorized S1~S3 with file locations and fix points
