# Component CSS Modules Template

Use this output structure when the user asks for implementation code in `apps/platform`.

## File layout (kebab-case)

```txt
example-card/
  example-card.tsx
  example-card.module.css
  index.ts
```

## example-card.tsx

```tsx
import styles from './example-card.module.css';

type ExampleCardProps = {
  title: string;
  description?: string;
};

export function ExampleCard({ title, description }: ExampleCardProps) {
  return (
    <section className={styles.section} aria-labelledby="component-title">
      <div className={styles.inner}>
        <h2 id="component-title" className={styles.title}>{title}</h2>
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>
    </section>
  );
}
```

## example-card.module.css

```css
.section {
  width: 100%;
}

.inner {
  width: min(100%, 1200px);
  margin-inline: auto;
  padding-inline: clamp(16px, 4vw, 40px);
}

.title,
.description {
  min-width: 0;
  overflow-wrap: anywhere;
}

.title {
  font-size: clamp(24px, 5vw, 48px);
  line-height: 1.1;
}

.description {
  margin-top: 12px;
  font-size: clamp(16px, 2vw, 20px);
  line-height: 1.6;
}

@media (min-width: 768px) {
  .inner {
    padding-block: 64px;
  }
}
```

## index.ts

```ts
export { ExampleCard } from './example-card';
```
