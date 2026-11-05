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
  targetScope?: string | null
  targetScopeId?: number | null
  targetScopeLabel?: string | null
  displayDeadlineAt?: string | null
  resultDownloadable?: boolean | null
  satisfactionRunMode?: 'PER_SCHEDULE' | 'ONCE_AT_END' | null
  satisfactionWindowDays?: number | null
  startAtLocked?: boolean | null
}

/** summary API `summaryJson.options[]` — 0건 옵션 포함 */
export type SurveyQuestionOptionCount = {
  value: string
  label: string
  displayOrder: number
  count: number
}

/** summary API 한 행 — 결과 화면을 version schema 없이 구성할 때 사용 */
export type SurveyResultQuestionSummary = {
  /** = 단락 id (응답 `answers` 키) */
  questionKey: string
  questionLabel: string
  /** 서버 문항 타입 (`SCALE_TYPE`, `SHORT_ESSAY`, `SURVEY_TITLE_WITH_PERIOD` …) */
  questionType: string
  /** 게시 version 단락 순서. null이면 현재 version에 없는 문항 */
  displayOrder: number | null
  required: boolean
  /** 공개 선택형(척도·복수선택·별점)만 존재 */
  options?: SurveyQuestionOptionCount[]
}

// Type이동 — 모델에서 re-export
export type { SurveyPollRawResponse } from '@/features/program/shared/model/survey-poll-response'

export type SurveyAudienceTab<TKey extends string> = {
  key: TKey
  label: string
}
