import dayjs from 'dayjs'
import { formatDateDot } from '@/shared/utils/date'
import type { LectureReportListItemResponse } from '@/shared/api/generated/dashboard/schemas/lectureReportListItemResponse'
import {
  formatEducationScheduleLabelTokens,
  isEducationSchedulePreEducation,
  positiveEducationNumber,
} from '@/shared/lib/education-schedule-name'
import {
  resolveLectureReportProgressLabel,
  resolveLectureReportSubmissionStatus,
  type LectureReportProgressLabel,
  type LectureReportSubmissionLabel,
} from '@/features/program/shared/lib/lecture-report-status'
import {
  resolveGeneralProgramScheduleStructure,
  resolveGeneralScheduleUnitLabel,
} from '@/features/program/general/lib/schedule-unit-label'
import type { Program } from '@/types/domain'

/**
 * GET …/programs/{id}/lecture-reports 응답 → 강사 강의보고서 테이블 row.
 */

export type ParticipatingInstructorLectureReportRow = {
  id: string
  no: number
  reportId?: number
  formResponseId?: number
  templateVersionId?: number
  scheduleId?: number
  instructorMemberId?: number
  schoolName: string
  educationGrade: string
  educationScheduleLabel: string
  lectureDate?: string
  sessionNo?: number
  curriculumSessionCount?: number
  scheduleRole?: string
  educationSlotKey?: string
  timeLabel?: string
  submissionPeriodLabel: string
  /** 서버 `lectureProgressStatus` 그대로 (`lecture-report-status.ts`) */
  lectureProgressLabel: LectureReportProgressLabel
  /** 서버 `reportStatus` 그대로 — 제출일 유무로 추정하지 않는다 */
  submissionStatusLabel: LectureReportSubmissionLabel
  canViewReport: boolean
  fileCount: number
  fileObjectIds: number[]
}

function readLooseString(raw: Record<string, unknown>, keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const value = raw[key]
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed) return trimmed
    }
  }
  return undefined
}

function readLoosePositiveInt(
  raw: Record<string, unknown>,
  keys: readonly string[]
): number | undefined {
  for (const key of keys) {
    const value = raw[key]
    if (typeof value === 'number') {
      const n = positiveEducationNumber(value)
      if (n != null) return n
    }
    if (typeof value === 'string') {
      const n = positiveEducationNumber(Number(value.trim()))
      if (n != null) return n
    }
  }
  return undefined
}

type LectureReportScheduleFields = {
  sessionNo?: number
  curriculumSessionCount?: number
  scheduleRole?: string
  educationSlotKey?: string
  lectureDate?: string
  timeLabel?: string
}

export function readLectureReportScheduleFields(
  dto: unknown
): LectureReportScheduleFields {
  if (dto == null || typeof dto !== 'object') return {}
  const raw = dto as Record<string, unknown>
  return {
    sessionNo: readLoosePositiveInt(raw, ['sessionNo', 'session_no']),
    curriculumSessionCount: readLoosePositiveInt(raw, [
      'curriculumSessionCount',
      'curriculum_session_count',
    ]),
    scheduleRole: readLooseString(raw, ['scheduleRole', 'schedule_role', 'scheduleKind', 'schedule_kind']),
    educationSlotKey: readLooseString(raw, ['educationSlotKey', 'education_slot_key']),
    lectureDate:
      typeof raw.lectureDate === 'string' && raw.lectureDate.trim() ? raw.lectureDate.trim() : undefined,
    timeLabel:
      typeof raw.timeLabel === 'string' && raw.timeLabel.trim() ? raw.timeLabel.trim() : undefined,
  }
}

function lectureReportDateToken(lectureDate: string | undefined): string | undefined {
  if (!lectureDate) return undefined
  const iso = /^(\d{4}-\d{2}-\d{2})/.exec(lectureDate.trim())
  if (iso) return iso[1]
  const d = dayjs(lectureDate)
  return d.isValid() ? d.format('YYYY-MM-DD') : lectureDate.trim()
}

function isLegacySessionNoAsSessionLabel(label: string, sessionNo: number | undefined): boolean {
  if (sessionNo == null) return false
  const hasRound = new RegExp(`(^|[|·\\s])${sessionNo}\\s*회차(?=\\s*[|·]|$)`, 'u').test(label)
  if (hasRound) return false
  return new RegExp(`(^|[|·\\s])${sessionNo}\\s*차시(?=\\s*[|·]|$)`, 'u').test(label)
}

/**
 * 일정 단위 토큰. 회차와 차시를 괄호로 합치지 않는다.
 * - 일반 프로그램 일정형: 세부 일정명 / 커리큘럼형 단일 회차: `N차시`(회차 표기 없음)
 * - 커리큘럼형 복수 회차·사전교육·그 외 유형(1사1교 등): `N회차`, `K차시`
 */
