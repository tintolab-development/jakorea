---
priority: high
category: process
---

# Enrollment program detail modal — **Posts** tab

Body under **Posts** (excluding modal chrome): **two columns** — **Posts** (left) and **Files & photos** (right). Match screenshot + this checklist.

## Shell

- Width **1400px**. Body height **814px** below header. Tabs: Program info | **Posts** | Submissions & documents. Footer: centered **Close**.  
- Tab panel: `min-height: 0`, flex fill so content uses the 814px stack.

## Left — Posts

- Row: title **Posts** + **Write post** button (100×32, primary / teal).  
- Cards: avatar + author + timestamp; body + optional “read more”; top-right **read/unread** pill; footer meta (views, comments, attachments).  
- **Unread**: teal left stroke or light border + **Unread** pill (pill: `border-radius: 50px`, `background: rgba(1, 161, 175, 0.10)`, padding `3px 8px`, flex center).  
- **Read** pill: `rgba(51, 51, 51, 0.10)`, same padding.

## Right — Files & photos

- Row: title + **More** (100×32, outline).  
- List: file-type icon + name + “open original” link; scroll inside column if needed.

## Files

- `enrollment-program-detail-modal.tsx` / `.css` — implement 814px body and two-column layout here.

## Related

- [member-detail-modal-spec.md](./member-detail-modal-spec.md)  
- [persona.md](./persona.md)  

**Last updated:** 2026-04-21
