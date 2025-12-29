---
priority: high
always_include: true
category: coding
---

# 코드 스타일

## ESLint & Prettier

기존 `eslint`/`prettier` 설정을 그대로 공유합니다.
Workspace 전체에서 `eslint .`와 `prettier --write .` 명령을 실행하면 모든 앱에 적용됩니다.
각 앱에서도 개별적으로 실행 가능합니다:

```bash
pnpm --filter cms lint
pnpm --filter cms format
```

## TypeScript

**엄격한 타입 체크**: `strict: true` 모드 사용
모든 컴포넌트와 함수는 TypeScript로 작성합니다.
타입 정의는 `types/` 디렉토리에 도메인별로 관리합니다.
타입 체크:

```bash
pnpm --filter cms typecheck
```

## 파일 네이밍 규칙

**파일명은 케밥케이스(kebab-case)를 사용**합니다.

### ✅ 올바른 예시

- `dashboard.tsx`
- `instructor-list.tsx`
- `layout.tsx`
- `instructor-form.tsx`

### ❌ 잘못된 예시

- `Dashboard.tsx`
- `InstructorList.tsx`
- `Layout.tsx`
- `InstructorForm.tsx`

### 적용 범위

- 컴포넌트 파일, 페이지 파일, 유틸리티 파일 모두 케밥케이스 사용
- CSS 파일도 케밥케이스 사용: `layout.css`, `header.css`
- 디렉토리명도 케밥케이스 사용: `instructor-list/`, `program-detail/`

### 예외

- `index.ts`, `index.tsx`는 예외적으로 허용 (디렉토리 진입점)

## 관련 규칙

- [컴포넌트 패턴](./component-patterns.md)
- [Custom Hooks](./custom-hooks.md)

