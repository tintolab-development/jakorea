/**
 * 소셜 연동 consent 등 — 셀프가입 `termsVersion`은
 * `resolveAdminSelfSignupTermsVersion`으로 현재 게시 문서를 조회한다.
 * 소셜 API가 동일 원장을 쓰면 하드코딩 대신 조회값을 쓰도록 이관할 것.
 */
export const ADMIN_REGISTER_TERMS_VERSION = '2026-01'
