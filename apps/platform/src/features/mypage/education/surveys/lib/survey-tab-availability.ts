import type {
  EducationDisplayStatus,
  EducationWithdrawalPhase,
} from '@/features/mypage/education/applications/model/types'

export type EducationSurveyTabAvailability = 'active' | 'empty'

type SurveyAvailabilityOptions = {
  displayStatus: EducationDisplayStatus
  withdrawalPhase?: EducationWithdrawalPhase
  configured?: boolean
  /** @deprecated `configured` 사용 — survey 탭 호환 */
  surveyConfigured?: boolean
}

const ACTIVE_STATUSES = new Set<EducationDisplayStatus>(['in_progress', 'completed'])

export function getEducationSurveyTabAvailability(
  options: SurveyAvailabilityOptions
): EducationSurveyTabAvailability {
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

/** @deprecated `getEducationSurveyTabAvailability` */
export const getEducationSurveyMockAvailability = getEducationSurveyTabAvailability
export type EducationSurveyMockAvailability = EducationSurveyTabAvailability
