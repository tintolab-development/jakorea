import type {
  EducationAssignmentSubmitStatus,
  EducationScheduleAttendanceStatus,
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
  const start = new Date(assignment.submitStartAt)
  if (Number.isNaN(start.getTime())) return false
  return now.getTime() >= start.getTime()
}

/** 결석 사유 제출 — 진행 전(예정) 또는 결석 */
export function canSubmitEducationAbsenceReason(
  progress: EducationScheduleProgressStatus,
  attendance: EducationScheduleAttendanceStatus | null,
): boolean {
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
}

function isDeadlinePassed(submitEndAt: string, now: Date): boolean {
  const end = new Date(submitEndAt)
  if (Number.isNaN(end.getTime())) return false
  return now.getTime() > end.getTime()
}

/**
 * 과제 안내 문구·버튼 상태.
 * 상태 라벨(과제 제출 완료 / 미제출)은 UI에서 톤만 다르게 렌더 — 대괄호 없음.
 */
export function resolveEducationAssignmentGuide(
  status: EducationAssignmentSubmitStatus,
  submitEndAt: string,
  now = new Date(),
): EducationAssignmentGuide {
  const closed = isDeadlinePassed(submitEndAt, now)

  if (status === 'feedback') {
    return {
      message: '담당자의 과제 피드백이 있어요',
      tone: 'feedback',
      submitLabel: '수정 제출하기',
      submitDisabled: false,
      showFeedbackButton: true,
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
      message: '제출한 과제는 마감 전까지는 수정 제출이 가능해요',
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
