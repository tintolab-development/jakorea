# @jakorea/form-template-runtime

CMS·홈페이지 어드민·사용자 플랫폼이 같은 공개 계약으로 소비한다.

## 공개 import

- `@jakorea/form-template-runtime`
- `@jakorea/form-template-runtime/detail-info-form.css`
- `@jakorea/form-template-runtime/styles`

앱 코드는 `packages/form-template-runtime/src` 또는 `dist`를 직접 import하지 않는다.
개발·배포 모두 package exports의 dist 산출물을 사용한다.

## 개발 실행

앱 `dev`(`pnpm cms`, `pnpm admin`, `pnpm --filter cms dev` 등)는 Vite와 함께
이 패키지의 TS watch + CSS 복사를 시작한다.

- 최초 실행 시 CSS를 dist로 복사한다.
- src CSS 추가·수정·삭제가 dist에 반영된다.
- CMS와 Admin을 동시에 띄워도 watcher는 lock으로 하나다.
- 개발을 종료하면 그 세션이 시작한 watcher만 종료된다.

별도 환경 변수나 수동 `pnpm --filter @jakorea/form-template-runtime build`는 필요하지 않다.
배포 빌드는 기존처럼 앱 `prebuild` → workspace package `build`를 사용한다.
