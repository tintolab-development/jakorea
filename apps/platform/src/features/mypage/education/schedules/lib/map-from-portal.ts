import type {
  PortalEducationCurriculumSession,
  PortalEducationSchedule,
  PortalEducationScheduleAssignment,
  PortalEducationScheduleGroupTime,
  PortalEducationStructure,
  PortalSessionRound,
} from '../../applications/api/activity-client'
import type { ProgramApplicationType } from '../../applications/api/types'
import type {
  PortalPreferredScheduleBlock,
  PortalPreferredScheduleSessionTime,
} from '../../../../program/api/application-types.ts'
import {
  EDUCATION_SCHEDULE_EMPTY_LABEL,
  resolveEducationScheduleCommonInfoLabel,
  resolveEducationScheduleRowLabel,
} from './common-info-label.ts'
import { isTrainedTeacherOrganizationSchedule } from './trained-teacher-organization.ts'
import { joinEducationScheduleDateAndTime } from './held-label.ts'
import {
  stripDefaultEducationSlotNameFromLabel,
  toDisplayEducationScheduleName,
} from '../../../../../shared/lib/education-schedule-name.ts'
import {
  formatDisplayDate,
  formatDisplayDateTimeRange,
  normalizeScheduleDisplayLabel,
} from '../../../../../shared/lib/format-display-date.ts'
import type {
  EducationAssignmentResponseStatus,
  EducationAssignmentSubmitStatus,
  EducationCurriculumSession,
  EducationScheduleAssignment,
  EducationScheduleAssignmentFile,
  EducationScheduleAttendanceStatus,
  EducationScheduleItem,
  EducationScheduleTeamInfo,
} from '../model/types'

const TEAM_ROLE_LABEL: Record<string, string> = {
  LEADER: '팀장',
  MEMBER: '팀원',
  INDIVIDUAL: '개인',
}

function mapTeamInfo(
  teamRole: string | null | undefined,
  teamName: string | null | undefined,
): EducationScheduleTeamInfo | undefined {
  const role = optionalText(teamRole ?? undefined)?.toUpperCase()
  if (!role) return undefined
  const name = optionalText(teamName ?? undefined)
  return {
    roleLabel: TEAM_ROLE_LABEL[role] ?? role,
    ...(name ? { teamName: name } : {}),
  }
}

