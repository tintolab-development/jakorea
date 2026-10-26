import type {
  PortalEducationSchedule,
  PortalEducationScheduleAssignment,
  PortalEducationScheduleGroupTime,
  PortalEducationStructure,
  PortalSessionRound,
} from '../../applications/api/activity-client'
import type { ProgramApplicationType } from '../../applications/api/types'
import {
  resolveEducationScheduleCommonInfoLabel,
  resolveEducationScheduleRowLabel,
} from './common-info-label.ts'
import {
  stripDefaultEducationSlotNameFromLabel,
  toDisplayEducationScheduleName,
} from '../../../../../shared/lib/education-schedule-name.ts'
import {
  formatDisplayDateTimeRange,
  normalizeScheduleDisplayLabel,
} from '@/shared/lib/format-display-date'
import type {
  EducationAssignmentSubmitStatus,
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
  return {
    roleLabel: TEAM_ROLE_LABEL[role] ?? role,
    teamName: optionalText(teamName ?? undefined) ?? '-',
  }
}

function optionalText(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function mapAvailableActions(values: readonly string[] | undefined): string[] | undefined {
  const actions = (values ?? [])
    .map(value => value.trim().toUpperCase())
    .filter(value => value.length > 0)
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
  return {
    submitStartAt,
    submitEndAt,
    periodLabel,
    status: mapAssignmentStatus(assignment.status),
    ...(typeof assignment.canSubmit === 'boolean' ? { canSubmit: assignment.canSubmit } : {}),
    ...(typeof assignment.canResubmit === 'boolean'
      ? { canResubmit: assignment.canResubmit }
      : {}),
    ...(assignment.formResponseId != null ? { formResponseId: assignment.formResponseId } : {}),
    ...(files ? { files } : {}),
  }
}

export type MapPortalEducationScheduleMeta = {
  educationStructure?: PortalEducationStructure | null
  sessionRound?: PortalSessionRound | null
  applicationType?: ProgramApplicationType | null
}

/**
 * 신청 GET .../schedules → 교육일정 탭 행.
 * startAt이 없어도 매핑은 유지한다. ASSIGNMENT_SCOPED 화면은 scheduleId 있는 배정만 노출한다.
 * assignment.enabled가 true가 아니면 과제 블록 omit.
 * 카드 청록 라벨은 공통정보(차시/단원명/일정명)만 쓴다.
 */
export function mapPortalEducationSchedule(
  item: PortalEducationSchedule,
  index: number,
  meta?: MapPortalEducationScheduleMeta,
): EducationScheduleItem {
  const sessionNumber = item.sessionNo ?? index + 1
  // 백엔드 자동 기본명(`공통 교육 예정 N`)은 회차·일정 라벨로 쓰지 않는다.
  const sessionLabel = toDisplayEducationScheduleName(item.sessionLabel)
  const scheduleLabel = optionalText(stripDefaultEducationSlotNameFromLabel(item.scheduleLabel))
  const title = resolveEducationScheduleCommonInfoLabel({
    educationStructure: meta?.educationStructure,
    sessionRound: meta?.sessionRound,
    unitName: item.unitName,
    scheduleName: item.scheduleName,
    title: item.title,
    sessionLabel: item.sessionLabel,
  })
  const rowLabel = resolveEducationScheduleRowLabel({
    educationStructure: meta?.educationStructure,
    sessionLabel: item.sessionLabel,
    scheduleName: item.scheduleName,
  })
  const heldAt = optionalText(item.startAt ?? undefined) ?? ''
  const progressTimeLabel =
    (optionalText(item.progressTimeLabel)
      ? normalizeScheduleDisplayLabel(item.progressTimeLabel!)
      : undefined) ??
    formatGroupTimes(item.groupTimes) ??
    formatPeriodLabel(item.startAt, item.endAt)
  const id =
    item.scheduleId != null ? String(item.scheduleId) : `schedule-${sessionNumber}-${index}`
  const assignmentAllowed =
    meta?.applicationType !== 'INSTRUCTOR' && meta?.applicationType !== 'VOLUNTEER'
  const assignment = assignmentAllowed ? mapAssignment(item.assignment) : undefined
  const availableActions = mapAvailableActions(item.availableActions)
  const assignmentStatus = optionalText(item.assignmentStatus ?? undefined)
  const scheduleStatus = optionalText(item.scheduleStatus)
  const classLabel = optionalText(item.classLabel)
  const locationName = optionalText(item.locationName)
  const team = mapTeamInfo(item.teamRole, item.teamName)

  return {
    id,
    ...(item.scheduleId === null
      ? { scheduleId: null }
      : item.scheduleId != null
        ? { scheduleId: item.scheduleId }
        : {}),
    sessionNumber,
    heldAt,
    title,
    rowLabel,
    attendanceStatus: mapAttendance(item.attendanceStatus),
    ...(optionalText(item.absenceReason) ? { absenceReason: item.absenceReason!.trim() } : {}),
    ...(sessionLabel ? { sessionLabel } : {}),
    ...(scheduleLabel ? { scheduleLabel } : {}),
    ...(optionalText(item.content) ? { content: item.content!.trim() } : {}),
    ...(progressTimeLabel ? { progressTimeLabel } : {}),
    ...(assignment ? { assignment } : {}),
    ...(availableActions ? { availableActions } : {}),
    ...(assignmentStatus ? { assignmentStatus } : {}),
    ...(scheduleStatus ? { scheduleStatus } : {}),
    ...(classLabel ? { classLabel } : {}),
    ...(locationName ? { locationName } : {}),
    ...(team ? { team } : {}),
  }
}
