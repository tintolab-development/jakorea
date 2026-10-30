import type { AgeTransitionCompletionResult, AgeTransitionPortalStatus } from '../api/types'

type AgeTransitionCompletionLike = Pick<AgeTransitionPortalStatus, 'status' | 'completed'> &
  Pick<AgeTransitionCompletionResult, 'evidencePending'>

export function isAgeTransitionCompleted(status: AgeTransitionCompletionLike | null | undefined) {
  if (!status) return false
  return status.status === 'COMPLETED' && status.completed === true
}

export function isAgeTransitionEvidencePending(status: AgeTransitionCompletionLike | null | undefined) {
  if (!status) return false
  return status.status === 'EVIDENCE_PENDING' || status.evidencePending === true
}

/**
 * 로그인 후 전환 안내 대상.
 * POLICY_HOLD / VERIFICATION_REQUIRED / ageGroup만으로 판정하지 않는다.
 */
export function shouldPromptAge14Transition(status: AgeTransitionPortalStatus | null | undefined) {
  if (!status) return false
  if (isAgeTransitionCompleted(status)) return false
  if (isAgeTransitionEvidencePending(status)) return false
  if (status.signupUnder14 !== true) return false
  if (status.eligible !== true) return false
  return true
}
