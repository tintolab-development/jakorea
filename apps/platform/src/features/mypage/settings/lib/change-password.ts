import { isValidPassword } from '@/features/auth/sign-up'

export type SettingsChangePasswordField = 'current' | 'new' | 'confirm'

export type SettingsChangePasswordValidation = {
  field: SettingsChangePasswordField
  message: string
} | null

export function validateSettingsChangePassword(input: {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}): SettingsChangePasswordValidation {
  const currentPassword = input.currentPassword.trim()
  const newPassword = input.newPassword.trim()
  const confirmPassword = input.confirmPassword.trim()

  if (!currentPassword) {
    return {
      field: 'current',
      message: '현재 비밀번호를 입력해 주세요.',
    }
  }

  if (!newPassword) {
    return {
      field: 'new',
      message: '새 비밀번호를 입력해 주세요.',
    }
  }

  if (newPassword === currentPassword) {
    return {
      field: 'new',
      message: '새 비밀번호가 기존 비밀번호와 같아요. 다른 비밀번호를 입력해 주세요.',
    }
  }

  if (!isValidPassword(newPassword)) {
    return {
      field: 'new',
      message: '영문, 숫자, 특수문자를 조합해 8자 이상 입력해 주세요.',
    }
  }

  if (!confirmPassword) {
    return {
      field: 'confirm',
      message: '변경할 비밀번호를 확인해 주세요.',
    }
  }

  if (newPassword !== confirmPassword) {
    return {
      field: 'confirm',
      message: '비밀번호가 서로 달라요. 다시 한 번 확인해 주세요.',
    }
  }

  return null
}
