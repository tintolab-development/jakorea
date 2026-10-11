import type { Program } from '@/types/domain'
import type {
  RegisteredSurvey,
  SurveyPollRawResponse,
} from '@/features/program/shared/lib/survey-management/survey-management-types'
import type { GeneralSatisfactionAudienceKey } from '@/features/program/general/lib/survey-audience'
import type { LectureEvalTabKey } from '@/features/program/shared/lib/survey-management/lecture-eval-survey'

export type GeneralSurveyEmptyState = {
  registeredSurveys: RegisteredSurvey[]
  activeRegisteredSurveyId: string | null
  satisfactionSurveysByAudience: Partial<Record<GeneralSatisfactionAudienceKey, RegisteredSurvey>>
  lectureEvalSurvey: RegisteredSurvey | null
  lectureEvalSubmitted: boolean
  lectureEvalResponses: SurveyPollRawResponse[]
  initialLectureEvalTab: LectureEvalTabKey
  responses: SurveyPollRawResponse[]
}

const EMPTY_SURVEY_STATE: GeneralSurveyEmptyState = {
  registeredSurveys: [],
  activeRegisteredSurveyId: null,
  satisfactionSurveysByAudience: {},
  lectureEvalSurvey: null,
  lectureEvalSubmitted: false,
  lectureEvalResponses: [],
  initialLectureEvalTab: 'eval',
  responses: [],
}

/** 설문 API 연동 전 — 빈 상태 */
export function buildGeneralSurveyEmptyState(_program: Program): GeneralSurveyEmptyState {
  return EMPTY_SURVEY_STATE
}
