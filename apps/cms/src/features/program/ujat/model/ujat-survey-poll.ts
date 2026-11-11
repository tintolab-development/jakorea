/**
 * UJAT 설문 응답 raw 타입
 * @see apps/cms/.cursor/rules/process/program-no-fe-mock.mdc
 */

export type UjatSurveyPollRawResponse = {
  respondentId: string
  respondentName: string
  addressRegion: string
  answers: Record<string, string>
  /** 관리자 제출 응답의 제출자(admin account id). 강의평가 「내 응답」 판정에 쓴다. */
  submittedByAdminId?: number | null
}
