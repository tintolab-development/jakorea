import type {
  PortalAttendanceParticipant,
  PortalAttendanceParticipantList,
  PortalScheduleAttendanceDetail,
} from '../../../education/applications/api/activity-client'
import type { EducationScheduleAttendanceStatus } from '../../../education/schedules/model/types'
import { formatUjatAssignmentStatusLabel } from './history.ts'

export type UjatScheduleAttendanceDetailView = {
  attendanceStatus: EducationScheduleAttendanceStatus | null
  attendanceLabel: string
  classLabel: string
  assignmentStatus: string
  assignmentStatusLabel: string
  canCheckIn: boolean
  absenceReason: string
  locationName: string
}

export type UjatAttendanceRosterVolunteer = {
  name: string
  attendanceLabel: string
  attendanceTone: 'default' | 'absent'
}

export type UjatAttendanceRosterRow = {
  key: string
  gradeLabel: string
  gradeRowSpan: number
  showGrade: boolean
  classLabel: string
  volunteerA: UjatAttendanceRosterVolunteer
  volunteerB: UjatAttendanceRosterVolunteer
}

export type UjatAttendanceRosterView = {
  managerName: string
  classCountLabel: string
  rows: UjatAttendanceRosterRow[]
}

const GRADE_CLASS_RE = /(\d+)\s*학년(?:\s*(.+))?/

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
    case 'EXCUSED_ABSENCE':
      return 'excused'
    default:
      return null
  }
}

function displayText(value: string | null | undefined): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '-'
}

function attendanceLabel(status: EducationScheduleAttendanceStatus | null): string {
  if (status === 'present') return '출석'
  if (status === 'late') return '지각'
  if (status === 'absent') return '결석'
  if (status === 'excused') return '사유 불참'
  return '-'
}

export function mapPortalScheduleAttendanceDetail(
  detail: PortalScheduleAttendanceDetail,
): UjatScheduleAttendanceDetailView {
  const attendanceStatus = mapAttendance(detail.attendanceStatus)
  const assignmentStatus = displayText(detail.assignmentStatus)
  const absenceReasonStatus = (detail.absenceReasonStatus ?? '').trim().toUpperCase()
  const hideAbsenceReason =
    absenceReasonStatus === 'NOT_REQUIRED' ||
    attendanceStatus === 'present' ||
    attendanceStatus === 'late'
  return {
    attendanceStatus,
    attendanceLabel: attendanceLabel(attendanceStatus),
    classLabel: displayText(detail.classLabel),
    assignmentStatus,
    assignmentStatusLabel: formatUjatAssignmentStatusLabel(detail.assignmentStatus),
    canCheckIn: detail.canCheckIn === true,
    absenceReason: hideAbsenceReason ? '-' : displayText(detail.absenceReason ?? undefined),
    locationName: displayText(detail.locationName ?? detail.organizationName),
  }
}

function volunteerSlot(role: string | null | undefined): 'A' | 'B' | null {
  const normalized = (role ?? '').trim().toUpperCase()
  if (!normalized) return null
  if (
    normalized === 'A' ||
    normalized === '1' ||
    normalized === 'PRIMARY' ||
    normalized === 'MAIN' ||
    normalized === 'FIRST' ||
    normalized === 'VOLUNTEER_A' ||
    normalized.endsWith('_A')
  ) {
    return 'A'
  }
  if (
    normalized === 'B' ||
    normalized === '2' ||
    normalized === 'SECONDARY' ||
    normalized === 'SUB' ||
    normalized === 'SECOND' ||
    normalized === 'PARTNER' ||
    normalized === 'VOLUNTEER_B' ||
    normalized.endsWith('_B')
  ) {
    return 'B'
  }
  return null
}

function parseClassParts(classLabel: string | null | undefined): {
  gradeKey: number
  gradeLabel: string
  classLabel: string
} {
  const trimmed = classLabel?.trim() ?? ''
  if (!trimmed) {
    return { gradeKey: Number.POSITIVE_INFINITY, gradeLabel: '-', classLabel: '-' }
  }
  const match = GRADE_CLASS_RE.exec(trimmed)
  if (!match) {
    return { gradeKey: Number.POSITIVE_INFINITY, gradeLabel: '-', classLabel: trimmed }
  }
  const gradeNumber = Number(match[1])
  const rest = match[2]?.trim()
  return {
    gradeKey: Number.isFinite(gradeNumber) ? gradeNumber : Number.POSITIVE_INFINITY,
    gradeLabel: `${gradeNumber}학년`,
    classLabel: rest || '-',
  }
}

