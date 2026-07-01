import type { EmailCheckStatus } from '../model/sign-up.types'
import { MOCK_DUPLICATE_EMAIL } from '../lib/sign-up.constants'
import { isValidEmail } from '../lib/sign-up.utils'

export function validateEmailDuplicateCheck(email: string): {
  status: EmailCheckStatus
  message: string
} {
  const normalizedEmail = email.trim()

  if (!isValidEmail(normalizedEmail)) {
    return {
      status: 'error',
      message: '이메일 형식으로 입력해주세요.',
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