function optionalText(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function mapAvailableActions(
  values: readonly string[] | undefined,
  applicationType?: ProgramApplicationType | null,
): string[] | undefined {
  const actions = (values ?? [])
    .map(value => value.trim().toUpperCase())
    .filter(value => value.length > 0)
    .filter(value => !(applicationType === 'ORGANIZATION' && value === 'CHECK_IN'))
  return actions.length > 0 ? [...new Set(actions)] : undefined
}

function mapAttendance(
  value: string | null | undefined,
): EducationScheduleAttendanceStatus | null {
  switch ((value ?? '').toUpperCase()) {
    case 'PRESENT':
    case 'ATTENDED':
      return 'present'
    case 'LATE':
      return 'late'
    case 'ABSENT':
      return 'absent'
    case 'EXCUSED':
      return 'excused'
    default:
      return null
  }
}

function mapAssignmentResponseStatus(
  value: string | null | undefined,
): EducationAssignmentResponseStatus | undefined {
  switch ((value ?? '').trim().toUpperCase()) {
    case 'SUBMITTED':
      return 'SUBMITTED'
    case 'APPROVED':
      return 'APPROVED'
    case 'REJECTED':
      return 'REJECTED'
    case 'COMPLETED':
      return 'COMPLETED'
    default:
      return undefined
  }
}

function mapAssignmentStatus(value: string | undefined): EducationAssignmentSubmitStatus {
  switch ((value ?? '').toUpperCase()) {
    case 'SUBMITTED':
      return 'submitted'
    case 'FEEDBACK':
      return 'feedback'
    case 'REVISION_SUBMITTED':
      return 'revision_submitted'
    default:
      return 'not_submitted'
  }
}

function formatPeriodLabel(startAt: string | null | undefined, endAt: string | null | undefined): string {
  return formatDisplayDateTimeRange(startAt, endAt)
}

function formatGroupTimes(times: PortalEducationScheduleGroupTime[] | undefined): string | undefined {
  const labels = (times ?? [])
    .map(slot => {
      const start = slot.startTime?.trim() ?? ''
      const end = slot.endTime?.trim() ?? ''
      if (start && end) return `${start} ~ ${end}`
      return start || end
    })
    .filter(label => label.length > 0)
  if (labels.length === 0) return undefined
  if (labels.length === 1) return labels[0]
  return labels
    .map((label, index) => `그룹 ${String.fromCharCode(65 + index)} : ${label}`)
    .join(' | ')
}

function positiveInteger(value: unknown): number | undefined {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim().length > 0
        ? Number(value)
        : Number.NaN
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined
}

function mapSubmissions(
  assignment: PortalEducationScheduleAssignment,
): EducationScheduleAssignmentFile[] | undefined {
  const files = (assignment.submissions ?? []).flatMap<EducationScheduleAssignmentFile>(
    (row, index): EducationScheduleAssignmentFile[] => {
      const normalizedKind = (row.kind ?? '').toUpperCase()
      if (normalizedKind !== 'FILE' && normalizedKind !== 'URL') return []
      const kind = normalizedKind === 'URL' ? ('url' as const) : ('file' as const)
      const id = `${kind}-${row.id != null ? String(row.id) : index}`
      if (kind === 'url') {
        const url = optionalText(row.url)
        if (!url) return []
        return [{ id, kind, url } satisfies EducationScheduleAssignmentFile]
      }

      const fileName = optionalText(row.fileName)
      if (!fileName) return []
      // Portal 스키마에서 FILE 제출물의 id가 fileObjectId다.
      const fileObjectId = positiveInteger(row.fileObjectId ?? row.id)
      return [
        {
          id,
          fileName,
          kind,
          ...(fileObjectId != null ? { fileObjectId } : {}),
        } satisfies EducationScheduleAssignmentFile,
      ]
    },
  )
  return files.length > 0 ? files : undefined
}

function mapCurriculumSessions(
  sessions: PortalEducationCurriculumSession[] | null | undefined,
): EducationCurriculumSession[] | undefined {
  if (!Array.isArray(sessions) || sessions.length === 0) return undefined
  const mapped = sessions.map((session, index) => {
    const sessionNo =
      typeof session.sessionNo === 'number' && Number.isFinite(session.sessionNo)
        ? session.sessionNo
        : index + 1
    const sessionLabel = optionalText(session.sessionLabel)
    const title = optionalText(session.title)
    const content = optionalText(session.content)
    return {
      sessionNo,
      ...(sessionLabel ? { sessionLabel } : {}),
      ...(title ? { title } : {}),
      ...(content ? { content } : {}),
    } satisfies EducationCurriculumSession
  })
  return mapped.length > 0 ? mapped : undefined
}

function mapAssignment(
  assignment: PortalEducationScheduleAssignment | null | undefined,
): EducationScheduleAssignment | undefined {
  if (!assignment || assignment.enabled !== true) return undefined
  const submitStartAt = optionalText(assignment.submitStartAt ?? undefined) ?? ''
  const submitEndAt = optionalText(assignment.submitEndAt ?? undefined) ?? ''
  const periodLabel =
    (optionalText(assignment.periodLabel)
      ? normalizeScheduleDisplayLabel(assignment.periodLabel!)
      : undefined) ?? formatPeriodLabel(submitStartAt, submitEndAt)
  const files = mapSubmissions(assignment)
  const responseStatus = mapAssignmentResponseStatus(assignment.responseStatus)
  return {
    submitStartAt,
    submitEndAt,
    periodLabel,
    status: mapAssignmentStatus(assignment.status),
    ...(typeof assignment.canSubmit === 'boolean' ? { canSubmit: assignment.canSubmit } : {}),
    ...(typeof assignment.canResubmit === 'boolean'
      ? { canResubmit: assignment.canResubmit }
      : {}),
    ...(responseStatus ? { responseStatus } : {}),
    ...(assignment.formResponseId != null ? { formResponseId: assignment.formResponseId } : {}),
    ...(files ? { files } : {}),
  }
}

export type MapPortalEducationScheduleMeta = {
  educationStructure?: PortalEducationStructure | null
  sessionRound?: PortalSessionRound | null
  applicationType?: ProgramApplicationType | null
  programType?: string | null
  /** 신청 상세 `preferredScheduleBlocks` — TT 기관 운영일 차시 수(scheduleId 매칭 블록의 sessionTimes) */
  preferredScheduleBlocks?: readonly PortalPreferredScheduleBlock[] | null
}

function resolveOperationalDayRowLabel(
  sessionLabel: string | undefined,
  preferenceRank: number | undefined,
): string {
  if (sessionLabel) return sessionLabel
  if (preferenceRank != null) return `${preferenceRank}지망`
  return EDUCATION_SCHEDULE_EMPTY_LABEL
}

function countFilledSlots(
  slots: readonly { startTime?: string; endTime?: string; start?: string; end?: string; timeRange?: string }[] | undefined,
): number {
  return (slots ?? []).filter(
    slot =>
      Boolean(slot.startTime?.trim()) ||
      Boolean(slot.endTime?.trim()) ||
      Boolean(slot.start?.trim()) ||
      Boolean(slot.end?.trim()) ||
      Boolean(slot.timeRange?.trim()),
  ).length
}

/**
 * TT 기관 운영일 `N차시` — 그날 진행 슬롯 수.
 * 1) schedules 응답 groupTimes 2) 같은 scheduleId 의 신청 희망 블록 sessionTimes/sessionCount.
 * 근거가 없으면 undefined — `1차시`를 지어내지 않는다. sessionNo·커리큘럼 차시로 접지 않는다.
 */
function resolveOperationalDayDurationLabel(
  groupTimes: PortalEducationScheduleGroupTime[] | undefined,
  scheduleId: number | null | undefined,
  preferredScheduleBlocks: readonly PortalPreferredScheduleBlock[] | null | undefined,
): string | undefined {
  const fromGroupTimes = countFilledSlots(groupTimes)
  if (fromGroupTimes > 0) return `${fromGroupTimes}차시`
  if (scheduleId == null) return undefined
  const block = (preferredScheduleBlocks ?? []).find(row => row.scheduleId === scheduleId)
  if (!block) return undefined
  const fromBlock = countFilledSlots(block.sessionTimes) || countFilledSlots(block.times)
  if (fromBlock > 0) return `${fromBlock}차시`
  const sessionCount = positiveInteger(block.sessionCount)
  return sessionCount != null ? `${sessionCount}차시` : undefined
}

function isCompanySchoolProgramType(programType: string | null | undefined): boolean {
  const type = programType?.trim().toUpperCase()
  return type === 'COMPANY_SCHOOL' || type === 'ONE_COMPANY_ONE_SCHOOL'
}

/**
 * 1사1교 배정 교육 일정(USER-FUNC-0207) — 같은 scheduleId 희망 블록의 시작 교시·차시 수로
 * `N~(N+1)교시 (2차시)` / `N교시 (1차시)`. 2차시 교시는 1차시 + 1(연강 고정).
 * 매칭 블록이나 교시가 없으면 undefined — 지어내지 않는다.
 */
function resolveCompanySchoolPeriodUnitLabel(
  scheduleId: number | null | undefined,
  preferredScheduleBlocks: readonly PortalPreferredScheduleBlock[] | null | undefined,
): string | undefined {
  if (scheduleId == null) return undefined
  const block = (preferredScheduleBlocks ?? []).find(row => row.scheduleId === scheduleId)
  if (!block) return undefined
  const times = block.sessionTimes ?? block.times ?? []
  const firstPeriodRaw = times[0]?.classPeriod?.replace(/교시\s*$/u, '').trim()
  const startPeriod = positiveInteger(firstPeriodRaw ? Number(firstPeriodRaw) : undefined)
  if (startPeriod == null) return undefined
  const count = positiveInteger(block.sessionCount) ?? (times.length > 0 ? times.length : 1)
  const periods = count > 1 ? `${startPeriod}~${startPeriod + count - 1}교시` : `${startPeriod}교시`
  return `${periods} (${count}차시)`
}

function formatClassPeriodLabel(raw: string): string {
  const digits = raw.replace(/교시\s*$/u, '').trim()
  return /^\d+$/.test(digits) ? `${digits}교시` : raw
}

function formatSessionClockRange(slot: PortalPreferredScheduleSessionTime): string {
  const start = slot.startTime?.trim() || slot.start?.trim() || ''
  const end = slot.endTime?.trim() || slot.end?.trim() || ''
  if (start && end) return `${start} ~ ${end}`
  return slot.timeRange?.trim() || start || end
}

/** 1사1교 희망 블록 시각 범위. 슬롯이 없으면 undefined — 지어내지 않는다. */
function resolveCompanySchoolClockRange(
  scheduleId: number | null | undefined,
  preferredScheduleBlocks: readonly PortalPreferredScheduleBlock[] | null | undefined,
): string | undefined {
  if (scheduleId == null) return undefined
  const block = (preferredScheduleBlocks ?? []).find(row => row.scheduleId === scheduleId)
  if (!block) return undefined
  const times = block.sessionTimes ?? block.times ?? []
  if (times.length === 0) return undefined
  const first = times[0]
  const last = times[times.length - 1]
  if (!first || !last) return undefined
  const start = first.startTime?.trim() || first.start?.trim() || ''
  const end = last.endTime?.trim() || last.end?.trim() || ''
  if (start && end) return `${start} ~ ${end}`
  return formatSessionClockRange(first) || undefined
}

/**
 * 1사1교 카드 본문 — 희망 블록 sessionTimes가 있으면 교시·시각 행.
 * 없으면 undefined (curriculumSessions GET만 사용). 슬롯을 지어내지 않는다.
 */
function mapCompanySchoolPeriodSessions(
  scheduleId: number | null | undefined,
  preferredScheduleBlocks: readonly PortalPreferredScheduleBlock[] | null | undefined,
): EducationCurriculumSession[] | undefined {
  if (scheduleId == null) return undefined
  const block = (preferredScheduleBlocks ?? []).find(row => row.scheduleId === scheduleId)
  if (!block) return undefined
  const times = block.sessionTimes ?? block.times ?? []
  const mapped = times.flatMap((slot, index) => {
    const periodRaw = slot.classPeriod?.trim()
    const timeRange = formatSessionClockRange(slot)
    if (!periodRaw && !timeRange) return []
    return [
      {
        sessionNo: positiveInteger(slot.sessionIndex) ?? index + 1,
        ...(periodRaw ? { sessionLabel: formatClassPeriodLabel(periodRaw) } : {}),
        ...(timeRange ? { title: timeRange } : {}),
      } satisfies EducationCurriculumSession,
    ]
  })
  return mapped.length > 0 ? mapped : undefined
}

/**
 * 신청 GET .../schedules → 교육일정 탭 행. 행 수 = items 수(배정 집합).
 * startAt이 없어도 매핑은 유지한다. 화면은 scheduleId 있는 배정 일정만 노출한다.
 * assignment.enabled가 true가 아니면 과제 블록 omit.
 * 카드 청록 라벨은 공통정보(차시/단원명/일정명)만 쓴다.
 * teamRole/teamName은 표시만. 과제 제출 권한은 assignment.canSubmit/canResubmit·availableActions.
 */
export function mapPortalEducationSchedule(
  item: PortalEducationSchedule,
  index: number,
  meta?: MapPortalEducationScheduleMeta,
): EducationScheduleItem {
  const operationalDayView = isTrainedTeacherOrganizationSchedule(
    meta?.applicationType,
    meta?.programType,
  )
  const sessionNumber =
    item.sessionNo != null && Number.isSafeInteger(item.sessionNo) && item.sessionNo > 0
      ? item.sessionNo
      : operationalDayView
        ? 0
        : index + 1
  // 백엔드 자동 기본명(`공통 교육 예정 N`)은 회차·일정 라벨로 쓰지 않는다.
  const sessionLabel = toDisplayEducationScheduleName(item.sessionLabel)
  const scheduleLabel = optionalText(stripDefaultEducationSlotNameFromLabel(item.scheduleLabel))
  const preferenceRank = positiveInteger(item.preferenceRank)
  const title = operationalDayView
    ? resolveOperationalDayRowLabel(sessionLabel, preferenceRank)
    : resolveEducationScheduleCommonInfoLabel({
        educationStructure: meta?.educationStructure,
        sessionRound: meta?.sessionRound,
        unitName: item.unitName,
        scheduleName: item.scheduleName,
        title: item.title,
        sessionLabel: item.sessionLabel,
      })
  const mappedRowLabel = operationalDayView
    ? resolveOperationalDayRowLabel(sessionLabel, preferenceRank)
    : resolveEducationScheduleRowLabel({
        educationStructure: meta?.educationStructure,
        sessionLabel: item.sessionLabel,
        scheduleName: item.scheduleName,
        title: stripDefaultEducationSlotNameFromLabel(item.title),
        blockKind: item.blockKind,
      })
  const preferenceLabel = preferenceRank != null ? `${preferenceRank}지망` : undefined
  const companySchoolSchedule = isCompanySchoolProgramType(meta?.programType)
  const companySchoolPeriodUnitLabel = companySchoolSchedule
    ? resolveCompanySchoolPeriodUnitLabel(item.scheduleId, meta?.preferredScheduleBlocks)
    : undefined
  const rowLabel =
    companySchoolPeriodUnitLabel ??
    (operationalDayView
      ? mappedRowLabel
      : mappedRowLabel !== '-'
        ? mappedRowLabel
        : preferenceLabel ?? mappedRowLabel)
  const heldAt = optionalText(item.startAt ?? undefined) ?? ''
  const endAt = optionalText(item.endAt ?? undefined)
  let progressTimeLabel =
    (optionalText(item.progressTimeLabel)
      ? normalizeScheduleDisplayLabel(item.progressTimeLabel!)
      : undefined) ??
    formatGroupTimes(item.groupTimes) ??
    formatPeriodLabel(item.startAt, item.endAt)
  if (companySchoolSchedule && !/\d{1,2}:\d{2}/.test(progressTimeLabel ?? '')) {
    const fromBlocks = resolveCompanySchoolClockRange(
      item.scheduleId,
      meta?.preferredScheduleBlocks,
    )
    if (fromBlocks) progressTimeLabel = fromBlocks
  }
  // 1사1교 카드 날짜 — 「2026년 4월 3일(금) 9:00 ~ 9:40」. 시각은 progressTimeLabel SSOT.
  const companySchoolDateLabel = companySchoolSchedule
    ? joinEducationScheduleDateAndTime(
        formatDisplayDate(heldAt) || heldAt,
        progressTimeLabel,
      ).trim()
    : ''
  const id =
    item.scheduleId != null ? String(item.scheduleId) : `schedule-${sessionNumber}-${index}`
  const assignmentAllowed =
    meta?.applicationType !== 'INSTRUCTOR' && meta?.applicationType !== 'VOLUNTEER'
  const assignment = assignmentAllowed ? mapAssignment(item.assignment) : undefined
  const availableActions = mapAvailableActions(item.availableActions, meta?.applicationType)
  const assignmentStatus = optionalText(item.assignmentStatus ?? undefined)
  const scheduleStatus = optionalText(item.scheduleStatus)
  const classLabel = optionalText(item.classLabel)
  const organizationName = optionalText(item.organizationName)
  const locationName = optionalText(item.locationName) ?? organizationName
  const team = mapTeamInfo(item.teamRole, item.teamName)
  const attendanceStatus = mapAttendance(item.attendanceStatus)
  const absenceReasonStatus = optionalText(item.absenceReasonStatus)?.toUpperCase()
  const hideAbsenceReason =
    absenceReasonStatus === 'NOT_REQUIRED' ||
    attendanceStatus === 'present' ||
    attendanceStatus === 'late'
  const absenceReason = hideAbsenceReason ? undefined : optionalText(item.absenceReason)
  const durationLabel = operationalDayView
    ? resolveOperationalDayDurationLabel(item.groupTimes, item.scheduleId, meta?.preferredScheduleBlocks)
    : undefined
  const curriculumSessions = operationalDayView
    ? undefined
    : companySchoolSchedule
      ? (mapCompanySchoolPeriodSessions(item.scheduleId, meta?.preferredScheduleBlocks) ??
        mapCurriculumSessions(item.curriculumSessions))
      : mapCurriculumSessions(item.curriculumSessions)

  return {
    id,
    ...(item.scheduleId === null
      ? { scheduleId: null }
      : item.scheduleId != null
        ? { scheduleId: item.scheduleId }
        : {}),
    sessionNumber,
    heldAt,
    ...(endAt ? { endAt } : {}),
    title,
    rowLabel,
    ...(preferenceRank != null ? { preferenceRank } : {}),
    ...(operationalDayView ? { operationalDayView: true } : {}),
    ...(companySchoolDateLabel ? { dateLabelOverride: companySchoolDateLabel } : {}),
    ...(durationLabel ? { durationLabel } : {}),
    attendanceStatus,
    ...(absenceReason ? { absenceReason } : {}),
    ...(absenceReasonStatus ? { absenceReasonStatus } : {}),
    ...(sessionLabel ? { sessionLabel } : {}),
    ...(scheduleLabel ? { scheduleLabel } : {}),
    ...(optionalText(item.content) ? { content: item.content!.trim() } : {}),
    ...(curriculumSessions ? { curriculumSessions } : {}),
    ...(progressTimeLabel ? { progressTimeLabel } : {}),
    ...(assignment ? { assignment } : {}),
    ...(availableActions ? { availableActions } : {}),
    ...(assignmentStatus ? { assignmentStatus } : {}),
    ...(scheduleStatus ? { scheduleStatus } : {}),
    ...(classLabel ? { classLabel } : {}),
    ...(locationName ? { locationName } : {}),
    ...(organizationName ? { organizationName } : {}),
    ...(team ? { team } : {}),
  }
}
