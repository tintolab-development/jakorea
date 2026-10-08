import { getApiErrorCode } from '@/shared/lib/extract-api-error-message'

export const TEAM_FEATURE_NOT_APPLICABLE_CODE = 'TEAM_FEATURE_NOT_APPLICABLE'

/** 팀 제출(submission-team) 기능은 사업분야가 기업가정신인 프로그램 전용 — BE `requireEntrepreneurship`과 동일 판정 */
export function isSubmissionTeamApplicable(businessArea: string | null | undefined): boolean {
  if (!businessArea) return false
  return businessArea.includes('기업가') || businessArea.toLowerCase().includes('entrepreneur')
}

export function isSubmissionTeamNotApplicableError(error: unknown): boolean {
  return getApiErrorCode(error) === TEAM_FEATURE_NOT_APPLICABLE_CODE
}
