export type SurveyProgressStatus = 'before_start' | 'in_progress' | 'finished'

export type RegisteredSurvey = {
  id: string
  title: string
  templateId: string
  status: SurveyProgressStatus
  responseCount: number
  participantTotal: number
  /** remote form-binding id — 삭제 시 사용 */
  bindingId?: string
}

export type SurveyPollRawResponse = {
  respondentId: string
  respondentName: string
  addressRegion: string
  answers: Record<string, string>
}

export type SurveyAudienceTab<TKey extends string> = {
  key: TKey
  label: string
}
