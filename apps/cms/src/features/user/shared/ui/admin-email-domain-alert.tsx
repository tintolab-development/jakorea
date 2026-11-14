import { JAKOREA_EMAIL_DOMAIN } from '@/features/auth/lib/jakorea-email'

/** 관리자 계정은 JA Korea 이메일(@jakorea.org)만 등록 가능 — 관리자 서비스 이용약관 제4조 (신규 등록·상세 수정 공통) */
export const ADMIN_EMAIL_DOMAIN_ALERT_TITLE = '이메일 재확인 안내'
export const ADMIN_EMAIL_DOMAIN_ALERT_CONTENT = (
  <>
    관리자 계정은 <strong>{JAKOREA_EMAIL_DOMAIN}</strong> 형식의 이메일만 등록 가능합니다.
    <br />
    이메일 형식을 다시 확인해 주세요.
  </>
)
