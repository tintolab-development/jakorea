import type { EmailCheckStatus } from '../model/sign-up.types'
import { isMockAdminRegisteredEmail } from '@/features/auth/admin-registered'
import { MOCK_DUPLICATE_EMAIL } from '../lib/constants'
import { isValidEmail } from '../lib/utils'

export function validateEmailDuplicateCheck(email: string): {
  status: EmailCheckStatus
  message: string
  shouldRedirectToAdminRegisteredNotice?: boolean
} {
  const normalizedEmail = email.trim()

  if (!isValidEmail(normalizedEmail)) {
    return {
      status: 'error',
      message: '이메일 형식으로 입력해주세요.',
    }
  }

  if (isMockAdminRegisteredEmail(normalizedEmail)) {
    return {
      status: 'error',
      message: '관리자가 등록한 계정이에요. 본인인증 후 비밀번호를 변경해 주세요.',
      shouldRedirectToAdminRegisteredNotice: true,
    }
  }

  if (normalizedEmail.toLowerCase() === MOCK_DUPLICATE_EMAIL) {
    return {
      status: 'error',
      message: '이미 가입 된 이메일이에요.',
    }
  }

  return {
    status: 'success',
    message: '사용할 수 있는 이메일이에요.',
  }
}
