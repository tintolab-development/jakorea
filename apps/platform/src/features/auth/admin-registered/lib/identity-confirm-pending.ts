/** 관리자 등록 온보딩 — NICE 콜백(팝업)과 부모 창이 공유해야 하므로 localStorage 사용 */
const ADMIN_PROVISIONED_IDENTITY_CONFIRM_FLAG =
  'platform:admin-provisioned-identity-confirm-pending'

export function markAdminProvisionedIdentityConfirmPending() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ADMIN_PROVISIONED_IDENTITY_CONFIRM_FLAG, '1')
}

export function consumeAdminProvisionedIdentityConfirmPending() {
  if (typeof window === 'undefined') return false
  const pending =
    window.localStorage.getItem(ADMIN_PROVISIONED_IDENTITY_CONFIRM_FLAG) === '1'
  window.localStorage.removeItem(ADMIN_PROVISIONED_IDENTITY_CONFIRM_FLAG)
  return pending
}

export function isAdminProvisionedIdentityConfirmPending() {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(ADMIN_PROVISIONED_IDENTITY_CONFIRM_FLAG) === '1'
}

export function clearAdminProvisionedIdentityConfirmPending() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(ADMIN_PROVISIONED_IDENTITY_CONFIRM_FLAG)
}
