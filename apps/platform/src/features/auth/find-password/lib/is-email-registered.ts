import type { AccountEmailCheckResponse } from '../api/types'

export function isEmailRegisteredForPasswordReset(result: AccountEmailCheckResponse): boolean {
  // PASSWORD_RESET는 계정 enumeration 방지로 exists:false를 내려도
  // nextAction=START_IDENTITY_VERIFICATION이면 본인인증으로 진행한다.
  if (result.nextAction === 'START_IDENTITY_VERIFICATION') {
    return true
  }
  if (result.nextAction === 'SHOW_EMAIL_NOT_FOUND') {
    return false
  }
  if (typeof result.exists === 'boolean') {
    return result.exists
  }
  if (typeof result.available === 'boolean') {
    return !result.available
  }
  return false
}
