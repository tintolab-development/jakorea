import { isValidMemberPassword } from '../password-policy'

export function getPasswordDerived(password: string, passwordConfirm: string) {
  const isMismatch = passwordConfirm.length > 0 && password !== passwordConfirm
  const isValid = isValidMemberPassword(password) && password === passwordConfirm

  return { isMismatch, isValid }
}
