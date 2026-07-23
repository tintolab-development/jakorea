import dayjs from 'dayjs'
import type { LectureReportListItemResponse } from '@/shared/api/generated/dashboard/schemas/lectureReportListItemResponse'

/**
 * GET …/programs/{id}/lecture-reports 응답 → 강사 강의보고서 테이블 row.
 */

export type ParticipatingInstructorLectureReportRow = {
  id: string
  no: number
  schoolName: string
  educationGrade: string
  educationScheduleLabel: string
  submissionPeriodLabel: string
  lectureProgressLabel: '진행 완료' | '진행 예정'
  submissionStatusLabel: '제출 완료' | '미제출' | '진행 예정'
  canViewReport: boolean
}

function mapSubmissionLabel(
  status: string | undefined,
  submittedAt: string | undefined
): ParticipatingInstructorLectureReportRow['submissionStatusLabel'] {
  const s = (status ?? '').toUpperCase()
  if (submittedAt || s.includes('SUBMIT') || s === 'SUBMITTED' || s === 'DONE') {
    return '제출 완료'
  }
  if (s.includes('SCHEDULE') || s.includes('PENDING_START')) return '진행 예정'
  return '미제출'
}

export function mapLectureReportDtoToInstructorRow(
  dto: unknown,
  index: number
): ParticipatingInstructorLectureReportRow | null {
  if (dto == null || typeof dto !== 'object') return null
  const row = dto as LectureReportListItemResponse & Record<string, unknown>
  const id = String(row.reportId ?? row.id ?? index + 1)
  const due = row.submitDueAt ? dayjs(row.submitDueAt) : null
  const submissionPeriodLabel =
    due?.isValid() === true ? `${due.format('YYYY. MM. DD')}까지` : '-'
  const scheduleLabel =
    row.scheduleId != null ? `일정 #${row.scheduleId}` : '-'
  const submissionStatusLabel = mapSubmissionLabel(row.reportStatus, row.submittedAt)
  const progress: ParticipatingInstructorLectureReportRow['lectureProgressLabel'] =
    submissionStatusLabel === '진행 예정' ? '진행 예정' : '진행 완료'

  return {
    id,
    no: index + 1,
    schoolName: typeof row.schoolName === 'string' ? row.schoolName : '-',
    educationGrade: typeof row.educationGrade === 'string' ? row.educationGrade : '-',
    educationScheduleLabel: scheduleLabel,
    submissionPeriodLabel,
    lectureProgressLabel: progress,
    submissionStatusLabel,
    canViewReport: submissionStatusLabel === '제출 완료',
  }
}
