---
priority: high
always_include: true
category: architecture
---

# Platform project structure

`apps/platform`은 **Vite + React + TypeScript + CSS Modules** 기반이며, **모바일 퍼스트 반응형**을 기본으로 한다.

## Layout

```txt
src/
├── app/              # bootstrap, router, providers
├── pages/            # route-level pages
├── widgets/          # composite blocks (layout shell, header, footer)
├── features/         # business use-cases (ui / model / api / lib)
├── entities/         # domain types + entity APIs
└── shared/           # ui primitives, hooks, lib, global styles
    └── styles/       # tokens, reset — 전역 CSS (module 아님)
```

## Component folder pattern

컴포넌트 단위 스타일은 **CSS Modules**만 사용한다. 파일·폴더는 **kebab-case**.

```txt
app-layout/
  app-layout.tsx          # export function AppLayout
  app-layout.module.css
  index.ts
```

## Dependency rules

| Layer | Purpose |
|-------|---------|
| `app` | `main.tsx` 진입, router, global providers |
| `pages` | 라우트 단위 화면 조합 |
| `widgets` | 레이아웃·헤더·푸터 등 복합 UI |
| `features` | 비즈니스 기능 단위 |
| `entities` | 도메인 모델·API |
| `shared` | 재사용 primitive (스타일 토큰 포함) |

- `shared`는 `features` / `entities`를 import하지 않는다.
- 페이지·위젯은 feature public API(`index.ts` barrel)를 통해 import한다.
- 경로 alias: `@/` → `src/`

## Styling

- **컴포넌트 스코프**: `*.module.css` (파일명 kebab-case, **클래스명 camelCase**)
- **전역**: `src/shared/styles/` (`tokens.css`, `reset.css`)
- **인라인 style**: 동적 값이 CSS 변수로 표현 불가할 때만
- **반응형**: JS viewport 분기 대신 CSS media query 우선

## Related

- [feature-file-naming.mdc](../coding/feature-file-naming.mdc)
- [image-assets.mdc](./image-assets.mdc)
- [frontend-css-modules-responsive.mdc](../frontend-css-modules-responsive.mdc)
- [react-component-css-modules-pattern.mdc](../react-component-css-modules-pattern.mdc)

**Last updated:** 2026-06-08
