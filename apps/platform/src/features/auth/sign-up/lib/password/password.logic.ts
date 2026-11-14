import { isValidMemberPassword } from '../password-policy'

export function getPasswordDerived(password: string, passwordConfirm: string) {
  const isMismatch = passwordConfirm.length > 0 && password !== passwordConfirm
  // 재입력 불일치와 같은 시점 — 값이 있으면 입력하는 즉시 판정한다
  const isPolicyUnmet = password.length > 0 && !isValidMemberPassword(password)
  const isValid = isValidMemberPassword(password) && password === passwordConfirm

  return { isMismatch, isPolicyUnmet, isValid }
}
