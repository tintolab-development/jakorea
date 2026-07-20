# Responsive Review Checklist

Use this checklist when reviewing CSS Modules responsive implementation in `apps/platform`.

## Layout safety

- Validate widths at 320, 360, 390, 768, 1024, and 1280px.
- Replace fixed container widths with `width: min(100%, max-width)`.
- Add `min-width: 0` to grid/flex children containing text.
- Avoid `100vw` unless scrollbar overflow is accounted for.
- Use `box-sizing: border-box` if the project does not already define it globally.

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
