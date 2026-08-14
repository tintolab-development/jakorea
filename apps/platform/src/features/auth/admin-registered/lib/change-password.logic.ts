import { isValidPassword } from '@/features/auth/sign-up'

export type AdminRegisteredChangePasswordField = 'current' | 'new' | 'confirm'

export type AdminRegisteredChangePasswordValidation = {
  field: AdminRegisteredChangePasswordField | null
  message: string
} | null

export function validateAdminRegisteredChangePassword(input: {
  currentPassword: string
  newPassword: string
  confirmPassword: string
  initialPassword: string
  /** false면 현재 비밀번호를 이메일과 대조하지 않음 (원격 API가 검증) */
  matchCurrentToInitial?: boolean
}): AdminRegisteredChangePasswordValidation {
  const currentPassword = input.currentPassword.trim()
  const newPassword = input.newPassword.trim()
  const confirmPassword = input.confirmPassword.trim()
  const initialPassword = input.initialPassword.trim()
  const matchCurrentToInitial = input.matchCurrentToInitial ?? true

  if (!currentPassword) {
    return {
      field: 'current',
      message: '현재 비밀번호를 입력해 주세요.',
    }
  }

  if (matchCurrentToInitial && currentPassword.toLowerCase() !== initialPassword.toLowerCase()) {
    return {
      field: 'current',
      message: '현재 비밀번호가 맞지 않아요. 다시 확인해 주세요.',
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

  if (matchCurrentToInitial && newPassword.toLowerCase() === initialPassword.toLowerCase()) {
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
      message: '비밀번호를 한 번 더 입력해 주세요.',
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

export function canSubmitAdminRegisteredChangePassword(input: {
  currentPassword: string
  newPassword: string
  confirmPassword: string
  initialPassword: string
}) {
  return validateAdminRegisteredChangePassword(input) === null
}
