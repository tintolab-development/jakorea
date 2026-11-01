/**
 * UJAT 설문 응답 raw 타입
 * @see apps/cms/.cursor/rules/process/program-no-fe-mock.mdc
 */

export type UjatSurveyPollRawResponse = {
  respondentId: string
  respondentName: string
  addressRegion: string
  answers: Record<string, string>
}
