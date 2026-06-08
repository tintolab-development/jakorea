---
name: typescript
description: Write production-grade TypeScript and React code for apps/platform following project conventions. Use when writing TypeScript code, React components, hooks, utilities, or any TypeScript-related implementation. Ensures function declarations, CSS Modules styling, kebab-case file naming, and type safety.
---

This skill guides creation of production-grade TypeScript and React code for **JaKorea Platform** (`apps/platform`).

## Development Environment

- **React 19** + **TypeScript** + **Vite 7**
- **CSS Modules** for component styles (not Ant Design)
- Monorepo: `@jakorea/ui`, `@jakorea/utils`
- Path alias: `@/` → `src/`

## Code Implementation Guidelines

### 1. Use Early Returns

```typescript
export function ProgramList({ data }: Props) {
  if (!data) return null
  if (data.length === 0) return <p className={styles.empty}>목록이 없습니다.</p>
  return <ul className={styles.list}>...</ul>
}
```

### 2. Styling: CSS Modules

**Prioritize CSS Modules** for layout and visual styles.

```typescript
import styles from './program-card.module.css'

export function ProgramCard({ title }: Props) {
  return <article className={styles.card}>{title}</article>
}
```

Use inline styles only for truly dynamic values that cannot use CSS variables.

### 3. Function Declaration: Use `function` Keyword

```typescript
export function HomePage() { ... }

export function formatProgramStatus(status: string): string { ... }
```

Exception: callbacks inside hooks may use arrow functions.

### 4. Event Handlers: `handle` Prefix

```typescript
const handleSubmit = async () => { ... }
const handleCancel = () => { ... }
```

### 5. Accessibility

Add `aria-*`, `focus-visible` styles in CSS Modules, semantic HTML.

### 6. Type Definitions

Define `type` or `interface` for public component props.

### 7. File Naming: Kebab-case

- `home-page.tsx`, `app-layout.tsx`, `use-program-list.ts`
- Export: PascalCase (`export function HomePage`)
- Exception: `index.ts`, `index.tsx`

## Related Rules

- [Code Style](../../rules/coding/code-style.md)
- [Feature file naming](../../rules/coding/feature-file-naming.mdc)
- [Custom Hooks](../../rules/coding/custom-hooks.md)
- [Refactoring Principles](../../rules/coding/refactoring-principles.md)
- [CSS Modules Responsive](../css-modules-responsive/SKILL.md)
