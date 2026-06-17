import dayjs from 'dayjs'
import type {
  ParticipatingIndividualInstructorLectureProgress,
  ParticipatingIndividualInstructorSubmissionStatus,
} from '@/features/program/general/lib/participating-individual-instructor-lecture-report-types'

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const

export const PARTICIPATING_INDIVIDUAL_INSTRUCTOR_LECTURE_PROGRESS_LABELS: Record<
  ParticipatingIndividualInstructorLectureProgress,
  string
> = {
  completed: '진행 완료',
  scheduled: '진행 예정',
  activity_withdrawn: '활동 포기',
}

export const PARTICIPATING_INDIVIDUAL_INSTRUCTOR_SUBMISSION_STATUS_LABELS: Record<
  ParticipatingIndividualInstructorSubmissionStatus,
  string
> = {
  submitted: '제출 완료',
  not_submitted: '미제출',
  scheduled: '진행 예정',
}

const STATUS_ACCENT_DEFAULT = 'var(--default-BK, #3d3d3d)'
const STATUS_ACCENT_SCHEDULED = 'var(--color-green, #1e8c29)'
const STATUS_ACCENT_UNDONE = 'var(--color-red, #c32f4a)'
const STATUS_ACCENT_WITHDRAWN = 'var(--default-BK, #3d3d3d)'

export function lectureProgressAccent(
  key: ParticipatingIndividualInstructorLectureProgress
): string {
  if (key === 'scheduled') return STATUS_ACCENT_SCHEDULED
  if (key === 'activity_withdrawn') return STATUS_ACCENT_WITHDRAWN
  return STATUS_ACCENT_DEFAULT
}

export function submissionStatusAccent(
  key: ParticipatingIndividualInstructorSubmissionStatus
): string {
  if (key === 'not_submitted') return STATUS_ACCENT_UNDONE
  if (key === 'scheduled') return STATUS_ACCENT_SCHEDULED
  return STATUS_ACCENT_DEFAULT
}

/** 강의일 기준 익월 5일 — `2026. 02. 05(목)까지` */
export function formatLectureReportSubmissionDeadline(dateKey: string): string {
  const date = dayjs(dateKey)
  if (!date.isValid()) return '-'
  const deadline = date.add(1, 'month').date(5)
  const weekday = WEEKDAY_KO[deadline.day()]
  const y = deadline.year()
  const m = String(deadline.month() + 1).padStart(2, '0')
  const d = String(deadline.date()).padStart(2, '0')
  return `${y}. ${m}. ${d}(${weekday})까지`
}

/** `YYYY. MM. DD(요일) HH:mm ~ HH:mm` + 선택적 `| 회차/일정명` */
export function formatIndividualInstructorEducationScheduleLabel(input: {
  dateKey: string
  timeRange?: string
  sessionName?: string | null
}): string {
  const date = dayjs(input.dateKey)
  if (!date.isValid()) return '-'

  const weekday = WEEKDAY_KO[date.day()]
  const y = date.year()
  const m = String(date.month() + 1).padStart(2, '0')
  const d = String(date.date()).padStart(2, '0')
  const datePart = `${y}. ${m}. ${d}(${weekday})`
  const timeRange = input.timeRange?.trim()
  const sessionName = input.sessionName?.trim()

  if (timeRange && sessionName) {
    return `${datePart} ${timeRange} | ${sessionName}`
  }
  if (timeRange) {
    return `${datePart} ${timeRange}`
  }
  if (sessionName) {
    return `${datePart} | ${sessionName}`
  }
  return datePart
}
