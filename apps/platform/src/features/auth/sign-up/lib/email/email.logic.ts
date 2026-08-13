import type { EmailCheckStatus } from '../../model/sign-up.types'
import { isMockAdminRegisteredEmail } from '@/features/auth/admin-registered'
import { EMAIL_ID_MESSAGES, normalizeEmailId, validateEmailId } from '@/shared/lib/email-id'
import { MOCK_DUPLICATE_EMAIL } from '../constants'

export function validateEmailDuplicateCheck(email: string): {
  status: EmailCheckStatus
  message: string
  shouldRedirectToAdminRegisteredNotice?: boolean
} {
  const validation = validateEmailId(email)

  if (!validation.ok) {
    return {
      status: 'error',
      message: validation.message,
    }
  }

  const normalizedEmail = validation.normalized

  if (isMockAdminRegisteredEmail(normalizedEmail)) {
    return {
      status: 'error',
      message: '관리자가 등록한 계정이에요. 본인인증 후 비밀번호를 변경해 주세요.',
      shouldRedirectToAdminRegisteredNotice: true,
    }
  }

  if (normalizedEmail === normalizeEmailId(MOCK_DUPLICATE_EMAIL)) {
    return {
      status: 'error',
      message: EMAIL_ID_MESSAGES.duplicate,
    }
  }

  return {
    status: 'success',
    message: '사용할 수 있는 이메일이에요.',
  }
}
