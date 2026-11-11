/**
 * 설문 응답 — 공유 타입·일반 프로그램 빈 stub
 * @see apps/cms/.cursor/rules/process/program-no-fe-mock.mdc
 */

export type SurveyPollRawResponse = {
  respondentId: string
  respondentName: string
  addressRegion: string
  answers: Record<string, string>
  /** 관리자 제출 응답의 제출자(admin account id). 강의평가 「내 응답」 판정에 쓴다. */
  submittedByAdminId?: number | null
}

export const GENERAL_ORGANIZATION_SURVEY_RESPONSES_MOCK: SurveyPollRawResponse[] = []
export const GENERAL_INDIVIDUAL_SURVEY_RESPONSES_MOCK: SurveyPollRawResponse[] = []
export const GENERAL_ORGANIZATION_SURVEY_RESPONSE_COUNT = 0
export const GENERAL_INDIVIDUAL_SURVEY_RESPONSE_COUNT = 0

export function getGeneralOrganizationSurveyResponsesForProgram(
  _programId: string
): SurveyPollRawResponse[] {
  return []
}
