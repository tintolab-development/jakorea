/**
 * 참여 강사 상세 — 교육 배정 현황 탭 (일반 프로그램 · 개인) mock
 */

import type { ParticipatingInstructorRow } from '@/data/mock/participating-instructors'
import type { InstructorRoleKey } from '@/features/program/general/model/school-detail-types'
import {
  countLectureSlotAssignments,
  getApprovedInstitutionLectureScheduleSlots,
  type InstructorLectureAssignSlot,
} from '@/features/program/general/lib/instructor-lecture-assign-schedule'
import {
  buildWaitingInstructorScheduleSlotKey,
  resolveWaitingInstructorAssignmentStatus,
  sortWaitingInstructorRowsUnavailableToBottom,
  type WaitingInstructorHopeSchedule,
} from '@/features/program/general/lib/waiting-instructor-assignment'
import {
  formatIndividualInstructorAssignmentScheduleLabel,
  formatIndividualInstructorLectureLocation,
} from '@/features/program/general/lib/participating-individual-instructor-assignment-display'
import type {
  ParticipatingIndividualInstructorAssignedScheduleRow,
  ParticipatingIndividualInstructorWaitingScheduleRow,
} from '@/features/program/general/lib/participating-individual-instructor-assignment-types'
import type { Program } from '@/types/domain'

const ASSIGNED_DISTANCES = ['3km', '5km', '7km', '4km', '6km', '8km', '12km']
const WAITING_DISTANCES = ['2km', '4km', '6km', '5km', '7km', '32km', '12km']

type AssignedDef = {
  id: string
  slotKey: string
  schoolId: string
  region: string
  distanceFromHome: string
  dateKey: string
  timeRange: string
  sessionRound: number
  sessionName?: string
  role: InstructorRoleKey
}

type WaitingDef = {
  id: string
  slotKey: string
  schoolId: string
  region: string
  distanceFromHome: string
  dateKey: string
  timeRange: string
  sessionRound: number
  sessionName?: string
  forceUnavailable?: boolean
  assignedInstructorCount?: number
}

const DEFAULT_ASSIGNED_DEFS: AssignedDef[] = [
  {
    id: 'ia-as-3',
    slotKey: '2026-01-09|assign-school-gangseo|2',
    schoolId: 'assign-school-gangseo',
    region: '서울특별시 강서구 화곡동 3394-23',
    distanceFromHome: '5km',
    dateKey: '2026-01-09',
    timeRange: '09:20 ~ 11:20',
    sessionRound: 2,
    sessionName: '2회차',
    role: 'lead',
  },
  {
    id: 'ia-as-2',
    slotKey: '2026-01-09|assign-school-gangseo|1',
    schoolId: 'assign-school-gangseo',
    region: '서울특별시 강서구 화곡동 3394-23',
    distanceFromHome: '12km',
    dateKey: '2026-01-09',
    timeRange: '09:20 ~ 11:20',
    sessionRound: 1,
    sessionName: '1회차',
    role: 'assistant',
  },
  {
    id: 'ia-as-1',
    slotKey: '2026-01-16|assign-school-gangseo|2',
    schoolId: 'assign-school-gangseo',
    region: '서울특별시 강서구 화곡동 3394-23',
    distanceFromHome: '5km',
    dateKey: '2026-01-16',
    timeRange: '09:20 ~ 11:20',
    sessionRound: 2,
    sessionName: '2회차',
    role: 'assistant',
  },
]

const DEFAULT_WAITING_DEFS: WaitingDef[] = [
  {
    id: 'ia-w-5',
    slotKey: '2026-01-09|assign-school-1|1',
    schoolId: 'assign-school-1',
    region: '서울특별시 양천구 목동 123-45',
    distanceFromHome: '32km',
    dateKey: '2026-01-09',
    timeRange: '09:20 ~ 11:20',
    sessionRound: 1,
    sessionName: '1회차',
    assignedInstructorCount: 4,
  },
  {
    id: 'ia-w-4',
    slotKey: '2026-01-09|assign-school-2|1',
    schoolId: 'assign-school-2',
    region: '서울특별시 양천구 신월동 456-78',
    distanceFromHome: '32km',
    dateKey: '2026-01-09',
    timeRange: '09:20 ~ 11:20',
    sessionRound: 1,
    sessionName: '1회차',
    assignedInstructorCount: 4,
  },
  {
    id: 'ia-w-3',
    slotKey: '2026-01-09|assign-school-3|1',
    schoolId: 'assign-school-3',
    region: '서울특별시 양천구 신정동 789-01',
    distanceFromHome: '32km',
    dateKey: '2026-01-09',
    timeRange: '09:20 ~ 11:20',
    sessionRound: 1,
    sessionName: '1회차',
    assignedInstructorCount: 4,
  },
  {
    id: 'ia-w-2',
    slotKey: '2026-01-09|assign-school-4|1',
    schoolId: 'assign-school-4',
    region: '서울특별시 양천구 신정동 234-56',
    distanceFromHome: '32km',
    dateKey: '2026-01-09',
    timeRange: '09:20 ~ 11:20',
    sessionRound: 1,
    sessionName: '1회차',
    forceUnavailable: true,
    assignedInstructorCount: 1,
  },
  {
    id: 'ia-w-1',
    slotKey: '2026-01-16|assign-school-1|1',
    schoolId: 'assign-school-1',
    region: '서울특별시 양천구 목동 123-45',
    distanceFromHome: '32km',
    dateKey: '2026-01-16',
    timeRange: '09:20 ~ 11:20',
    sessionRound: 1,
    sessionName: '1회차',
    assignedInstructorCount: 1,
  },
]

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i)
  return Math.abs(h)
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length]
}

