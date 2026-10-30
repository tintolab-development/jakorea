import {
  clearAgeTransitionNiceSession,
  getAgeTransitionNiceSessionId,
  hasAgeTransitionNiceSession,
} from '@/features/auth/age-transition'

export function hasMemberConversionIdentity() {
  return hasAgeTransitionNiceSession()
}

export function clearMemberConversionIdentity() {
  clearAgeTransitionNiceSession()
}

export function readMemberConversionNiceSessionId() {
  return getAgeTransitionNiceSessionId()
}
