import dayjs from 'dayjs'
import type { MemberLectureReportResponse } from '@/shared/api/generated/members/schemas/memberLectureReportResponse'

export interface MemberLectureReportTableRow {
  id: string
  reportId?: number
  educationDateLabel: string
  submissionPeriodLabel: string
  lectureProgressLabel: '진행 완료' | '진행 예정'
  submissionStatusLabel: '제출 완료' | '미제출' | '진행 예정'
  canViewReport: boolean
}

function formatDateLabel(value?: string): string {
  if (!value?.trim()) return '-'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YY. MM. DD (ddd)') : value
}

function mapReportStatus(raw?: string): {
  lectureProgressLabel: MemberLectureReportTableRow['lectureProgressLabel']
  submissionStatusLabel: MemberLectureReportTableRow['submissionStatusLabel']
  canViewReport: boolean
} {
  const v = raw?.trim().toUpperCase()
  if (v === 'SUBMITTED' || v === 'APPROVED' || v === 'COMPLETED') {
    return {
      lectureProgressLabel: '진행 완료',
      submissionStatusLabel: '제출 완료',
      canViewReport: true,
    }
  }
  if (v === 'REJECTED' || v === 'NOT_SUBMITTED') {
    return {
      lectureProgressLabel: '진행 완료',
      submissionStatusLabel: '미제출',
      canViewReport: false,
    }
  }
  if (v === 'SCHEDULED' || v === 'PENDING') {
    return {
      lectureProgressLabel: '진행 예정',
      submissionStatusLabel: '진행 예정',
      canViewReport: false,
    }
  }
  return {
    lectureProgressLabel: '진행 예정',
    submissionStatusLabel: '미제출',
    canViewReport: false,
  }
}

export function mapMemberLectureReportsToTableRows(
  reports: MemberLectureReportResponse[]
): MemberLectureReportTableRow[] {
  return reports.map((report, index) => {
    const status = mapReportStatus(report.reportStatus)
    const round = report.programScheduleId ?? index + 1
    const submittedAt = formatDateLabel(report.submittedAt)
    return {
      id: String(report.reportId ?? index + 1),
      reportId: report.reportId,
      educationDateLabel: `${submittedAt} | ${round}회차`,
      submissionPeriodLabel: submittedAt,
      ...status,
    }
  })
}