function slotToHopeSchedule(slot: InstructorLectureAssignSlot): WaitingInstructorHopeSchedule {
  const datePart = slot.dateKey.replace(/^(\d{4})-(\d{2})-(\d{2})$/, (_, y, m, d) => {
    const date = `${y.slice(-2)}.${m}.${d}`
    const weekday = ['일', '월', '화', '수', '목', '금', '토'][
      new Date(`${y}-${m}-${d}T12:00:00`).getDay()
    ]
    return `${date}(${weekday})`
  })
  return {
    hopeDate: datePart,
    hopeTime: slot.timeRange,
    hopeSession: slot.sessionLabel,
  }
}

function formatHopeDate(dateKey: string): string {
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][
    new Date(`${dateKey}T12:00:00`).getDay()
  ]
  const [y, m, d] = dateKey.split('-')
  return `${y!.slice(-2)}.${m}.${d}(${weekday})`
}

export function buildOccupiedHopeSlotKeys(
  assignedRows: ParticipatingIndividualInstructorAssignedScheduleRow[]
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

function instructorCountLabel(
  slotKey: string,
  overrideCount?: number
): string {
  if (overrideCount != null) return `${overrideCount}명`
  const count = countLectureSlotAssignments(slotKey, [])
  return `${count > 0 ? count : 1 + (hash(slotKey) % 4)}명`
}

function buildAssignedRowFromDef(
  def: AssignedDef,
  no: number,
  program: Program
): ParticipatingIndividualInstructorAssignedScheduleRow {
  return {
    id: def.id,
    no,
    role: def.role,
    slotKey: def.slotKey,
    schoolId: def.schoolId,
    lectureLocation: formatIndividualInstructorLectureLocation(def.region),
    distanceFromHome: def.distanceFromHome,
    scheduleLabel: formatIndividualInstructorAssignmentScheduleLabel(program, {
      dateKey: def.dateKey,
      timeRange: def.timeRange,
      sessionRound: def.sessionRound,
      sessionName: def.sessionName,
    }),
  }
}

function buildWaitingRowFromDef(
  def: WaitingDef,
  no: number,
  program: Program,
  occupiedHopeSlots: Set<string>
): ParticipatingIndividualInstructorWaitingScheduleRow {
  const hopeSchedule: WaitingInstructorHopeSchedule = {
    hopeDate: formatHopeDate(def.dateKey),
    hopeTime: def.timeRange,
    hopeSession: def.sessionName ?? `${def.sessionRound}회차`,
  }

  const assignmentStatus = def.forceUnavailable
    ? 'unavailable'
    : resolveWaitingInstructorAssignmentStatus(hopeSchedule, occupiedHopeSlots)

  return {
    id: def.id,
    no,
    slotKey: def.slotKey,
    schoolId: def.schoolId,
    lectureLocation: formatIndividualInstructorLectureLocation(def.region),
    distanceFromHome: def.distanceFromHome,
    scheduleLabel: formatIndividualInstructorAssignmentScheduleLabel(program, {
      dateKey: def.dateKey,
      timeRange: def.timeRange,
      sessionRound: def.sessionRound,
      sessionName: def.sessionName,
    }),
    assignmentStatus,
    assignedInstructorCountLabel: instructorCountLabel(def.slotKey, def.assignedInstructorCount),
  }
}

function buildAssignedFromProgramSlots(
  program: Program,
  instructor: ParticipatingInstructorRow
): ParticipatingIndividualInstructorAssignedScheduleRow[] {
  const slots = getApprovedInstitutionLectureScheduleSlots(String(program.id))
  if (slots.length === 0) return []

  const picked = [...slots].sort((a, b) => hash(a.key + instructor.id) - hash(b.key + instructor.id)).slice(0, 3)

  return picked.map((slot, idx) => {
    const rowSeed = hash(slot.key + instructor.id)
    return buildAssignedRowFromDef(
      {
        id: `ia-program-as-${slot.key}`,
        slotKey: slot.key,
        schoolId: slot.schoolId,
        region: slot.region || slot.schoolName,
        distanceFromHome: pick(ASSIGNED_DISTANCES, rowSeed + idx),
        dateKey: slot.dateKey,
        timeRange: slot.timeRange,
        sessionRound: slot.sessionRound,
        sessionName: slot.sessionLabel,
        role: idx === 0 ? 'lead' : 'assistant',
      },
      picked.length - idx,
      program
    )
  })
}

function buildWaitingFromProgramSlots(
  program: Program,
  instructor: ParticipatingInstructorRow,
  assignedSlotKeys: Set<string>,
  occupiedHopeSlots: Set<string>
): ParticipatingIndividualInstructorWaitingScheduleRow[] {
  const slots = getApprovedInstitutionLectureScheduleSlots(String(program.id))
  const candidates = slots.filter(slot => !assignedSlotKeys.has(slot.key))
  if (candidates.length === 0) return []

  const expanded = candidates.map((slot, idx) => {
    const rowSeed = hash(slot.key + instructor.id + 'w')
    const hopeSchedule = slotToHopeSchedule(slot)
    return buildWaitingRowFromDef(
      {
        id: `ia-program-w-${slot.key}`,
        slotKey: slot.key,
        schoolId: slot.schoolId,
        region: slot.region || slot.schoolName,
        distanceFromHome: pick(WAITING_DISTANCES, rowSeed + idx),
        dateKey: slot.dateKey,
        timeRange: slot.timeRange,
        sessionRound: slot.sessionRound,
        sessionName: slot.sessionLabel,
        forceUnavailable:
          resolveWaitingInstructorAssignmentStatus(hopeSchedule, occupiedHopeSlots) ===
          'unavailable',
        assignedInstructorCount: countLectureSlotAssignments(slot.key, []),
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

export function buildInitialIndividualInstructorAssignedScheduleRows(
  instructor: ParticipatingInstructorRow,
  program: Program
): ParticipatingIndividualInstructorAssignedScheduleRow[] {
  const fromProgram = buildAssignedFromProgramSlots(program, instructor)
  if (fromProgram.length > 0) return fromProgram

  const n = DEFAULT_ASSIGNED_DEFS.length
  return DEFAULT_ASSIGNED_DEFS.map((def, idx) => buildAssignedRowFromDef(def, n - idx, program))
}

export function buildIndividualInstructorWaitingScheduleRows(
  instructor: ParticipatingInstructorRow,
  program: Program,
  assignedRows: ParticipatingIndividualInstructorAssignedScheduleRow[]
): ParticipatingIndividualInstructorWaitingScheduleRow[] {
  const assignedSlotKeys = new Set(assignedRows.map(r => r.slotKey))
  const occupiedHopeSlots = buildOccupiedHopeSlotKeys(assignedRows)

  const fromProgram = buildWaitingFromProgramSlots(
    program,
    instructor,
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

export function individualWaitingRowToAssignedRow(
  waitingRow: ParticipatingIndividualInstructorWaitingScheduleRow,
  role: InstructorRoleKey,
  no: number,
  _program: Program
): ParticipatingIndividualInstructorAssignedScheduleRow {
  return {
    id: `ia-as-${waitingRow.slotKey}`,
    no,
    role,
    slotKey: waitingRow.slotKey,
    schoolId: waitingRow.schoolId,
    lectureLocation: waitingRow.lectureLocation,
    distanceFromHome: waitingRow.distanceFromHome,
    scheduleLabel: waitingRow.scheduleLabel,
  }
}

export function createIndividualWaitingRowFromAssigned(
  assignedRow: ParticipatingIndividualInstructorAssignedScheduleRow,
  no: number,
  _program: Program,
  occupiedHopeSlots: Set<string>
): ParticipatingIndividualInstructorWaitingScheduleRow {
  const [dateKey, , sessionRoundRaw] = assignedRow.slotKey.split('|')
  const sessionRound = Number.parseInt(sessionRoundRaw ?? '1', 10) || 1
  const timeMatch = assignedRow.scheduleLabel.match(/(\d{2}:\d{2}\s*~\s*\d{2}:\d{2})/)
  const hopeSchedule: WaitingInstructorHopeSchedule = {
    hopeDate: dateKey ? formatHopeDate(dateKey) : '',
    hopeTime: timeMatch?.[1] ?? '',
    hopeSession: `${sessionRound}회차`,
  }

  return {
    id: `ia-w-back-${assignedRow.slotKey}`,
    no,
    slotKey: assignedRow.slotKey,
    schoolId: assignedRow.schoolId,
    lectureLocation: assignedRow.lectureLocation,
    distanceFromHome: assignedRow.distanceFromHome,
    scheduleLabel: assignedRow.scheduleLabel,
    assignmentStatus: resolveWaitingInstructorAssignmentStatus(hopeSchedule, occupiedHopeSlots),
    assignedInstructorCountLabel: instructorCountLabel(assignedRow.slotKey),
  }
}

export function renumberIndividualAssignedScheduleRows(
  rows: ParticipatingIndividualInstructorAssignedScheduleRow[]
): ParticipatingIndividualInstructorAssignedScheduleRow[] {
  const n = rows.length
  return rows.map((r, i) => ({ ...r, no: n - i }))
}

export function renumberIndividualWaitingScheduleRows(
  rows: ParticipatingIndividualInstructorWaitingScheduleRow[]
): ParticipatingIndividualInstructorWaitingScheduleRow[] {
  const sorted = sortWaitingInstructorRowsUnavailableToBottom(rows)
  const n = sorted.length
  return sorted.map((r, i) => ({ ...r, no: n - i }))
}
