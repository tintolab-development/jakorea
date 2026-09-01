/**
 * Homepage Admin 전용 localStorage 키
 * CMS(`auth_*`)와 동일 오리진에서도 세션이 섞이지 않도록 prefix 분리
 */

export const AUTH_TOKEN_KEY = 'hp_admin_auth_token'
export const AUTH_EXPIRY_KEY = 'hp_admin_auth_expires_at'
export const AUTH_USER_KEY = 'hp_admin_auth_user'
export const AUTH_REFRESH_TOKEN_KEY = 'hp_admin_auth_refresh_token'
export const LOGIN_FAILED_ATTEMPTS_KEY = 'hp_admin_login_failed_attempts'
export const LOGIN_LOCK_UNTIL_KEY = 'hp_admin_login_lock_until'
