import { isValidPassword } from '../lib/sign-up.utils'

export function getPasswordDerived(password: string, passwordConfirm: string) {
  const isMismatch = passwordConfirm.length > 0 && password !== passwordConfirm
  const isValid = isValidPassword(password) && password === passwordConfirm

  return { isMismatch, isValid }
}
