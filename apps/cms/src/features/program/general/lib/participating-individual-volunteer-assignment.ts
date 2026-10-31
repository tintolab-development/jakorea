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
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
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
import { isProgramSchedulePreEducation } from '@/features/program/shared/lib/program-schedule-canonical'
import { PRE_EDUCATION_DISPLAY_LABEL } from '@/features/program/general/lib/schedule-detail-form'

/** 프로그램 공통 정보 진행 장소 — 개인형 봉사 지역 폴백 */
export function resolveProgramVolunteerServiceRegionFallback(program: Program): string | undefined {
  const parts = [program.venue?.trim(), program.generalCommonInfo?.venueDetail?.trim()].filter(
    Boolean
  ) as string[]
  return parts.length > 0 ? parts.join(' ') : undefined
}

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

/** 조회가 끝나기 전, 아직 km가 없는 칸. 확정 null의 '-'와 구분한다. */
export const VOLUNTEER_ASSIGNMENT_DISTANCE_CALCULATING_LABEL = '계산 중'

/** education-scope 응답이 null로 확정된 뒤의 안내. 에러 코드는 없다. */
export const VOLUNTEER_ASSIGNMENT_DISTANCE_UNAVAILABLE_TOOLTIP =
  '자택 주소 또는 일정 장소가 없거나, 거리를 산출할 수 없습니다. 회원 프로필 자택과 일정 장소를 확인하세요.'

/**
 * education-scope `distanceKm`만 표시. FE 반올림·재계산 없음.
 * null/undefined → '-'. 0은 '0km'. 100 이상이면 장거리 접미사.
 */
export function formatVolunteerAssignmentDistanceKm(km: number | null | undefined): string {
  if (km == null || Number.isNaN(km)) return '-'
  const label = `${km}km`
  return km >= 100 ? `${label} (장거리)` : label
}

/**
 * education-scope 조회 중이고 칸이 아직 '-'이면 '계산 중'.
 * 이미 숫자 km인 칸은 재조회 중에도 그 값을 유지한다.
 */
export function resolveVolunteerAssignmentDistanceCellLabel(
  distanceFromHome: string,
  educationScopeFetching: boolean
): string {
  if (educationScopeFetching && distanceFromHome === '-') {
    return VOLUNTEER_ASSIGNMENT_DISTANCE_CALCULATING_LABEL
  }
  return distanceFromHome
}

function formatHopeDate(dateKey: string): string {
  return formatCmsScheduleDisplayLabel(dateKey)
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

function participantSessionsByScheduleId(
  sessions: ParticipatingSchoolSession[] | undefined
): Map<number, ParticipatingSchoolSession> {
  const map = new Map<number, ParticipatingSchoolSession>()
  for (const session of sessions ?? []) {
    if (session.resolvedScheduleId == null) continue
    map.set(session.resolvedScheduleId, session)
  }
  return map
}

function physicalDashboardScheduleId(schedule: unknown): number | null {
  if (schedule == null || typeof schedule !== 'object') return null
  const raw = schedule as { scheduleId?: unknown; id?: unknown }
  for (const value of [raw.scheduleId, raw.id]) {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return Math.trunc(value)
    }
  }
  return null
}

/** 프로그램 schedules에서 PRE_EDUCATION 행 id. */
export function collectPreEducationScheduleIdsFromProgramSchedules(
  schedules: ReadonlyArray<unknown>
): number[] {
  const ids: number[] = []
  const seen = new Set<number>()
  for (const schedule of schedules) {
    if (!isProgramSchedulePreEducation(schedule)) continue
    const id = physicalDashboardScheduleId(schedule)
    if (id == null || seen.has(id)) continue
    seen.add(id)
    ids.push(id)
  }
  return ids
}

/** GET education-scope의 현재 배정분 중 PRE_ED id만. 프로그램에 있는 미배정 PRE_ED는 넣지 않는다. */
export function collectAssignedPreEducationScheduleIds(input: {
  currentScheduleIds: ReadonlyArray<number>
  programSchedules: ReadonlyArray<unknown>
}): number[] {
  const preEducationInProgram = new Set(
    collectPreEducationScheduleIdsFromProgramSchedules(input.programSchedules)
  )
  const seen = new Set<number>()
  const ids: number[] = []
  for (const id of input.currentScheduleIds) {
    if (!Number.isFinite(id) || id <= 0) continue
    const scheduleId = Math.trunc(id)
    if (!preEducationInProgram.has(scheduleId) || seen.has(scheduleId)) continue
    seen.add(scheduleId)
    ids.push(scheduleId)
  }
  return ids
}

