import type {
  EducationDisplayStatus,
  EducationWithdrawalPhase,
} from '@/features/mypage/education/applications/model/types'

export type EducationSurveyMockAvailability = 'active' | 'empty'

type SurveyAvailabilityOptions = {
  displayStatus: EducationDisplayStatus
  withdrawalPhase?: EducationWithdrawalPhase
  /** 프로그램에 설문조사 미설정 시 false — 탭 비노출과 별도로 empty 처리 */
  surveyConfigured?: boolean
}

const ACTIVE_STATUSES = new Set<EducationDisplayStatus>(['in_progress', 'completed'])

export function getEducationSurveyMockAvailability(
  options: SurveyAvailabilityOptions,
): EducationSurveyMockAvailability {
  if (options.surveyConfigured === false) {
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
