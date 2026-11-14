/**
 * 관리자 등록 계정 첫 로그인 본인인증 확정 — 409 ADMIN_IDENTITY_ALREADY_VERIFIED_BY_OTHER
 * (같은 사람으로 이미 본인인증된 다른 관리자 계정이 있음) 「중복 가입 안내」 팝업 문구. 시안 2026-11-14.
 */
export const ADMIN_IDENTITY_DUPLICATE_NOTICE_TITLE = '중복 가입 안내'

export const ADMIN_IDENTITY_DUPLICATE_NOTICE_CONTENT =
  '본인인증한 정보로 가입된 계정이 있습니다.\n가입한 이메일로 로그인하거나, 이메일 찾기를 이용해 주세요.'

/** 보조(outline) 버튼 — 팝업만 닫는다 */
export const ADMIN_IDENTITY_DUPLICATE_NOTICE_CLOSE_LABEL = '확인'

/** 주(primary) 버튼 — 임시 비밀번호 세션을 정리하고 로그인 화면으로 */
export const ADMIN_IDENTITY_DUPLICATE_NOTICE_LOGIN_LABEL = '로그인 하기'
