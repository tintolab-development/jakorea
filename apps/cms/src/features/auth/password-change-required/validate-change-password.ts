import {
  isValidRegisterPassword,
  REGISTER_PASSWORD_CONDITION_MESSAGE,
  REGISTER_PASSWORD_MISMATCH_MESSAGE,
} from '@/features/auth/lib/validate-register-password'

export type PasswordChangeRequiredField = 'current' | 'new' | 'confirm'

export type PasswordChangeRequiredValidation = {
  field: PasswordChangeRequiredField
  message: string
} | null

export function validatePasswordChangeRequiredForm(input: {
  currentPassword: string
  newPassword: string
  confirmPassword: string
  /** 임시 비밀번호(가입 이메일) — 클라이언트 선검증용 */
  initialPassword: string
}): PasswordChangeRequiredValidation {
  const currentPassword = input.currentPassword.trim()
  const newPassword = input.newPassword.trim()
  const confirmPassword = input.confirmPassword.trim()
  const initialPassword = input.initialPassword.trim()

  if (!currentPassword) {
    return { field: 'current', message: '현재 비밀번호를 입력해 주세요.' }
  }

  if (currentPassword.toLowerCase() !== initialPassword.toLowerCase()) {
    return {
      field: 'current',
      message: '현재 비밀번호가 맞지 않아요. 다시 확인해 주세요.',
    }
  }

  if (!newPassword) {
    return { field: 'new', message: '새 비밀번호를 입력해 주세요.' }
  }

  if (newPassword.toLowerCase() === currentPassword.toLowerCase()) {
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
