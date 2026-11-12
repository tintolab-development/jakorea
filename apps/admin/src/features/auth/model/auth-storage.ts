/**
 * Homepage Admin 전용 localStorage 키
 * CMS(`auth_*`)와 동일 오리진에서도 세션이 섞이지 않도록 prefix 분리
 */

export const AUTH_TOKEN_KEY = 'hp_admin_auth_token'
export const AUTH_EXPIRY_KEY = 'hp_admin_auth_expires_at'
export const AUTH_USER_KEY = 'hp_admin_auth_user'
export const AUTH_REFRESH_TOKEN_KEY = 'hp_admin_auth_refresh_token'
/**
 * QA-0137: 본문 없이 HttpOnly 쿠키(`JA_ADMIN_RT`)로 refresh하는 세션 표시. 토큰 값은 저장하지 않는다.
 * 응답 본문에 refreshToken이 없을 때(운영 `JA_REFRESH_COOKIE_BODY_TOKEN_ENABLED=false`)만 켜진다.
 */
export const AUTH_REFRESH_COOKIE_SESSION_KEY = 'hp_admin_auth_refresh_cookie_session'
/** 마지막 access/refresh 발급 시각 — CMS `auth_issued_at`과 동일 역할, 오리진 분리 */
export const AUTH_ISSUED_AT_KEY = 'hp_admin_auth_issued_at'
export const LOGIN_FAILED_ATTEMPTS_KEY = 'hp_admin_login_failed_attempts'
export const LOGIN_LOCK_UNTIL_KEY = 'hp_admin_login_lock_until'
