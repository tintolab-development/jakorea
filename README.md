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

| Script       | 설명                               |
| ------------ | ---------------------------------- |
| `pnpm dev`   | 필요한 모든 앱을 watch 모드로 기동 |
| `pnpm build` | 모든 앱 빌드                       |
| `pnpm lint`  | ESlint 검사                        |
| `pnpm test`  | 테스트 파이프라인 (추가 예정)      |
| `pnpm clean` | Turborepo 캐시 정리                |

## 개별 앱 실행

각 앱은 pnpm filter를 통해 독립적으로 실행할 수 있습니다.

```bash
pnpm --filter admin dev
pnpm --filter lms dev
pnpm --filter platform dev
```

생성된 번들은 `apps/<name>/dist`에 출력됩니다.

## 구조

```
apps/
  admin/      # 관리 콘솔 애플리케이션
  lms/        # 학습 관리자(LMS) 애플리케이션
  platform/   # 사용자용 플랫폼 애플리케이션
```

필요 시 `packages/` 디렉토리에 공유 UI나 유틸리티 패키지를 추가해 사용할 수 있습니다.
