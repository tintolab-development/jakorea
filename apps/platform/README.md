# JaKorea Platform

Vite + React + TypeScript + **CSS Modules** 기반 공개 플랫폼 앱. 모바일 퍼스트 반응형(~1079 / 1080+ / 1600+)을 기본으로 한다.

## 개발

```bash
pnpm --filter platform dev
pnpm --filter platform build
pnpm --filter platform typecheck
```

## 디렉터리 구조

```txt
apps/platform/
├── .cursor/rules/          # CSS Modules·반응형 Cursor 규칙
└── src/
    ├── app/                # App, providers, router
    ├── pages/              # 라우트 단위 페이지
    ├── widgets/            # 레이아웃·헤더·푸터 등
    ├── features/           # 비즈니스 기능
    ├── entities/           # 도메인 모델
    └── shared/
        ├── styles/         # 전역 tokens, reset
        ├── ui/
        ├── hooks/
        └── lib/
```

## 컴포넌트 패턴

파일·폴더 **kebab-case**, export **PascalCase**:

```txt
home-page/
  home-page.tsx          # export function HomePage
  home-page.module.css
  index.ts
```

상세 규칙: `.cursor/rules/README.md`

## 스타일

| 구분 | 위치 |
|------|------|
| 전역 토큰·리셋 | `src/shared/styles/` |
| 컴포넌트 스코프 | `*.module.css` (colocated) |
| 경로 alias | `@/` → `src/` |

Breakpoint 토큰: `src/shared/styles/tokens.css`
