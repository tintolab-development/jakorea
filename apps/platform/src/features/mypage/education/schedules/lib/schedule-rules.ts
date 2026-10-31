import type {
  EducationAssignmentSubmitStatus,
  EducationScheduleAttendanceStatus,
  EducationScheduleAssignment,
  EducationScheduleItem,
  EducationScheduleProgressStatus,
} from '../model/types'

export function resolveEducationScheduleProgressStatus(
  heldAt: string,
  now = new Date(),
): EducationScheduleProgressStatus {
  const held = new Date(heldAt)
  if (Number.isNaN(held.getTime())) return 'scheduled'
  // 교육일(로컬 일 단위)이 지나면 완료
  const heldDay = new Date(held.getFullYear(), held.getMonth(), held.getDate())
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return heldDay.getTime() < today.getTime() ? 'completed' : 'scheduled'
}

/**
 * 교육일정 행 뱃지 전용.
 * 출결이 있으면 완료, 없으면 endAt(없으면 heldAt 일 단위 규칙) 기준으로 판정.
 * 정산 탭(`resolveSettlementEducationProgress`)은 기존 `resolveEducationScheduleProgressStatus`를 유지한다.
 */
export function resolveEducationScheduleRowProgressStatus(
  item: Pick<EducationScheduleItem, 'heldAt' | 'endAt' | 'attendanceStatus'>,
  now = new Date(),
): EducationScheduleProgressStatus {
  if (item.attendanceStatus != null) return 'completed'
  const endRaw = item.endAt?.trim()
  if (endRaw) {
    const end = new Date(endRaw)
    if (!Number.isNaN(end.getTime())) {
      return now.getTime() > end.getTime() ? 'completed' : 'scheduled'
    }
  }
  return resolveEducationScheduleProgressStatus(item.heldAt, now)
}

export const EDUCATION_SCHEDULE_PROGRESS_LABEL: Record<
  EducationScheduleProgressStatus,
  string
> = {
  completed: '진행 완료',
  scheduled: '진행 예정',
}

export const EDUCATION_SCHEDULE_ATTENDANCE_LABEL: Record<
  EducationScheduleAttendanceStatus,
  string
> = {
  present: '출석',
  late: '지각',
  absent: '결석',
  excused: '사유 불참',
}

/** 과제 영역 노출 — 과제가 있고 제출 시작일 이후(당일 포함) */
export function shouldShowEducationAssignment(
  item: Pick<EducationScheduleItem, 'assignment'>,
  now = new Date(),
): boolean {
  const assignment = item.assignment
  if (!assignment) return false
  const rawStart = assignment.submitStartAt?.trim()
  if (!rawStart) return true
  const start = new Date(rawStart)
  if (Number.isNaN(start.getTime())) return true
  return now.getTime() >= start.getTime()
}

function normalizeScheduleActionCode(value: string): string {
  return value.trim().toUpperCase()
}

function hasScheduleAction(
  availableActions: readonly string[] | undefined,
  action: string,
): boolean {
  return (availableActions ?? []).some(
    item => normalizeScheduleActionCode(item) === action,
  )
}

function normalizeAbsenceReasonStatus(
  value: string | null | undefined,
): string {
  return (value ?? '').trim().toUpperCase()
}

/** 결석 사유 텍스트·제출됨 표시 — SUBMITTED + 사유 문자열만 */
export function shouldDisplayEducationAbsenceReason(
  attendance: EducationScheduleAttendanceStatus | null,
  absenceReasonStatus?: string | null,
  absenceReason?: string | null,
): boolean {
  const status = normalizeAbsenceReasonStatus(absenceReasonStatus)
  if (status === 'NOT_REQUIRED' || !absenceReason?.trim()) return false
  if (attendance === 'present' || attendance === 'late') return false
  return status === 'SUBMITTED'
}

/** 결석 사유 제출 — absenceReasonStatus·API 허용 동작을 우선하고, 출석·지각·사유불참이면 항상 비활성화 */
export function canSubmitEducationAbsenceReason(
  progress: EducationScheduleProgressStatus,
  attendance: EducationScheduleAttendanceStatus | null,
  availableActions?: readonly string[],
  absenceReasonStatus?: string | null,
): boolean {
  const status = normalizeAbsenceReasonStatus(absenceReasonStatus)
  if (status === 'NOT_REQUIRED' || status === 'SUBMITTED') return false
  if (attendance === 'present' || attendance === 'late' || attendance === 'excused') {
    return false
  }
  if (availableActions != null) {
    return hasScheduleAction(availableActions, 'SUBMIT_ABSENCE_REASON')
  }
  if (status === 'NOT_SUBMITTED') {
    return progress === 'scheduled' || attendance === 'absent'
  }
  if (progress === 'scheduled') return true
  return attendance === 'absent'
}

export type EducationAssignmentStatusTone = 'submitted' | 'unsubmitted'
export type EducationAssignmentGuideTone = 'default' | 'feedback'

export type EducationAssignmentGuide = {
  /** 상태 라벨 (대괄호 없음). 없으면 본문만 */
  statusLabel?: string
  statusTone?: EducationAssignmentStatusTone
  /** 안내 본문 (상태 라벨 제외) */
  message: string
  tone: EducationAssignmentGuideTone
  /** primary CTA 라벨 */
  submitLabel: string
  submitDisabled: boolean
  showFeedbackButton: boolean
  /** false면 '수정 제출하기' 등 primary CTA 숨김 (승인 완료) */
  showSubmitButton?: boolean
}