function emptyVolunteer(): UjatAttendanceRosterVolunteer {
  return { name: '-', attendanceLabel: '-', attendanceTone: 'default' }
}

function mapVolunteer(peer: PortalAttendanceParticipant | undefined): UjatAttendanceRosterVolunteer {
  if (!peer) return emptyVolunteer()
  const status = mapAttendance(peer.attendanceStatus)
  return {
    name: displayText(peer.memberName),
    attendanceLabel: attendanceLabel(status),
    attendanceTone: status === 'absent' ? 'absent' : 'default',
  }
}

function groupKey(peer: PortalAttendanceParticipant): string {
  if (peer.organizationApplicationId != null) {
    return `org:${peer.organizationApplicationId}`
  }
  const parts = parseClassParts(peer.classLabel)
  return `class:${parts.gradeLabel}|${parts.classLabel}|${displayText(peer.organizationName)}`
}

function assignPair(
  peers: readonly PortalAttendanceParticipant[],
): {
  volunteerA: PortalAttendanceParticipant | undefined
  volunteerB: PortalAttendanceParticipant | undefined
} {
  const sorted = [...peers].sort((left, right) => (left.participantId ?? 0) - (right.participantId ?? 0))
  let volunteerA: PortalAttendanceParticipant | undefined
  let volunteerB: PortalAttendanceParticipant | undefined
  const unslotted: PortalAttendanceParticipant[] = []

  for (const peer of sorted) {
    const slot = volunteerSlot(peer.assignmentRole)
    if (slot === 'A' && volunteerA == null) {
      volunteerA = peer
      continue
    }
    if (slot === 'B' && volunteerB == null) {
      volunteerB = peer
      continue
    }
    unslotted.push(peer)
  }

  for (const peer of unslotted) {
    if (volunteerA == null) {
      volunteerA = peer
      continue
    }
    if (volunteerB == null) {
      volunteerB = peer
    }
  }

  return { volunteerA, volunteerB }
}

export function mapPortalAttendanceParticipantList(
  list: PortalAttendanceParticipantList | null | undefined,
): UjatAttendanceRosterView {
  const items = list?.items ?? []
  const groups = new Map<string, PortalAttendanceParticipant[]>()
  for (const item of items) {
    const key = groupKey(item)
    const current = groups.get(key) ?? []
    current.push(item)
    groups.set(key, current)
  }

  const grouped = [...groups.entries()]
    .map(([key, peers]) => {
      const representative = peers[0]
      const parts = parseClassParts(representative?.classLabel)
      return {
        key,
        gradeKey: parts.gradeKey,
        gradeLabel: parts.gradeLabel,
        classLabel: parts.classLabel,
        peers,
      }
    })
    .sort((left, right) => {
      if (left.gradeKey !== right.gradeKey) return left.gradeKey - right.gradeKey
      return left.classLabel.localeCompare(right.classLabel, 'ko')
    })

  const rows: UjatAttendanceRosterRow[] = grouped.map((group, index) => {
    const pair = assignPair(group.peers)
    const gradeRowSpan = grouped.filter(item => item.gradeLabel === group.gradeLabel).length
    const showGrade = index === 0 || grouped[index - 1]?.gradeLabel !== group.gradeLabel
    return {
      key: group.key,
      gradeLabel: group.gradeLabel,
      gradeRowSpan,
      showGrade,
      classLabel: group.classLabel,
      volunteerA: mapVolunteer(pair.volunteerA),
      volunteerB: mapVolunteer(pair.volunteerB),
    }
  })

  const manager = items.find(item => item.attendanceManager === true)
  const classCount = grouped.length

  return {
    managerName: displayText(manager?.memberName),
    classCountLabel: classCount > 0 ? `총 ${classCount}학급` : '-',
    rows,
  }
}

export function joinSchedulePlaceLabel(
  ...parts: Array<string | null | undefined>
): string {
  const values = parts.map(part => part?.trim()).filter((part): part is string => Boolean(part))
  return values.length > 0 ? values.join(' ') : '-'
}
