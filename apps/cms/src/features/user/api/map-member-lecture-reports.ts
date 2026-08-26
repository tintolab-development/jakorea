import dayjs from 'dayjs'
import type { MemberLectureReportResponse } from '@/shared/api/generated/members/schemas/memberLectureReportResponse'

/** OpenAPI 미반영 확장 필드 — PH-015 BE 스키마 확장 시 매핑 SSOT */
export type MemberLectureReportResponseExtended = MemberLectureReportResponse & {
  educationDateLabel?: string
  submissionPeriodLabel?: string
  submissionPeriodStart?: string
  submissionPeriodEnd?: string
  lectureProgress?: string
  submissionStatus?: string
  reportFileIds?: number[]
  downloadUrl?: string
}

export interface MemberLectureReportTableRow {
  id: string
  reportId?: number
  educationDateLabel: string
  submissionPeriodLabel: string
  lectureProgressLabel: '진행 완료' | '진행 예정'
  submissionStatusLabel: '제출 완료' | '미제출' | '진행 예정'
  canViewReport: boolean
  reportFileIds?: number[]
}

function formatDateLabel(value?: string): string {
  if (!value?.trim()) return '-'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YY. MM. DD (ddd)') : value
}

function formatPeriodLabel(start?: string, end?: string, label?: string): string {
  if (label?.trim()) return label.trim()
  const startLabel = formatDateLabel(start)
  const endLabel = formatDateLabel(end)
  if (startLabel !== '-' && endLabel !== '-') return `${startLabel} ~ ${endLabel}`
  if (startLabel !== '-') return startLabel
  if (endLabel !== '-') return endLabel
  return '-'
}

function mapLectureProgressLabel(raw?: string): MemberLectureReportTableRow['lectureProgressLabel'] {
  const v = raw?.trim().toUpperCase()
  if (v === 'COMPLETED' || v === 'DONE') return '진행 완료'
  if (v === 'SCHEDULED' || v === 'PENDING') return '진행 예정'
  return '진행 예정'
}

function mapSubmissionStatusLabel(
  raw?: string
): MemberLectureReportTableRow['submissionStatusLabel'] {
  const v = raw?.trim().toUpperCase()
  if (v === 'SUBMITTED' || v === 'APPROVED' || v === 'COMPLETED') return '제출 완료'
  if (v === 'REJECTED' || v === 'NOT_SUBMITTED') return '미제출'
  if (v === 'SCHEDULED' || v === 'PENDING') return '진행 예정'
  return '미제출'
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
    const extended = report as MemberLectureReportResponseExtended
    const fromStatus = mapReportStatus(report.reportStatus)
    const round = report.programScheduleId ?? index + 1
    const submittedAt = formatDateLabel(report.submittedAt)
    const reportFileIds = extended.reportFileIds?.filter(
      (id): id is number => typeof id === 'number' && Number.isFinite(id)
    )
    const hasDownloadTarget =
      (reportFileIds?.length ?? 0) > 0 ||
      Boolean(extended.downloadUrl?.trim()) ||
      fromStatus.canViewReport

    return {
      id: String(report.reportId ?? index + 1),
      reportId: report.reportId,
      educationDateLabel:
        extended.educationDateLabel?.trim() || `${submittedAt} | ${round}회차`,
      submissionPeriodLabel: formatPeriodLabel(
        extended.submissionPeriodStart,
        extended.submissionPeriodEnd,
        extended.submissionPeriodLabel
      ),
      lectureProgressLabel: extended.lectureProgress
        ? mapLectureProgressLabel(extended.lectureProgress)
        : fromStatus.lectureProgressLabel,
      submissionStatusLabel: extended.submissionStatus
        ? mapSubmissionStatusLabel(extended.submissionStatus)
        : fromStatus.submissionStatusLabel,
      canViewReport: hasDownloadTarget,
      reportFileIds,
    }
  })
}
