import dayjs from 'dayjs'
import { formatYyMdSpacedWithKoreanWeekday } from '@/shared/lib/format-date-korean-weekday'
import type { MemberLectureReportResponse } from '@/shared/api/generated/members/schemas/memberLectureReportResponse'
import {
  resolveLectureReportProgressLabel,
  resolveLectureReportSubmissionStatus,
  type LectureReportProgressLabel,
  type LectureReportSubmissionLabel,
} from '@/features/program/shared/lib/lecture-report-status'

export interface MemberLectureReportTableRow {
  id: string
  reportId?: number
  educationDateLabel: string
  submissionPeriodLabel: string
  /** 서버 `lectureProgressStatus` 그대로 (`lecture-report-status.ts`) */
  lectureProgressLabel: LectureReportProgressLabel
  /** 서버 `reportStatus` 그대로 — GAVE_UP·UPCOMING·NOT_SUBMITTED는 회원 API 합성값 */
  submissionStatusLabel: LectureReportSubmissionLabel
  /** 내려받을 첨부(file_object)가 있을 때만 보기 — 회원 API에 보고서 단건 다운로드 경로가 없다 */
  canViewReport: boolean
  /** 서버 `reportFileIds` — file_object id 보장이 없어 보고서 본문 응답을 우선 쓴다 */
  reportFileIds?: number[]
  /** 미리보기 「프로그램 진행 정보」 보조값 — 제출 답변이 비었을 때만 쓴다 */
  institutionName?: string
  educationGrade?: string
  lectureStartAt?: string
}

function formatDateLabel(value?: string): string {
  if (!value?.trim()) return '-'
  const parsed = dayjs(value)
  return parsed.isValid() ? formatYyMdSpacedWithKoreanWeekday(parsed) : value
}

/** 교육 진행 일정 — 서버 강의 시작일(`lectureStartAt`) | 본교육 회차(`sessionOrdinal`). 회차가 없으면(사전교육 등) 날짜만 */
function formatEducationScheduleLabel(lectureStartAt?: string, sessionOrdinal?: number): string {
  const dateLabel = formatDateLabel(lectureStartAt)
  const hasRound = typeof sessionOrdinal === 'number' && Number.isInteger(sessionOrdinal) && sessionOrdinal > 0
  if (!hasRound) return dateLabel
  return dateLabel === '-' ? `${sessionOrdinal}회차` : `${dateLabel} | ${sessionOrdinal}회차`
}

/** 강의보고서 제출 기간 — 서버 제출 마감(`submitDueAt`)까지 */
function formatSubmissionPeriodLabel(submitDueAt?: string): string {
  const dueLabel = formatDateLabel(submitDueAt)
  return dueLabel === '-' ? '-' : `${dueLabel}까지`
}

export function mapMemberLectureReportsToTableRows(
  reports: MemberLectureReportResponse[]
): MemberLectureReportTableRow[] {
  return reports.map((report, index) => {
    const submission = resolveLectureReportSubmissionStatus(report.reportStatus)
    const reportFileIds = report.reportFileIds?.filter(
      (id): id is number => typeof id === 'number' && Number.isFinite(id)
    )

    return {
      // 회원 API는 배정 1건당 1행 — 보고서가 없는 행도 있어 배정 id를 행 키로 쓴다
      id: String(report.instructorAssignmentId ?? report.reportId ?? `row-${index}`),
      reportId: report.reportId,
      educationDateLabel: formatEducationScheduleLabel(report.lectureStartAt, report.sessionOrdinal),
      submissionPeriodLabel: formatSubmissionPeriodLabel(report.submitDueAt),
      lectureProgressLabel: resolveLectureReportProgressLabel(report.lectureProgressStatus),
      submissionStatusLabel: submission.label,
      canViewReport: (reportFileIds?.length ?? 0) > 0,
      reportFileIds,
      institutionName: report.institutionName?.trim() || undefined,
      educationGrade: report.educationGrade?.trim() || undefined,
      lectureStartAt: report.lectureStartAt,
    }
  })
}
