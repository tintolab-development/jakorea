---
name: css-modules-responsive
description: Frontend implementation guidance for Vite + React projects using CSS Modules. Use when asked to create, refactor, review, or debug responsive frontend UI, CSS Modules, component layout, mobile-first styling, breakpoint strategy, container sizing, grid/flex layouts, clamp/minmax usage, or Cursor rules for frontend CSS Modules work in apps/platform.
---

# CSS Modules Responsive (Platform)

Apply this skill when implementing or reviewing frontend UI in `apps/platform` that uses React + Vite with CSS Modules and responsive layouts.

## Core behavior

- Produce complete, ready-to-replace files when the user asks for code.
- Prefer kebab-case files: `home-page.tsx` + `home-page.module.css`, PascalCase export (`export function HomePage`).
- **CSS Module class names: camelCase** (`heroTitle`, `sortOptionActive`); use `styles.className` in TSX.
- Keep styling in CSS Modules unless inline style is required for dynamic values.
- Use mobile-first CSS by default.
- Avoid JavaScript viewport checks unless CSS cannot solve the layout.
- Prevent horizontal scrolling at Platform bands: 390 (mobile), 1280 (PC compact), 1600 (PC full).
- Use semantic HTML and accessible controls.

## Responsive CSS rules

Use these defaults unless the existing project has stronger conventions:

```css
.wrapper {
  width: min(100%, 1200px);
  margin-inline: auto;
  padding-inline: clamp(16px, 4vw, 40px);
}
```

Prefer:

- `grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));`
- `gap: clamp(12px, 2vw, 24px);`
- `font-size: clamp(16px, 2vw, 20px);`
- `max-width: 100%;`
- `min-width: 0;` on flex/grid children that contain text.
- `overflow-wrap: anywhere;` for user-generated or long text.
- Design tokens from `src/shared/styles/tokens.css`.

Avoid:

- fixed widths such as `width: 1200px` on layout containers.
- magic negative margins for alignment.
- global selectors from module files unless explicitly using `:global(...)`.
- breakpoint-only design that has no safe base mobile layout.
- `100vw` for full-width content when scrollbars can create overflow.

## Breakpoint guidance

Use breakpoints only after a fluid base layout is already safe. Prefer Platform 3-tier aliases from `shared/styles/breakpoints.css`:

```css
@media (--bp-below-pc) {
  /* Mobile · ~1079 */
}

@media (--bp-pc-up) {
  /* PC compact + PC full · 1080+ */
}

@media (--bp-pc-compact) {
  /* PC compact only · 1080~1599 */
}

@media (--bp-pc-full-up) {
  /* PC full · 1600+ */
}
```

Do not invent intermediate breakpoints (768 / 1024 / 1360 등). Do not create many narrow breakpoint patches unless the component truly needs them.

## Component output pattern

When generating a React component:

1. Start with semantic structure.
2. Use clear class names that map to layout responsibility.
3. Keep props typed.
4. Avoid over-engineering state.
5. Include the full TSX file and full CSS module file.
6. Follow kebab-case file naming per `coding/feature-file-naming.mdc`.

Use the template in `.cursor/references/templates/component-css-modules-template.md` when helpful.

## Review checklist

Before finalizing frontend CSS Modules work, check:

- Does the layout work at 320px and 360px without horizontal scroll?
- Are all flex/grid children protected with `min-width: 0` where needed?
- Are images/videos constrained with `max-width: 100%`?
- Are long titles, URLs, names, and chips wrapped safely?
- Are interactive elements reachable by keyboard?
- Are hover states paired with focus-visible states when relevant?
- Are styles scoped through CSS Modules?
- Are breakpoints mobile-first?
- Are files named in kebab-case?

See `.cursor/references/responsive-review-checklist.md` for the expanded checklist.

## Related rules

- `.cursor/rules/frontend-css-modules-responsive.mdc`
- `.cursor/rules/react-component-css-modules-pattern.mdc`
- `.cursor/rules/coding/feature-file-naming.mdc`

Recommended Cursor prompt:

```text
Refactor this component using CSS Modules and a mobile-first responsive layout.
Follow the css-modules-responsive skill and platform rules.
Return complete ready-to-replace TSX and module.css files with kebab-case naming.
```
