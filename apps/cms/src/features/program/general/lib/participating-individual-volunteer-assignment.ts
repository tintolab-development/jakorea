/**
 * 참여 봉사자 상세 — 봉사 배정 현황 탭 (일반 프로그램 · 개인) mock
 */

import type { ParticipatingVolunteerRow } from '@/features/program/general/model/participating-volunteers'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import {
  countLectureSlotAssignments,
  getApprovedInstitutionLectureScheduleSlots,
  type InstructorLectureAssignSlot,
} from '@/features/program/general/lib/instructor-lecture-assign-schedule'
import { formatVolunteerAssignmentScheduleLine } from '@/features/program/general/lib/participating-school-session-display'
import { formatIndividualInstructorLectureLocation } from '@/features/program/general/lib/participating-individual-instructor-assignment-display'
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
import type { DashboardProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/dashboardProgramScheduleResponse'
import type { ParticipantEducationScopeScheduleEnrich } from '@/features/program/general/api/program-progress-api-client'
import { mapSessionProgressToParticipatingSchoolSessions } from '@/features/program/general/api/adapters/general-applications-adapters'

/** 스케줄 locationName / address → 봉사 지역 표시 */
function resolveVolunteerServiceRegion(input: {
  locationName?: string | null
  address?: string | null
  regionFallback?: string | null
}): string {
  const locationName = input.locationName?.trim()
  if (locationName) return formatIndividualInstructorLectureLocation(locationName)
  const address = input.address?.trim()
  if (address) return formatIndividualInstructorLectureLocation(address)
  const fallback = input.regionFallback?.trim()
  if (fallback) return formatIndividualInstructorLectureLocation(fallback)
  return '-'
}

/**
 * 강사 배정과 동일. null/NaN → '-'.
 * education-scope enrich `distanceKm`만 사용 (FE invent/0 coerce 금지).
 * local `LOCAL_DISTANCE`는 BE 옵션 A: 자택·장소 모두 있으면 1.0–99.9 deterministic mock number.
 */
function formatDistanceKm(km: number | null | undefined): string {
  if (km == null || Number.isNaN(km)) return '-'
  const rounded = Math.round(km)
  return km >= 100 ? `${rounded}km (장거리)` : `${rounded}km`
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
  return `${countLectureSlotAssignments(slotKey, [])}명`
}

function buildWaitingRowFromDef(
  def: {
    id: string
    slotKey: string
    dateKey: string
    timeRange?: string
    sessionRound: number
    sessionName?: string
    forceUnavailable?: boolean
    assignedVolunteerCount?: number
    serviceRegion?: string
    distanceFromHome?: string
  },
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
    serviceRegion: def.serviceRegion?.trim() || '-',
    distanceFromHome: def.distanceFromHome?.trim() || '-',
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
    serviceRegion: '-',
    distanceFromHome: '-',
    scheduleLabel: formatVolunteerAssignmentScheduleLine(session, program),
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
        serviceRegion: resolveVolunteerServiceRegion({
          regionFallback: slot.region || slot.schoolName,
        }),
        distanceFromHome: '-',
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
  return buildAssignedFromVolunteerSessions(volunteer, program)
}

export function buildIndividualVolunteerWaitingScheduleRows(
  volunteer: ParticipatingVolunteerRow,
  program: Program,
  assignedRows: ParticipatingIndividualVolunteerAssignedScheduleRow[]
): ParticipatingIndividualVolunteerWaitingScheduleRow[] {
  const assignedSlotKeys = new Set(assignedRows.map(r => r.slotKey))
  const occupiedHopeSlots = buildOccupiedVolunteerHopeSlotKeys(assignedRows)

  return buildWaitingFromProgramSlots(
    program,
    volunteer,
    assignedSlotKeys,
    occupiedHopeSlots
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
    serviceRegion: waitingRow.serviceRegion,
    distanceFromHome: waitingRow.distanceFromHome,
    scheduleLabel: waitingRow.scheduleLabel,
    scheduleId: waitingRow.scheduleId,
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
    serviceRegion: assignedRow.serviceRegion,
    distanceFromHome: assignedRow.distanceFromHome,
    scheduleLabel: assignedRow.scheduleLabel,
    hopeSchedule,
    assignmentStatus: resolveWaitingInstructorAssignmentStatus(hopeSchedule, occupiedHopeSlots),
    assignedVolunteerCountLabel: volunteerCountLabel(assignedRow.slotKey),
    scheduleId: assignedRow.scheduleId,
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

function dashboardScheduleToSession(schedule: DashboardProgramScheduleResponse, index: number) {
  const mapped = mapSessionProgressToParticipatingSchoolSessions([
    {
      scheduleId: schedule.scheduleId,
      sessionNo: schedule.sessionNo ?? index + 1,
      scheduleName: schedule.scheduleName,
      startAt: schedule.startAt,
      endAt: schedule.endAt,
    },
  ])
  return mapped[0]
}

export function buildIndividualVolunteerAssignmentRowsFromEducationScope(params: {
  program: Program
  assignedScheduleIds: number[]
  schedules: DashboardProgramScheduleResponse[]
  /** education-scope additive enrich — 없으면 거리·인원은 '-' */
  scopeScheduleEnrich?: ParticipantEducationScopeScheduleEnrich[]
}): {
  assigned: ParticipatingIndividualVolunteerAssignedScheduleRow[]
  waiting: ParticipatingIndividualVolunteerWaitingScheduleRow[]
} {
  const assignedIdSet = new Set(params.assignedScheduleIds)
  const enrichByScheduleId = new Map<number, ParticipantEducationScopeScheduleEnrich>()
  for (const row of params.scopeScheduleEnrich ?? []) {
    if (row?.scheduleId == null) continue
    enrichByScheduleId.set(row.scheduleId, row)
  }
  const assigned: ParticipatingIndividualVolunteerAssignedScheduleRow[] = []
  const waiting: ParticipatingIndividualVolunteerWaitingScheduleRow[] = []

  params.schedules
    .filter(schedule => schedule.scheduleId != null)
    .forEach((schedule, index) => {
      const scheduleId = schedule.scheduleId as number
      const session = dashboardScheduleToSession(schedule, index)
      if (!session) return
      const enrich = enrichByScheduleId.get(scheduleId)
      const slotKey = `${session.date.replace(/\./g, '-')}|individual-program|${session.round}`
      const scheduleLabel = formatVolunteerAssignmentScheduleLine(session, params.program)
      const serviceRegion = resolveVolunteerServiceRegion({
        locationName: schedule.locationName ?? enrich?.locationName,
        address: schedule.address ?? enrich?.address,
      })
      const distanceFromHome = formatDistanceKm(enrich?.distanceKm)
      const assignedVolunteerCountLabel =
        enrich != null && typeof enrich.assignedVolunteerCount === 'number'
          ? `${enrich.assignedVolunteerCount}명`
          : '-'
      if (assignedIdSet.has(scheduleId)) {
        assigned.push({
          id: `iv-scope-as-${scheduleId}`,
          no: 0,
          slotKey,
          serviceRegion,
          distanceFromHome,
          scheduleLabel,
          scheduleId,
        })
        return
      }
      const hopeSchedule: WaitingInstructorHopeSchedule = {
        hopeDate: `${session.date}(${session.dayOfWeek})`,
        hopeTime: session.timeRange,
        hopeSession: session.format !== '-' ? session.format : `${session.round}회차`,
      }
      waiting.push({
        id: `iv-scope-w-${scheduleId}`,
        no: 0,
        slotKey,
        serviceRegion,
        distanceFromHome,
        scheduleLabel,
        hopeSchedule,
        assignmentStatus: 'waiting',
        assignedVolunteerCountLabel,
        scheduleId,
      })
    })

  return {
    assigned: renumberIndividualVolunteerAssignedScheduleRows(assigned),
    waiting: renumberIndividualVolunteerWaitingScheduleRows(waiting),
  }
}
