/**
 * 참여 봉사자 상세 — 봉사 배정 현황 탭 (일반 프로그램 · 개인) mock
 */

import type { ParticipatingVolunteerRow } from '@/data/mock/participating-volunteers'
import type { ParticipatingSchoolSession } from '@/data/mock/participating-schools'
import {
  countLectureSlotAssignments,
  getApprovedInstitutionLectureScheduleSlots,
  type InstructorLectureAssignSlot,
} from '@/features/program/general/lib/instructor-lecture-assign-schedule'
import { formatVolunteerAssignmentScheduleLine } from '@/features/program/general/lib/participating-school-session-display'
import type {
  ParticipatingIndividualVolunteerAssignedScheduleRow,
  ParticipatingIndividualVolunteerWaitingScheduleRow,
} from '@/features/program/general/lib/participating-individual-volunteer-assignment-types'
import {
  buildWaitingInstructorScheduleSlotKey,
  resolveWaitingInstructorAssignmentStatus,
  sortWaitingInstructorRowsUnavailableToBottom,
  type WaitingInstructorHopeSchedule,
} from '@/features/program/general/lib/waiting-instructor-assignment'
import type { Program } from '@/types/domain'

type AssignedDef = {
  id: string
  slotKey: string
  dateKey: string
  timeRange?: string
  sessionRound: number
  sessionName?: string
}

type WaitingDef = {
  id: string
  slotKey: string
  dateKey: string
  timeRange?: string
  sessionRound: number
  sessionName?: string
  forceUnavailable?: boolean
  assignedVolunteerCount?: number
}

const DEFAULT_ASSIGNED_DEFS: AssignedDef[] = [
  {
    id: 'iv-as-2',
    slotKey: '2026-01-09|individual-program|2',
    dateKey: '2026-01-09',
    timeRange: '09:20 ~ 11:20',
    sessionRound: 2,
    sessionName: '2회차',
  },
  {
    id: 'iv-as-1',
    slotKey: '2026-01-16|individual-program|2',
    dateKey: '2026-01-16',
    timeRange: '09:30 ~ 11:30',
    sessionRound: 2,
    sessionName: '2회차',
  },
]

const DEFAULT_WAITING_DEFS: WaitingDef[] = [
  {
    id: 'iv-w-3',
    slotKey: '2026-01-09|individual-program|1',
    dateKey: '2026-01-09',
    timeRange: '09:20 ~ 11:20',
    sessionRound: 1,
    sessionName: '1회차',
    assignedVolunteerCount: 4,
  },
  {
    id: 'iv-w-2',
    slotKey: '2026-01-09|individual-program|2',
    dateKey: '2026-01-09',
    timeRange: '09:20 ~ 11:20',
    sessionRound: 2,
    sessionName: '2회차',
    assignedVolunteerCount: 4,
  },
  {
    id: 'iv-w-1',
    slotKey: '2026-01-16|individual-program|1',
    dateKey: '2026-01-16',
    sessionRound: 1,
    sessionName: '1회차',
    forceUnavailable: true,
    assignedVolunteerCount: 1,
  },
]

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i)
  return Math.abs(h)
}

function formatHopeDate(dateKey: string): string {
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][
    new Date(`${dateKey}T12:00:00`).getDay()
  ]
  const [y, m, d] = dateKey.split('-')
  return `${y!.slice(-2)}.${m}.${d}(${weekday})`
}

function sessionFromDef(def: {
  dateKey: string
  timeRange?: string
  sessionRound: number
}): ParticipatingSchoolSession {
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][
    new Date(`${def.dateKey}T12:00:00`).getDay()
  ]
  const [y, m, d] = def.dateKey.split('-')
  const timeRange = def.timeRange?.replace(/\s*~\s*/g, '~') ?? ''
  return {
    round: def.sessionRound,
    date: `${y}.${m}.${d}`,
    dayOfWeek: weekday,
    duration: '2시간',
    format: '오프라인',
    classNum: `${def.sessionRound}교시`,
    timeRange,
    status: 'pending',
  }
}

function slotToSession(slot: InstructorLectureAssignSlot): ParticipatingSchoolSession {
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][
    new Date(`${slot.dateKey}T12:00:00`).getDay()
  ]
  const [y, m, d] = slot.dateKey.split('-')
  return {
    round: slot.sessionRound,
    date: `${y}.${m}.${d}`,
    dayOfWeek: weekday,
    duration: '2시간',
    format: '오프라인',
    classNum: `${slot.sessionRound}교시`,
    timeRange: slot.timeRange.replace(/\s*~\s*/g, '~'),
    status: 'pending',
  }
}

function scheduleLabelFromDef(
  program: Program,
  def: { dateKey: string; timeRange?: string; sessionRound: number }
): string {
  return formatVolunteerAssignmentScheduleLine(sessionFromDef(def), program)
}

