export type EducationSurveyListStatus = 'in_progress' | 'submitted'

export type EducationSurveyListEntry = {
  id: string
  title: string
  status: EducationSurveyListStatus
  description?: string
  startAt?: string
  endAt?: string
  createdAt?: string
  templateVersionId?: number
  targetScope?: string
  targetScopeId?: number
  required?: boolean
  form?: Record<string, unknown> | null
  formResponseId?: number
  answers?: Record<string, unknown> | null
  draftAnswers?: Record<string, unknown> | null
}

export function educationSurveyListStatusLabel(status: EducationSurveyListStatus): string {
  return status === 'in_progress' ? '진행중' : '제출완료'
}
