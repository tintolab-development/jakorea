import dayjs from 'dayjs'
import type { LectureReportListItemResponse } from '@/shared/api/generated/dashboard/schemas/lectureReportListItemResponse'

/**
 * GET …/programs/{id}/lecture-reports 응답 → 강사 강의보고서 테이블 row.
 */

export type ParticipatingInstructorLectureReportRow = {
  id: string
  no: number
  reportId?: number
  instructorMemberId?: number
  schoolName: string
  educationGrade: string
  educationScheduleLabel: string
  submissionPeriodLabel: string
  lectureProgressLabel: '진행 완료' | '진행 예정'
  submissionStatusLabel: '제출 완료' | '미제출' | '진행 예정'
  canViewReport: boolean
  fileObjectIds: number[]
}

function mapSubmissionLabel(
  status: string | undefined,
  submittedAt: string | undefined
): ParticipatingInstructorLectureReportRow['submissionStatusLabel'] {
  const s = (status ?? '').toUpperCase()
  if (submittedAt || s.includes('SUBMIT') || s === 'SUBMITTED' || s === 'DONE') {
    return '제출 완료'
  }
  if (s.includes('SCHEDULE') || s.includes('PENDING_START') || s === 'UPCOMING') {
    return '진행 예정'
  }
  return '미제출'
}

function mapProgressLabel(
  progressStatus: string | undefined,
  submissionStatusLabel: ParticipatingInstructorLectureReportRow['submissionStatusLabel']
): ParticipatingInstructorLectureReportRow['lectureProgressLabel'] {
  const p = (progressStatus ?? '').toUpperCase()
  if (p === 'UPCOMING') return '진행 예정'
  if (p === 'COMPLETED') return '진행 완료'
  return submissionStatusLabel === '진행 예정' ? '진행 예정' : '진행 완료'
}

function buildScheduleLabel(row: LectureReportListItemResponse): string {
  const dateRound = row.dateRoundTimeLabel?.trim()
  if (dateRound) return dateRound
  const lectureLabel = row.lectureLabel?.trim()
  if (lectureLabel) return lectureLabel

  const parts: string[] = []
  if (row.lectureDate) {
    const d = dayjs(row.lectureDate)
    parts.push(d.isValid() ? d.format('YYYY. MM. DD') : row.lectureDate)
  }
  if (row.sessionNo != null) parts.push(`${row.sessionNo}회차`)
  if (row.timeLabel?.trim()) parts.push(row.timeLabel.trim())
  if (parts.length > 0) return parts.join(' | ')
  if (row.scheduleId != null) return `일정 #${row.scheduleId}`
  return '-'
}

export function mapLectureReportDtoToInstructorRow(
  dto: unknown,
  index: number
): ParticipatingInstructorLectureReportRow | null {
  if (dto == null || typeof dto !== 'object') return null
  const row = dto as LectureReportListItemResponse & Record<string, unknown>
  const reportId =
    typeof row.reportId === 'number' && Number.isFinite(row.reportId) ? row.reportId : undefined
  const id = String(reportId ?? row.id ?? index + 1)
  const due = row.submitDueAt ? dayjs(row.submitDueAt) : null
  const submissionPeriodLabel =
    due?.isValid() === true ? `${due.format('YYYY. MM. DD')}까지` : '-'
  const submissionStatusLabel = mapSubmissionLabel(row.reportStatus, row.submittedAt)
  const lectureProgressLabel = mapProgressLabel(row.lectureProgressStatus, submissionStatusLabel)
  const fileObjectIds = (row.fileObjectIds ?? []).filter(
    (id): id is number => typeof id === 'number' && Number.isFinite(id)
  )
  const grade =
    (typeof row.grade === 'string' && row.grade.trim()) ||
    (typeof row.educationGrade === 'string' && row.educationGrade.trim()) ||
    '-'

  return {
    id,
    no: index + 1,
    reportId,
    instructorMemberId:
      typeof row.instructorMemberId === 'number' && Number.isFinite(row.instructorMemberId)
        ? row.instructorMemberId
        : undefined,
    schoolName: typeof row.schoolName === 'string' && row.schoolName.trim() ? row.schoolName : '-',
    educationGrade: grade,
    educationScheduleLabel: buildScheduleLabel(row),
    submissionPeriodLabel,
    lectureProgressLabel,
    submissionStatusLabel,
    canViewReport: submissionStatusLabel === '제출 완료',
    fileObjectIds,
  }
}
