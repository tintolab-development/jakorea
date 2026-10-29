/**
 * Portal 프로그램 신청 계약
 * GET /api/portal/programs/{programId}/application-options
 * GET /api/portal/programs/{programId}/form-bindings/{bindingId}
 * PUT/POST applications
 */

/** HomepageProgramQueryService#blockedReason — canApply=false 일 때만 (canApply=true 이면 omit) */
export type PortalApplicationBlockedReason =
  | 'PROGRAM_NOT_APPLICABLE'
  | 'RECRUITMENT_NOT_STARTED'
  | 'RECRUITMENT_CLOSED'
  | 'APPLICATION_FORM_NOT_CONFIGURED'
  | 'APPLICATION_TYPE_NOT_ALLOWED'
  | 'MEMBER_NOT_ACTIVE'
  | 'ORGANIZATION_MEMBERSHIP_REQUIRED'
  | 'ACTIVE_ORGANIZATION_AFFILIATION_REQUIRED'
  | 'APPROVED_INSTRUCTOR_REQUIRED'
  | 'TRAINED_TEACHER_APPLICATION_TARGET_REQUIRED'
  | 'VOLUNTEER_RECRUITMENT_TARGET_MISMATCH'
  | 'COLLEGE_STUDENT_REQUIRED'
  | 'ALREADY_APPLIED'
  | 'CAPACITY_FULL'

export type PortalApplicationType = 'INDIVIDUAL' | 'ORGANIZATION' | 'INSTRUCTOR' | 'VOLUNTEER'

export type PortalExistingApplication = {
  applicationId?: number
  applicationType?: string
  status?: string
  submittedAt?: string | null
}

export type PortalApplicationOption = {
  recruitmentId?: number
  recruitmentType?: string
  targetType?: string | null
  applicationType?: PortalApplicationType | string
  formBindingId?: number | null
  formTemplateVersionId?: number | null
  startAt?: string | null
  endAt?: string | null
  minCount?: number | null
  maxCount?: number | null
  currentApplicationCount?: number
  canApply?: boolean
  /** canApply=true 이면 필드 자체를 omit (null 아님) */
  blockedReason?: PortalApplicationBlockedReason
  existingApplication?: PortalExistingApplication | null
}

export type UjatPreferredEducationDateOption = {
  id: string
  date: string
  label: string
}

export type PortalFormRuntimeContext = {
  interviewEnabled?: boolean
  ujatPreferredEducationDateOptions?: UjatPreferredEducationDateOption[]
  activityTerm?: string | null
  ujatActivityTerm?: string | null
  [key: string]: unknown
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
  /** 임시저장에 연결된 증빙. 없으면 [] */
  draftAttachments?: unknown
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
  /** Gemini 기관 등 — 블록 루트 시각. sessionTimes와 함께 둘 수 있다. */
  startTime?: string
  endTime?: string
  /** OpenAPI `PreferredScheduleBlock.dayOfWeek` — 표시는 `date`에서 파생. */
  dayOfWeek?: string
  dateText?: string
  sessionCount?: number
  session?: string
  sessionTimes?: PortalPreferredScheduleSessionTime[]
  times?: PortalPreferredScheduleSessionTime[]
  /** 실제 program_schedule.id. 매칭되지 않은 희망 일정은 null일 수 있다. */
  scheduleId?: number | null
  startAt?: string | null
  endAt?: string | null
  round?: number | null
  label?: string | null
  scheduleStatus?: 'MATCHED' | 'INACTIVE_OR_DELETED' | 'UNMATCHED' | string | null
}

/** Portal `RequestedSessionTimeRequest` — 1사1교 기관 신청 requestedSchedules[].sessionTimes */
export type PortalRequestedSessionTimeRequest = {
  period: number
  startTime: string
  endTime: string
}

/** Portal `RequestedScheduleRequest` — 1사1교 기관 최종 제출 2지망 */
export type PortalRequestedScheduleRequest = {
  requestedDate: string
  startPeriod: number
  sessionCount: number
  combinedClassYn: boolean
  sessionTimes: PortalRequestedSessionTimeRequest[]
}

export type PortalSaveApplicationRequest = {
  recruitmentId: number
  applicationType: string
  formBindingId: number
  answers?: Record<string, unknown>
  requestedSchedules?: PortalRequestedScheduleRequest[]
  requestedClassCount?: number
  requestedStudentCount?: number
  requestedMaleCount?: number
  requestedFemaleCount?: number
  preferredScheduleBlocks?: PortalPreferredScheduleBlock[]
  /**
   * 문항 키 → 본인 파일 id.
   * 일반 봉사자 이전 JA 프로그램, UJAT 이전 활동 수료증만 받는다. 생략·null·{} 는 첨부 없음.
   * 임시저장과 제출은 각각 새 응답이라, 제출 때도 목록을 다시 보낸다.
   */
  fileObjectIdsByQuestion?: Record<string, number[]>
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
