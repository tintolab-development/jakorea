---
priority: high
always_include: false
category: process
---

# Sub-program management

## Deletion

- Cannot delete a sub-program **referenced elsewhere** (`inUse` or server equivalent).  
- Bulk delete: skip in-use rows and **tell the user**; if every selected row is in use, show **ineligibility** only (no destructive confirm).  
- Map server errors (e.g. 409) to user-facing messages.

## Inline edit

- Edit mode: only **name** and **enabled** may change, for **all rows currently loaded** (`tableData`).  
- Block or guard search while unsaved edits exist.  
- Deleting rows in edit mode is allowed; remove ids from `draftById` / `selectedRowKeys` when rows disappear.

**Last updated:** 2026-04-21
