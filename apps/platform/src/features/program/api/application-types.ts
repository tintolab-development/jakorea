/**
 * Portal 프로그램 신청 계약
 * GET /api/portal/programs/{programId}/application-options
 * GET /api/portal/programs/{programId}/form-bindings/{bindingId}
 * PUT/POST applications
 */

export type PortalApplicationOption = {
  recruitmentId?: number
  recruitmentType?: string
  targetType?: string
  applicationType?: string
  formBindingId?: number | null
  formTemplateVersionId?: number | null
  startAt?: string | null
  endAt?: string | null
  minCount?: number | null
  maxCount?: number | null
  currentApplicationCount?: number
  canApply?: boolean
  blockedReason?: string | null
}

export type PortalApplicationFormResponse = {
  programId?: number
  recruitmentId?: number
  applicationType?: string
  formBindingId?: number
  templateVersionId?: number
  form?: Record<string, unknown> | null
  draftApplicationId?: number | null
  draftFormResponseId?: number | null
  draftAnswers?: Record<string, unknown> | null
}

export type PortalPreferredScheduleSessionTime = {
  sessionIndex?: number
  classPeriod?: string
  startTime?: string
  endTime?: string
  timeRange?: string
  start?: string
  end?: string
}

export type PortalPreferredScheduleBlock = {
  preferenceRank?: number
  date?: string
  dateText?: string
  sessionCount?: number
  session?: string
  sessionTimes?: PortalPreferredScheduleSessionTime[]
  times?: PortalPreferredScheduleSessionTime[]
}

export type PortalSaveApplicationRequest = {
  recruitmentId: number
  applicationType: string
  formBindingId: number
  answers?: Record<string, unknown>
  requestedSchedules?: unknown[]
  requestedClassCount?: number
  requestedStudentCount?: number
  requestedMaleCount?: number
  requestedFemaleCount?: number
  preferredScheduleBlocks?: PortalPreferredScheduleBlock[]
}

export type PortalApplicationSaveResponse = {
  applicationId?: number
  applicationType?: string
  applicationStatus?: string
  formResponseId?: number
  formResponseStatus?: string
  submittedAt?: string | null
  reusedExisting?: boolean
}

/** 신청 화면이 쓰는 옵션 + 폼 묶음 */
export type PortalApplicationFormBundle = {
  option: PortalApplicationOption
  form: PortalApplicationFormResponse
}
