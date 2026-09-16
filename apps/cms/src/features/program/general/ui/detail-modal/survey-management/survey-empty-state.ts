import type { Program } from '@/types/domain'
import type {
  RegisteredSurvey,
  SurveyPollRawResponse,
} from '@/features/program/shared/lib/survey-management/survey-management-types'
import type { GeneralSatisfactionAudienceKey } from '@/features/program/general/lib/survey-audience'

export type GeneralSurveyEmptyState = {
  registeredSurveys: RegisteredSurvey[]
  activeRegisteredSurveyId: string | null
  satisfactionSurveysByAudience: Partial<Record<GeneralSatisfactionAudienceKey, RegisteredSurvey>>
  lectureEvalSurvey: RegisteredSurvey | null
  responses: SurveyPollRawResponse[]
}

const EMPTY_SURVEY_STATE: GeneralSurveyEmptyState = {
  registeredSurveys: [],
  activeRegisteredSurveyId: null,
  satisfactionSurveysByAudience: {},
  lectureEvalSurvey: null,
  responses: [],
}

/** 설문 API 연동 전 — 빈 상태 (FE mock 시드 없음) */
export function buildGeneralSurveyEmptyState(_program: Program): GeneralSurveyEmptyState {
  return EMPTY_SURVEY_STATE
}
