# JaKorea Monorepo

Turborepo + pnpm 기반의 JaKorea 모노레포입니다. `apps/` 아래에 `admin`, `lms`, `platform` 3개의 Vite + TypeScript 애플리케이션이 들어 있습니다.

## 사전 준비

- Node.js 18+
- pnpm (현재 리포지토리는 `pnpm@9.12.3` 기준으로 잠겨 있습니다)

## 설치

```bash
pnpm install
```

## 공통 스크립트

루트에서 다음 스크립트들을 실행할 수 있습니다 (Turborepo가 각 워크스페이스의 동명의 스크립트를 실행합니다).

| Script            | 설명                                        |
| ----------------- | ------------------------------------------- |
| `pnpm dev`        | 필요한 모든 앱을 watch 모드로 기동          |
| `pnpm build`      | 모든 앱 빌드                                |
| `pnpm lint`       | ESLint 검사                                 |
| `pnpm lint:fix`   | ESLint 자동 수정                            |
| `pnpm typecheck`  | TypeScript 타입 검사 (`tsc --noEmit`)        |
| `pnpm format`     | Prettier 포맷팅 적용                        |
| `pnpm format:check` | Prettier 포맷팅 여부 검사                 |
| `pnpm test`       | 테스트 파이프라인 (추가 예정)               |
| `pnpm clean`      | Turborepo 캐시 정리                         |

## 워크스페이스별 dev 명령

필요한 앱/패키지만 개별로 기동하고 싶다면 아래 명령을 사용하세요.

| Workspace       | Dev command                     | 설명                               |
| --------------- | --------------------------------| ---------------------------------- |
| `admin`         | `pnpm --filter admin dev`       | 관리 콘솔 React 앱                 |
| `lms`           | `pnpm --filter lms dev`         | 학습 관리자(LMS) React 앱          |
| `platform`      | `pnpm --filter platform dev`    | 사용자용 플랫폼 React 앱           |
| `@jakorea/ui`   | `pnpm --filter @jakorea/ui dev` | UI 컴포넌트 패키지 TypeScript 감시 |
| `@jakorea/utils`| `pnpm --filter @jakorea/utils dev` | 공통 유틸 패키지 TypeScript 감시 |

앱 번들은 `apps/<name>/dist`에, 패키지 빌드 결과는 `packages/<name>/dist`에 생성됩니다.

## 구조

```
apps/
  admin/      # 관리 콘솔 애플리케이션
  lms/        # 학습 관리자(LMS) 애플리케이션
  platform/   # 사용자용 플랫폼 애플리케이션
packages/
  ui/         # React UI 컴포넌트 (예: Button)
  utils/      # 날짜/텍스트 등 공통 유틸
```

## 공통 패키지 워크플로우

- 각 패키지는 `pnpm --filter <패키지명> dev`로 감시 빌드를 돌릴 수 있습니다 (`pnpm dev` 실행 시 자동 포함됨).
- 라이브러리에는 `workspace:*` 버전을 이용해 앱에 의존성을 추가합니다.
- 새로운 패키지를 추가하고 싶다면 `packages/<name>`에 `package.json`, `tsconfig*.json`, `src/`를 만들고 `pnpm install` 후 `pnpm build`로 확인하세요.
- 예시로 `@jakorea/ui`는 `Button` 컴포넌트를, `@jakorea/utils`는 날짜 포맷터(`formatDate`, `timeSince`)를 내보내며, 세 애플리케이션 모두 동일한 코드를 사용합니다.

## ESLint & Prettier

- 루트 `eslint.config.js`는 모든 워크스페이스에서 공유됩니다. `pnpm lint` 혹은 개별 `pnpm --filter <workspace> lint` 실행 시 동일한 규칙이 적용됩니다.
- 포맷팅은 `prettier.config.js`에서 정의하며 `pnpm format` 또는 `pnpm format:check`로 실행합니다.

## Git Hooks

- `pnpm prepare`를 실행하면 Husky 훅이 설치되며, 이후 커밋 전에 `pnpm typecheck`와 `pnpm lint`가 자동으로 실행됩니다.
- 훅 설정은 `.husky/pre-commit`에서 수정할 수 있습니다.
