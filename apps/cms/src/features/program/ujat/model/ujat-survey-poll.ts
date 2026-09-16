/**
 * UJAT 설문 응답 — 타입·빈 stub
 * @see apps/cms/.cursor/rules/process/program-no-fe-mock.mdc
 */

export type UjatSurveyPollRawResponse = {
  respondentId: string
  respondentName: string
  addressRegion: string
  answers: Record<string, string>
}

export const UJAT_SURVEY_POLL_RESPONSES_MOCK: UjatSurveyPollRawResponse[] = []

export const UJAT_SURVEY_POLL_MOCK_RESPONSE_COUNT = 0
