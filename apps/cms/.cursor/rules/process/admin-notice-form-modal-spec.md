---
priority: medium
category: process
---

# Admin notice create/edit modal — UI spec

**Component:** `NoticeFormModal` (`notice-form-modal.tsx`), styles `notice-register-modal.css`.  
**Shell:** **`ContentModal`** (see [table-implementation.md](../tables/table-implementation.md)); do not use `TealHeaderModal` directly here.

Keep this doc and CSS in sync when changing numbers.

## ContentModal

- `size` **large** (~1400px). Root class `notice-register-modal`.  
- `.ant-modal-content` padding: `18px 24px 20px`.  
- Max height `min(880px, 100vh)`. Column flex: header → scrollable body → footer.  
- Body: `flex: 1`, `min-height: 0`, `overflow-y: auto`.  
- `24px` between header and body; `24px` above footer (confirm with shared `ContentModal` spacing).

## Form

- `layout="vertical"`, `requiredMark={false}`, class `notice-register-modal__form`.  
- Block spacing **24px** (`.ant-form-item { margin-bottom: 24px }`; exception `0` inside filter row).  
- Label → control gap **10px** (including custom `.notice-register-modal__editor-label` for “Content”).

## Top filter row

- `notice-register-modal__filter-wrap` — flex, `gap: 16px`, wrap.  
- Category select **240×44** (`CmsSelect` large).  
- Public / pin radios ~**200px** width each.  
- Inner `Form.Item` margins **0** inside the filter row.

## Editor

- Host `.notice-register-modal__editor-host`, height **369px**.  
- Border on `.rich-text-editor`: `1px solid #e0e0e0`, `border-radius: 8px`.  
- `useNoticeWysiwygEditor` + `RichTextEditor` / `RichTextToolbar` for open/reset sync.

## Attachments row

- Table-like row: label cell **180px** (`#edf0f2`, 16px/700 center), body cell with `FileSelectField`.  
- Guide text: 14px/500, opacity **0.6**.  
- Match file size rules in code (e.g. **20MB** max).

## Footer

- **Cancel** `CmsButton` secondary large; **Save** primary large → `form.submit()`.

## Naming

- `NoticeRegisterModal` is a thin `mode="create"` wrapper — prefer `NoticeFormModal` for new code.

## Related

- [list-page-composition.mdc](../coding/list-page-composition.mdc) for list pages.

**Last updated:** 2026-04-21
