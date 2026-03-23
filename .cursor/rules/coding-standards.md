# 공통 코딩 표준

모노레포 전체에 적용되는 코딩 표준입니다.

## 📋 ESLint & Prettier

### 설정
- Workspace 전체에서 `eslint .`와 `prettier --write .` 명령을 실행하면 모든 앱에 적용됩니다.
- 각 앱에서도 개별적으로 실행 가능합니다:
  ```bash
  pnpm --filter cms lint
  pnpm --filter cms format
  ```

### 자동 수정
```bash
pnpm lint:fix      # ESLint 자동 수정
pnpm format        # Prettier 포맷팅 적용
```

## 📋 TypeScript

### 기본 원칙
- **엄격한 타입 체크**: `strict: true` 모드 사용
- 모든 컴포넌트와 함수는 TypeScript로 작성합니다.
- 타입 정의는 `types/` 디렉토리에 도메인별로 관리합니다.

### 타입 체크
```bash
pnpm typecheck     # 전체 타입 체크
pnpm --filter cms typecheck  # 특정 앱만 타입 체크
```

## 📋 파일 네이밍

### 케밥케이스 (kebab-case)
- ✅ `dashboard.tsx`, `instructor-list.tsx`, `layout.tsx`
- ❌ `Dashboard.tsx`, `InstructorList.tsx`, `Layout.tsx`

**예외**:
- `index.ts`, `index.tsx`는 예외적으로 허용 (디렉토리 진입점)

## 📋 Git 워크플로우

### 브랜치 전략
- `main`: 프로덕션 브랜치
- `develop`: 개발 브랜치
- `feature/*`: 기능 개발 브랜치
- `fix/*`: 버그 수정 브랜치

### 커밋 메시지
- 명확하고 간결한 커밋 메시지 작성
- 변경 사항을 구체적으로 설명

### 커밋 전 검증 (필수)
- **`--no-verify` 사용 금지.** pre-commit 훅을 건너뛰지 않는다.
- 커밋/병합 전 반드시 `pnpm typecheck`, `pnpm lint`를 실행하고, 에러가 없을 때만 커밋한다.
- 자세한 내용: [commit-verify-required.md](./commit-verify-required.md)






