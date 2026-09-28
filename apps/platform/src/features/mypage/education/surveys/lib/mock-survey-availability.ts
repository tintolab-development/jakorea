import type {
  EducationDisplayStatus,
  EducationWithdrawalPhase,
} from '@/features/mypage/education/applications/model/types'

export type EducationSurveyMockAvailability = 'active' | 'empty'

type SurveyAvailabilityOptions = {
  displayStatus: EducationDisplayStatus
  withdrawalPhase?: EducationWithdrawalPhase
  /**
   * 프로그램에 설문/만족도 미설정 시 false.
   * `surveyConfigured` / `satisfactionConfigured` 어느 쪽이든 이 키로 전달.
   */
  configured?: boolean
  /** @deprecated `configured` 사용 — survey 탭 호환 */
  surveyConfigured?: boolean
}

const ACTIVE_STATUSES = new Set<EducationDisplayStatus>(['in_progress', 'completed'])

export function getEducationSurveyMockAvailability(
  options: SurveyAvailabilityOptions,
): EducationSurveyMockAvailability {
  const configured = options.configured ?? options.surveyConfigured
  if (configured === false) {
    return 'empty'
  }

  if (ACTIVE_STATUSES.has(options.displayStatus)) {
    return 'active'
  }

  if (
    options.displayStatus === 'withdrawn' &&
    options.withdrawalPhase === 'during_education'
  ) {
    return 'active'
  }

  return 'empty'
}
