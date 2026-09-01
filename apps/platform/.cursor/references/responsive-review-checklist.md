# Responsive Review Checklist

Use this checklist when reviewing CSS Modules responsive implementation in `apps/platform`.

## Layout safety

- Validate Platform bands: **390** (mobile), **1280** (PC compact / middle), **1600** (PC full).
- Prefer `--bp-pc-up` for shared PC; use `--bp-pc-compact` only when middle must differ from full.
- Replace fixed container widths with `width: min(100%, max-width)` / content tokens.
- Add `min-width: 0` to grid/flex children containing text.
- Avoid `100vw` unless scrollbar overflow is accounted for.
- Use `box-sizing: border-box` if the project does not already define it globally.

## UI structure

- Layout roles (`shell` / `main` / `aside` / `toolbar` / `content` / `actions`) are expressed in markup.
- Responsive forks live at the owning layer (shell → page → feature → shared).
- No duplicate mobile/desktop DOM when CSS composition is enough.
- No ad-hoc middle breakpoints outside Platform aliases.

## Content safety

- Add `max-width: 100%` to images, videos, SVGs, and iframes.
- Use `overflow-wrap: anywhere` for long names, URLs, tags, and generated content.
- Prefer line clamping only when truncation is acceptable.

## CSS Modules quality

- Use locally scoped class names.
- Use `:global(...)` only for third-party library overrides.
- Keep class names role-based, not color-only or position-only.
- Avoid coupling CSS to fragile DOM depth selectors.
- File names use kebab-case per `coding/feature-file-naming.mdc`.

## Accessibility

- Use semantic elements first.
- Ensure buttons and links have visible focus states.
- Do not remove outlines without replacement.
- Preserve readable tap target sizes on mobile.
