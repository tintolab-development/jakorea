import type { AccountEmailCheckResponse } from '../api/types'

export function isEmailRegisteredForPasswordReset(result: AccountEmailCheckResponse): boolean {
  if (typeof result.exists === 'boolean') {
    return result.exists
  }
  if (result.nextAction === 'START_IDENTITY_VERIFICATION') {
    return true
  }
  if (result.nextAction === 'SHOW_EMAIL_NOT_FOUND') {
    return false
  }
  if (typeof result.available === 'boolean') {
    return !result.available
  }
  return false
}
