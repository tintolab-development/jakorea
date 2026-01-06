# 패키지 관리

## pnpm Workspace

루트에 `pnpm-workspace.yaml`을 두고 `apps/*`와 `packages/*`를 포함합니다.
각 앱은 별도의 `package.json`을 가지고 있습니다.
`pnpm install`은 루트에서 한 번 실행하면 모든 워크스페이스에 적용됩니다.

## 공유 패키지

- `@jakorea/ui`: 공유 UI 컴포넌트
- `@jakorea/utils`: 공유 유틸리티 함수

## 의존성 설치

```bash
# 루트에서 전체 설치
pnpm install

# 특정 앱에만 의존성 추가
pnpm --filter cms add <package-name>
```

## 관련 규칙

- [공유 패키지 사용](../libraries/shared-packages.md)
- [필수 라이브러리](../libraries/required-libraries.md)
- [모노레포 구조](../../../.cursor/rules/monorepo-structure.md)






