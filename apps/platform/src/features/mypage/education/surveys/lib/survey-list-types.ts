export type EducationSurveyListStatus = 'in_progress' | 'submitted'

export type EducationSurveyListEntry = {
  id: string
  title: string
  status: EducationSurveyListStatus
  description?: string
  startAt?: string
  endAt?: string
  /** BE `submissionStartAt` 원문(시각 포함 시 기간 판정 SSOT) */
  submissionStartAt?: string | null
  /** BE `submissionEndAt` 원문(시각 포함 시 기간 판정 SSOT) */
  submissionEndAt?: string | null
  createdAt?: string
  templateVersionId?: number
  formType?: string
  targetScope?: string
  targetScopeId?: number
  scheduleId?: number
  required?: boolean
  form?: Record<string, unknown> | null
  formResponseId?: number
  answers?: Record<string, unknown> | null
  draftAnswers?: Record<string, unknown> | null
  /** Canonical `/forms` bindingId. Assignment submit uses this only. */
  bindingId?: number
  canSubmit?: boolean
  canResubmit?: boolean
  responseStatus?: string
  revisionNo?: number
  retentionExpiresAt?: string | null
}

export function educationSurveyListStatusLabel(status: EducationSurveyListStatus): string {
  return status === 'in_progress' ? '진행중' : '제출 완료'
}