function slotToHopeSchedule(slot: InstructorLectureAssignSlot): WaitingInstructorHopeSchedule {
  const session = slotToSession(slot)
  const datePart = `${session.date}(${session.dayOfWeek})`
  const timeRange = slot.timeRange?.trim()
  return {
    hopeDate: datePart,
    hopeTime: timeRange ?? '',
    hopeSession: slot.sessionLabel,
  }
}

export function buildOccupiedVolunteerHopeSlotKeys(
  assignedRows: ParticipatingIndividualVolunteerAssignedScheduleRow[]
): Set<string> {
  const occupied = new Set<string>()
  for (const row of assignedRows) {
    const [dateKey, , sessionRoundRaw] = row.slotKey.split('|')
    if (!dateKey) continue
    const sessionRound = Number.parseInt(sessionRoundRaw ?? '1', 10) || 1
    const timeMatch = row.scheduleLabel.match(/(\d{2}:\d{2}\s*~\s*\d{2}:\d{2})/)
    const hopeSchedule: WaitingInstructorHopeSchedule = {
      hopeDate: formatHopeDate(dateKey),
      hopeTime: timeMatch?.[1] ?? '',
      hopeSession: `${sessionRound}회차`,
    }
    occupied.add(buildWaitingInstructorScheduleSlotKey(hopeSchedule))
  }
  return occupied
}

function volunteerCountLabel(slotKey: string, overrideCount?: number): string {
  if (overrideCount != null) return `${overrideCount}명`
  const count = countLectureSlotAssignments(slotKey, [])
  return `${count > 0 ? count : 1 + (hash(slotKey) % 4)}명`
}

function buildAssignedRowFromDef(
  def: AssignedDef,
  no: number,
  program: Program
): ParticipatingIndividualVolunteerAssignedScheduleRow {
  return {
    id: def.id,
    no,
    slotKey: def.slotKey,
    scheduleLabel: scheduleLabelFromDef(program, def),
  }
}

function buildWaitingRowFromDef(
  def: WaitingDef,
  no: number,
  program: Program,
  occupiedHopeSlots: Set<string>
): ParticipatingIndividualVolunteerWaitingScheduleRow {
  const hopeSchedule: WaitingInstructorHopeSchedule = {
    hopeDate: formatHopeDate(def.dateKey),
    hopeTime: def.timeRange ?? '',
    hopeSession: def.sessionName ?? `${def.sessionRound}회차`,
  }

  const assignmentStatus = def.forceUnavailable
    ? 'unavailable'
    : resolveWaitingInstructorAssignmentStatus(hopeSchedule, occupiedHopeSlots)

  return {
    id: def.id,
    no,
    slotKey: def.slotKey,
    scheduleLabel: scheduleLabelFromDef(program, def),
    hopeSchedule,
    assignmentStatus,
    assignedVolunteerCountLabel: volunteerCountLabel(def.slotKey, def.assignedVolunteerCount),
  }
}

function buildAssignedFromVolunteerSessions(
  volunteer: ParticipatingVolunteerRow,
  program: Program
): ParticipatingIndividualVolunteerAssignedScheduleRow[] {
  const sessions = volunteer.sessions ?? []
  if (sessions.length === 0) return []

  return sessions.map((session, idx) => ({
    id: `iv-vol-as-${session.date}-${session.round}-${idx}`,
    no: sessions.length - idx,
    slotKey: `${session.date.replace(/\./g, '-')}|individual-program|${session.round}`,
    scheduleLabel: formatVolunteerAssignmentScheduleLine(session, program),
  }))
}

function buildAssignedFromProgramSlots(
  program: Program,
  volunteer: ParticipatingVolunteerRow
): ParticipatingIndividualVolunteerAssignedScheduleRow[] {
  const slots = getApprovedInstitutionLectureScheduleSlots(String(program.id))
  if (slots.length === 0) return []

  const picked = [...slots]
    .sort((a, b) => hash(a.key + volunteer.id) - hash(b.key + volunteer.id))
    .slice(0, 2)

  return picked.map((slot, idx) => ({
    id: `iv-program-as-${slot.key}`,
    no: picked.length - idx,
    slotKey: slot.key,
    scheduleLabel: formatVolunteerAssignmentScheduleLine(slotToSession(slot), program),
  }))
}

