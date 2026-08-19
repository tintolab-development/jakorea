/** 마이페이지 연락처 재인증 — NICE 콜백이 profileToken을 confirm에 남기도록 */
const MYPAGE_PHONE_IDENTITY_CONFIRM_FLAG = 'platform:mypage-phone-identity-confirm-pending'

export function markMypagePhoneIdentityConfirmPending() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(MYPAGE_PHONE_IDENTITY_CONFIRM_FLAG, '1')
}

export function isMypagePhoneIdentityConfirmPending() {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(MYPAGE_PHONE_IDENTITY_CONFIRM_FLAG) === '1'
}

export function clearMypagePhoneIdentityConfirmPending() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(MYPAGE_PHONE_IDENTITY_CONFIRM_FLAG)
}
