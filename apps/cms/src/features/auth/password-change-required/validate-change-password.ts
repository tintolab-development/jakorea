import {
  isValidRegisterPassword,
  REGISTER_PASSWORD_CONDITION_MESSAGE,
  REGISTER_PASSWORD_MISMATCH_MESSAGE,
} from '@/features/auth/lib/validate-register-password'

export type PasswordChangeRequiredField = 'new' | 'confirm'

export type PasswordChangeRequiredValidation = {
  field: PasswordChangeRequiredField
  message: string
} | null

/**
 * 최초 로그인 비밀번호 변경 — 현재 비밀번호는 가입 이메일(임시비번)로 고정.
 * UI에는 이메일(읽기전용) + 새 비밀번호 + 확인만 노출.
 */
export function validatePasswordChangeRequiredForm(input: {
  newPassword: string
  confirmPassword: string
  /** 임시 비밀번호(가입 이메일) */
  initialPassword: string
}): PasswordChangeRequiredValidation {
  const newPassword = input.newPassword.trim()
  const confirmPassword = input.confirmPassword.trim()
  const initialPassword = input.initialPassword.trim()

  if (!newPassword) {
    return { field: 'new', message: '새 비밀번호를 입력해 주세요.' }
  }

  if (newPassword.toLowerCase() === initialPassword.toLowerCase()) {
    return {
      field: 'new',
      message: '새 비밀번호가 기존 비밀번호와 같아요. 다른 비밀번호를 입력해 주세요.',
    }
  }

  if (!isValidRegisterPassword(newPassword)) {
    return { field: 'new', message: REGISTER_PASSWORD_CONDITION_MESSAGE }
  }

  if (!confirmPassword) {
    return { field: 'confirm', message: '새 비밀번호를 한 번 더 입력해 주세요.' }
  }

  if (newPassword !== confirmPassword) {
    return { field: 'confirm', message: REGISTER_PASSWORD_MISMATCH_MESSAGE }
  }

  return null
}