function buildWaitingFromProgramSlots(
  program: Program,
  _volunteer: ParticipatingVolunteerRow,
  assignedSlotKeys: Set<string>,
  occupiedHopeSlots: Set<string>
): ParticipatingIndividualVolunteerWaitingScheduleRow[] {
  const slots = getApprovedInstitutionLectureScheduleSlots(String(program.id))
  const candidates = slots.filter(slot => !assignedSlotKeys.has(slot.key))
  if (candidates.length === 0) return []

  const expanded = candidates.map(slot => {
    const hopeSchedule = slotToHopeSchedule(slot)
    const forceUnavailable =
      resolveWaitingInstructorAssignmentStatus(hopeSchedule, occupiedHopeSlots) === 'unavailable'
    return buildWaitingRowFromDef(
      {
        id: `iv-program-w-${slot.key}`,
        slotKey: slot.key,
        dateKey: slot.dateKey,
        timeRange: slot.timeRange,
        sessionRound: slot.sessionRound,
        sessionName: slot.sessionLabel,
        forceUnavailable,
        assignedVolunteerCount: countLectureSlotAssignments(slot.key, []),
      },
      0,
      program,
      occupiedHopeSlots
    )
  })

  const n = expanded.length
  return sortWaitingInstructorRowsUnavailableToBottom(
    expanded.map((row, idx) => ({ ...row, no: n - idx }))
  )
}

export function buildInitialIndividualVolunteerAssignedScheduleRows(
  volunteer: ParticipatingVolunteerRow,
  program: Program
): ParticipatingIndividualVolunteerAssignedScheduleRow[] {
  const fromVolunteer = buildAssignedFromVolunteerSessions(volunteer, program)
  if (fromVolunteer.length > 0) return fromVolunteer

  const fromProgram = buildAssignedFromProgramSlots(program, volunteer)
  if (fromProgram.length > 0) return fromProgram

  const n = DEFAULT_ASSIGNED_DEFS.length
  return DEFAULT_ASSIGNED_DEFS.map((def, idx) => buildAssignedRowFromDef(def, n - idx, program))
}

export function buildIndividualVolunteerWaitingScheduleRows(
  volunteer: ParticipatingVolunteerRow,
  program: Program,
  assignedRows: ParticipatingIndividualVolunteerAssignedScheduleRow[]
): ParticipatingIndividualVolunteerWaitingScheduleRow[] {
  const assignedSlotKeys = new Set(assignedRows.map(r => r.slotKey))
  const occupiedHopeSlots = buildOccupiedVolunteerHopeSlotKeys(assignedRows)

  const fromProgram = buildWaitingFromProgramSlots(
    program,
    volunteer,
    assignedSlotKeys,
    occupiedHopeSlots
  )
  if (fromProgram.length > 0) return fromProgram

  const filtered = DEFAULT_WAITING_DEFS.filter(def => !assignedSlotKeys.has(def.slotKey))
  const n = filtered.length
  return sortWaitingInstructorRowsUnavailableToBottom(
    filtered.map((def, idx) => buildWaitingRowFromDef(def, n - idx, program, occupiedHopeSlots))
  )
}

export function individualVolunteerWaitingRowToAssignedRow(
  waitingRow: ParticipatingIndividualVolunteerWaitingScheduleRow,
  no: number
): ParticipatingIndividualVolunteerAssignedScheduleRow {
  return {
    id: `iv-as-${waitingRow.slotKey}`,
    no,
    slotKey: waitingRow.slotKey,
    scheduleLabel: waitingRow.scheduleLabel,
  }
}

export function createIndividualVolunteerWaitingRowFromAssigned(
  assignedRow: ParticipatingIndividualVolunteerAssignedScheduleRow,
  no: number,
  occupiedHopeSlots: Set<string>
): ParticipatingIndividualVolunteerWaitingScheduleRow {
  const [dateKey, , sessionRoundRaw] = assignedRow.slotKey.split('|')
  const sessionRound = Number.parseInt(sessionRoundRaw ?? '1', 10) || 1
  const timeMatch = assignedRow.scheduleLabel.match(/(\d{2}:\d{2}\s*~\s*\d{2}:\d{2})/)
  const hopeSchedule: WaitingInstructorHopeSchedule = {
    hopeDate: dateKey ? formatHopeDate(dateKey) : '',
    hopeTime: timeMatch?.[1] ?? '',
    hopeSession: `${sessionRound}회차`,
  }

  return {
    id: `iv-w-back-${assignedRow.slotKey}`,
    no,
    slotKey: assignedRow.slotKey,
    scheduleLabel: assignedRow.scheduleLabel,
    hopeSchedule,
    assignmentStatus: resolveWaitingInstructorAssignmentStatus(hopeSchedule, occupiedHopeSlots),
    assignedVolunteerCountLabel: volunteerCountLabel(assignedRow.slotKey),
  }
}

export function renumberIndividualVolunteerAssignedScheduleRows(
  rows: ParticipatingIndividualVolunteerAssignedScheduleRow[]
): ParticipatingIndividualVolunteerAssignedScheduleRow[] {
  const n = rows.length
  return rows.map((r, i) => ({ ...r, no: n - i }))
}

export function renumberIndividualVolunteerWaitingScheduleRows(
  rows: ParticipatingIndividualVolunteerWaitingScheduleRow[]
): ParticipatingIndividualVolunteerWaitingScheduleRow[] {
  const sorted = sortWaitingInstructorRowsUnavailableToBottom(rows)
  const n = sorted.length
  return sorted.map((r, i) => ({ ...r, no: n - i }))
}
