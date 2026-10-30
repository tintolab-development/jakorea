# @jakorea/admin-ui

CMS 어드민과 홈페이지 어드민이 공유하는 **어드민 시각 시스템** 패키지다.

- 공통 Ant Design theme
- 공통 CSS variables (`:root`)
- STEP 3 이후 Button/Input/Select 등

권한·세션·API·도메인 로직은 포함하지 않는다.
기존 `@jakorea/ui`(reaction emoji 등)와 별도 namespace다.

## 공개 import

- `@jakorea/admin-ui` — theme helpers
- `@jakorea/admin-ui/theme` — theme subpath
- `@jakorea/admin-ui/styles` — `:root` tokens CSS

앱 코드는 `packages/admin-ui/src`를 직접 import하지 않는다.

## 앱 연결

각 앱 ThemeProvider가 `mergeAdminTheme`로 공통 theme을 쓰고,
앱별 `colorSuccess` 등 domain overlay를 얹는다.
폰트 `@font-face`와 프로그램/학교/강사 등 도메인 색은 앱 CSS에 남긴다.