/** FEEDBACK + APPROVED — 수정 제출 숨김 */
export const EDUCATION_ASSIGNMENT_APPROVED_COPY = {
  statusLabel: '승인 완료',
  message: '담당자가 과제를 확인했어요',
} as const

/**
 * 과제 제출 버튼 활성화 여부는 제출 기간을 FE에서 재계산하지 않고
 * 교육일정 API가 내려준 canSubmit/canResubmit만 신뢰한다.
 */
export function canSubmitEducationAssignment(
  assignment: Pick<EducationScheduleAssignment, 'canSubmit' | 'canResubmit'>,
  mode: 'submit' | 'revise',
  availableActions?: readonly string[],
): boolean {
  if (hasScheduleAction(availableActions, 'SUBMIT_ASSIGNMENT')) return true
  return mode === 'revise' ? assignment.canResubmit === true : assignment.canSubmit === true
}

function isDeadlinePassed(submitEndAt: string, now: Date): boolean {
  const end = new Date(submitEndAt)
  if (Number.isNaN(end.getTime())) return false
  return now.getTime() > end.getTime()
}

/** 과제 제출하기 비활성 — 제출 완료이면서 제출 기한이 지난 경우만 */
export function shouldDisableEducationAssignmentSubmit(
  status: EducationAssignmentSubmitStatus,
  submitEndAt: string,
  now = new Date(),
): boolean {
  if (status !== 'submitted' && status !== 'revision_submitted') return false
  return isDeadlinePassed(submitEndAt, now)
}

export type ResolveEducationAssignmentGuideOptions = {
  responseStatus?: string | null
  canResubmit?: boolean
}

function normalizeAssignmentResponseStatus(
  responseStatus: string | null | undefined,
): string {
  return (responseStatus ?? '').trim().toUpperCase()
}

function isAssignmentResponseApproved(responseStatus: string | null | undefined): boolean {
  const normalized = normalizeAssignmentResponseStatus(responseStatus)
  return normalized === 'APPROVED' || normalized === 'COMPLETED'
}

function isAssignmentResponseRejected(responseStatus: string | null | undefined): boolean {
  return normalizeAssignmentResponseStatus(responseStatus) === 'REJECTED'
}

/**
 * 과제 안내 문구·버튼 상태.
 * 상태 라벨(과제 제출 완료 / 미제출)은 UI에서 톤만 다르게 렌더 — 대괄호 없음.
 * FEEDBACK + APPROVED/COMPLETED 만 '승인 완료' + 수정 제출 숨김.
 * REJECTED 는 기존 수정 요청 UI. CTA 활성은 canResubmit/canSubmit만 본다.
 */
export function resolveEducationAssignmentGuide(
  status: EducationAssignmentSubmitStatus,
  submitEndAt: string,
  now = new Date(),
  options?: ResolveEducationAssignmentGuideOptions,
): EducationAssignmentGuide {
  const closed = isDeadlinePassed(submitEndAt, now)

  if (status === 'feedback') {
    if (isAssignmentResponseApproved(options?.responseStatus)) {
      return {
        statusLabel: EDUCATION_ASSIGNMENT_APPROVED_COPY.statusLabel,
        statusTone: 'submitted',
        message: EDUCATION_ASSIGNMENT_APPROVED_COPY.message,
        tone: 'default',
        submitLabel: '수정 제출하기',
        submitDisabled: true,
        showFeedbackButton: true,
        showSubmitButton: false,
      }
    }
    const rejected = isAssignmentResponseRejected(options?.responseStatus)
    const canResubmit = options?.canResubmit === true
    return {
      message: '담당자의 피드백이 있어요',
      tone: 'feedback',
      submitLabel: '수정 제출하기',
      submitDisabled: !canResubmit,
      showFeedbackButton: true,
      showSubmitButton: rejected || canResubmit || options?.canResubmit !== false,
    }
  }

  if (status === 'revision_submitted') {
    return {
      statusLabel: '과제 제출 완료',
      statusTone: 'submitted',
      message: '과제 수정 제출이 완료되었어요',
      tone: 'default',
      submitLabel: '과제 제출하기',
      submitDisabled: true,
      showFeedbackButton: false,
    }
  }

  if (status === 'submitted') {
    if (closed) {
      return {
        statusLabel: '과제 제출 완료',
        statusTone: 'submitted',
        message: '과제 제출기한이 마감되었어요',
        tone: 'default',
        submitLabel: '과제 제출하기',
        submitDisabled: true,
        showFeedbackButton: false,
      }
    }
    return {
      statusLabel: '과제 제출 완료',
      statusTone: 'submitted',
      message: '제출한 과제는 마감 전까지는 수정이 가능해요',
      tone: 'default',
      submitLabel: '과제 제출하기',
      submitDisabled: false,
      showFeedbackButton: false,
    }
  }

  // not_submitted
  if (closed) {
    return {
      statusLabel: '미제출',
      statusTone: 'unsubmitted',
      message: '과제 제출기한이 마감되었어요',
      tone: 'default',
      submitLabel: '과제 제출하기',
      submitDisabled: false,
      showFeedbackButton: false,
    }
  }
  return {
    message: '기한 내에 과제를 제출해 주세요',
    tone: 'default',
    submitLabel: '과제 제출하기',
    submitDisabled: false,
    showFeedbackButton: false,
  }
}
