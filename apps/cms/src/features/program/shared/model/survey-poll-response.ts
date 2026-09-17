/**
 * 설문 응답 — 공유 타입·일반 프로그램 빈 stub
 * @see apps/cms/.cursor/rules/process/program-no-fe-mock.mdc
 */

export type SurveyPollRawResponse = {
  respondentId: string
  respondentName: string
  addressRegion: string
  answers: Record<string, string>
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