/**
 * PUT education-scope PRE_ED merge는 BE 대기.
 * 임시: 사용자가 고른 본교육 id ∪ 기존 PRE_ED id. PRE_ED를 빼거나 새로 넣지 않는다.
 */
export function mergeEducationScopeScheduleIdsPreservingPreEducation(input: {
  nextScheduleIds: ReadonlyArray<number>
  preEducationScheduleIds: ReadonlyArray<number>
}): number[] {
  const seen = new Set<number>()
  const result: number[] = []
  for (const id of [...input.nextScheduleIds, ...input.preEducationScheduleIds]) {
    if (!Number.isFinite(id) || id <= 0) continue
    const scheduleId = Math.trunc(id)
    if (seen.has(scheduleId)) continue
    seen.add(scheduleId)
    result.push(scheduleId)
  }
  return result
}

/** schedules·education-scope가 모두 준비된 후에만 배정/대기 분할을 한다. */
export function canBuildIndividualVolunteerAssignmentRows(input: {
  remoteEnabled: boolean
  schedulesData: { schedules: DashboardProgramScheduleResponse[] } | null | undefined
  scopeData: unknown | undefined
}): boolean {
  if (!input.remoteEnabled) return false
  if (input.schedulesData == null) return false
  if (input.scopeData === undefined) return false
  return true
}

export function buildIndividualVolunteerAssignmentRowsFromEducationScope(params: {
  program: Program
  assignedScheduleIds: number[]
  schedules: DashboardProgramScheduleResponse[]
  /** education-scope additive enrich — 거리는 enrich.distanceKm만 사용 */
  scopeScheduleEnrich?: ParticipantEducationScopeScheduleEnrich[]
  /** participants sessions — dashboard 일정과 scheduleId가 같으면 표시·slotKey SSOT */
  participantSessions?: ParticipatingSchoolSession[]
  /** 일정·enrich에 장소 없을 때 (자택 지역·프로그램 진행 장소) */
  serviceRegionFallback?: string | null
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
  const sessionByScheduleId = participantSessionsByScheduleId(params.participantSessions)
  const regionFallback =
    params.serviceRegionFallback?.trim() ||
    resolveProgramVolunteerServiceRegionFallback(params.program)
  const assigned: ParticipatingIndividualVolunteerAssignedScheduleRow[] = []
  const waiting: ParticipatingIndividualVolunteerWaitingScheduleRow[] = []

  params.schedules
    .filter(schedule => schedule.scheduleId != null)
    .forEach((schedule, index) => {
      const scheduleId = schedule.scheduleId as number
      const session =
        sessionByScheduleId.get(scheduleId) ?? dashboardScheduleToSession(schedule, index)
      if (!session) return
      const enrich = enrichByScheduleId.get(scheduleId)
      const slotKey = `${session.date.replace(/\./g, '-')}|individual-program|${session.round}`
      const preEducation = isProgramSchedulePreEducation(schedule)
      const scheduleLabel = preEducation
        ? PRE_EDUCATION_DISPLAY_LABEL
        : formatVolunteerAssignmentScheduleLine(session, params.program)
      const serviceRegion = resolveVolunteerServiceRegion({
        locationName: schedule.locationName ?? enrich?.locationName,
        address: schedule.address ?? enrich?.address,
        regionFallback,
      })
      const distanceFromHome = formatVolunteerAssignmentDistanceKm(enrich?.distanceKm)
      const assignedVolunteerCountLabel =
        typeof enrich?.assignedVolunteerCount === 'number'
          ? `${enrich.assignedVolunteerCount}명`
          : '0명'
      if (assignedIdSet.has(scheduleId)) {
        assigned.push({
          id: `iv-scope-as-${scheduleId}`,
          no: 0,
          slotKey,
          serviceRegion,
          distanceFromHome,
          scheduleLabel,
          scheduleId,
          preEducation,
        })
        return
      }
      // 필수 사전교육은 서버 자동 배정 — 배정 대기(선택 후보)로 노출하지 않는다.
      if (preEducation) return
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