function resolveLectureReportUnitTokens(
  fields: LectureReportScheduleFields,
  isPreEducation: boolean,
  program?: Program | null
): string[] {
  const tokens = formatEducationScheduleLabelTokens({
    sessionNo: fields.sessionNo,
    curriculumSessionCount: fields.curriculumSessionCount,
    scheduleRole: fields.scheduleRole,
    educationSlotKey: fields.educationSlotKey,
  })
  if (isPreEducation) return tokens
  const structure = resolveGeneralProgramScheduleStructure(program)
  if (structure == null) return tokens
  if (structure.educationStructure === 'curriculum' && structure.sessionRound === 'multi') {
    return tokens
  }
  const unit = resolveGeneralScheduleUnitLabel(
    {
      sessionNo: fields.sessionNo,
      curriculumSessionCount: fields.curriculumSessionCount,
      scheduleRole: fields.scheduleRole,
      educationSlotKey: fields.educationSlotKey,
    },
    program
  )
  return unit ? [unit] : []
}

/**
 * 강의보고서 일정 라벨. canonical 필드로 재조립하고, 구버전 `N차시` dateRoundTimeLabel은 쓰지 않는다.
 * 표시: 날짜 · 일정 단위(교육 구조별) · 시각.
 */
export function buildLectureReportEducationScheduleLabel(
  dto: unknown,
  fields: LectureReportScheduleFields = readLectureReportScheduleFields(dto),
  program?: Program | null
): string {
  const isPreEducation = isEducationSchedulePreEducation({
    scheduleRole: fields.scheduleRole,
    educationSlotKey: fields.educationSlotKey,
  })
  const unitTokens = resolveLectureReportUnitTokens(fields, isPreEducation, program)
  const canCompose = isPreEducation || fields.sessionNo != null || unitTokens.length > 0
  if (canCompose) {
    const parts: string[] = []
    const dateToken = lectureReportDateToken(fields.lectureDate)
    if (dateToken) parts.push(dateToken)
    parts.push(...unitTokens)
    if (fields.timeLabel) parts.push(fields.timeLabel)
    if (parts.length > 0) return parts.join(' | ')
  }

  if (dto == null || typeof dto !== 'object') return '-'
  const row = dto as LectureReportListItemResponse
  const fallback = row.dateRoundTimeLabel?.trim() || row.lectureLabel?.trim()
  if (fallback && !isLegacySessionNoAsSessionLabel(fallback, fields.sessionNo)) {
    return fallback
  }
  const leftover: string[] = []
  const dateToken = lectureReportDateToken(fields.lectureDate)
  if (dateToken) leftover.push(dateToken)
  if (fields.timeLabel) leftover.push(fields.timeLabel)
  if (leftover.length > 0) return leftover.join(' | ')
  if (row.scheduleId != null) return `일정 #${row.scheduleId}`
  return '-'
}

export function mapLectureReportDtoToInstructorRow(
  dto: unknown,
  index: number,
  program?: Program | null
): ParticipatingInstructorLectureReportRow | null {
  if (dto == null || typeof dto !== 'object') return null
  const row = dto as LectureReportListItemResponse & Record<string, unknown>
  const scheduleFields = readLectureReportScheduleFields(row)
  const reportId =
    typeof row.reportId === 'number' && Number.isFinite(row.reportId) ? row.reportId : undefined
  const formResponseId =
    typeof row.formResponseId === 'number' && Number.isFinite(row.formResponseId)
      ? row.formResponseId
      : undefined
  const templateVersionId =
    typeof row.templateVersionId === 'number' && Number.isFinite(row.templateVersionId)
      ? row.templateVersionId
      : undefined
  const scheduleId =
    typeof row.scheduleId === 'number' && Number.isFinite(row.scheduleId)
      ? row.scheduleId
      : undefined
  const id = String(reportId ?? row.id ?? index + 1)
  const due = row.submitDueAt ? dayjs(row.submitDueAt) : null
  const submissionPeriodLabel = due?.isValid() === true ? `${formatDateDot(due)}까지` : '-'
  const submission = resolveLectureReportSubmissionStatus(row.reportStatus)
  const lectureProgressLabel = resolveLectureReportProgressLabel(row.lectureProgressStatus)
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
    formResponseId,
    templateVersionId,
    scheduleId,
    instructorMemberId:
      typeof row.instructorMemberId === 'number' && Number.isFinite(row.instructorMemberId)
        ? row.instructorMemberId
        : undefined,
    schoolName: typeof row.schoolName === 'string' && row.schoolName.trim() ? row.schoolName : '-',
    educationGrade: grade,
    educationScheduleLabel: buildLectureReportEducationScheduleLabel(row, scheduleFields, program),
    lectureDate: scheduleFields.lectureDate,
    sessionNo: scheduleFields.sessionNo,
    curriculumSessionCount: scheduleFields.curriculumSessionCount,
    scheduleRole: scheduleFields.scheduleRole,
    educationSlotKey: scheduleFields.educationSlotKey,
    timeLabel: scheduleFields.timeLabel,
    submissionPeriodLabel,
    lectureProgressLabel,
    submissionStatusLabel: submission.label,
    canViewReport: submission.hasSubmittedReport,
    fileCount:
      typeof row.fileCount === 'number' && Number.isFinite(row.fileCount)
        ? row.fileCount
        : fileObjectIds.length,
    fileObjectIds,
  }
}
