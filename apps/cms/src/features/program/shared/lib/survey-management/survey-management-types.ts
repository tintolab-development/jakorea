export type SurveyProgressStatus = 'before_start' | 'in_progress' | 'finished'

export type RegisteredSurvey = {
  id: string
  title: string
  templateId: string
  status: SurveyProgressStatus
  responseCount: number
  participantTotal: number
  /**
   * surveys / form-bindings GET `expectedRespondentCount`.
   * `null`이면 서버가 대상 분모를 안 준 것. `0`은 실제 0명.
   */
  expectedRespondentCount?: number | null
  /** remote form-binding id — 삭제 시 사용 */
  bindingId?: string
}

// Type이동 — 모델에서 re-export
export type { SurveyPollRawResponse } from '@/features/program/shared/model/survey-poll-response'

export type SurveyAudienceTab<TKey extends string> = {
  key: TKey
  label: string
}
