// 관리자 등록 회원도 Platform 회원 — 회원 비밀번호 기준(8자)을 쓴다. 12자는 CMS 관리자 계정만이다.
import { isValidMemberPassword, MEMBER_PASSWORD_HELP_TEXT } from '../../sign-up/lib/password-policy.ts'

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

  if (!isValidMemberPassword(newPassword)) {
    return {
      field: 'new',
      message: MEMBER_PASSWORD_HELP_TEXT,
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
