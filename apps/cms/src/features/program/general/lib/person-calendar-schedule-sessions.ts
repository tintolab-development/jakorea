/**
 * 일반 개인형 사람 단위 캘린더(강사 신청·참여 강사) — 프로그램 일정(`GET /admin/programs/{id}/schedules`)을
 * `IndividualPersonCalendarView`가 읽는 `ParticipatingSchoolSession`으로 바꾼다.
 *
 * - 강사 신청: 목록 응답 `availableScheduleIds`(program_schedule id) → 일정
 * - 참여 강사: 배정 목록(`instructor-assignments`) `scheduleId` → 일정, 일정이 없으면 `lectureDate`
 */

import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import type { InstructorAssignmentListItemEnriched } from '@/features/program/general/api/instructor-assignment-types'
import type { ProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/programScheduleResponse'
import type { Program } from '@/types/domain'
import { formatEducationScheduleSessionWithTime } from '@/features/program/general/lib/school-detail-attendance-display'

const SEOUL_TIME_ZONE = 'Asia/Seoul'

function toValidDate(raw: string | null | undefined): Date | null {
  const trimmed = raw?.trim()
  if (!trimmed) return null
  const date = new Date(trimmed)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatSeoulDateParts(date: Date): { date: string; dayOfWeek: string } {
  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: SEOUL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(part => part.type === type)?.value ?? ''
  return {
    date: `${value('year')}.${value('month')}.${value('day')}`,
    dayOfWeek: value('weekday').replace('요일', ''),
  }
}

function formatSeoulClock(date: Date): string {
  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: SEOUL_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)
  const hour = parts.find(part => part.type === 'hour')?.value ?? '00'
  const minute = parts.find(part => part.type === 'minute')?.value ?? '00'
  return `${hour}:${minute}`
}

function positiveScheduleId(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 1) return null
  return Math.trunc(value)
}

/**
 * 프로그램 일정 1건 → 캘린더 세션. 시작 일시가 없으면 `fallbackDateRaw`(배정 lectureDate 등)로 날짜만 채운다.
 * 날짜를 알 수 없으면 null (캘린더에 그리지 않는다).
 */
export function mapProgramScheduleToPersonCalendarSession(
  schedule: ProgramScheduleResponse | undefined,
  options: {
    scheduleId?: number | null
    fallbackDateRaw?: string | null
    /** 이벤트 id 구분용 순번(회차 없을 때). 표시에는 쓰지 않는다 */
    order?: number
    /** 일정 응답에 차시가 없을 때 배정 응답 `curriculumSessionCount` */
    fallbackCurriculumSessionCount?: number | null
  } = {}
): ParticipatingSchoolSession | null {
  const start = toValidDate(schedule?.startAt ?? schedule?.startDate)
  const end = toValidDate(schedule?.endAt ?? schedule?.endDate)
  const dateSource = start ?? toValidDate(options.fallbackDateRaw)
  if (!dateSource) return null

  const dateParts = formatSeoulDateParts(dateSource)
  const timeRange =
    start && end && schedule?.allDay !== true
      ? `${formatSeoulClock(start)} ~ ${formatSeoulClock(end)}`
      : '-'
  const sessionNo =
    typeof schedule?.sessionNo === 'number' && Number.isFinite(schedule.sessionNo)
      ? schedule.sessionNo
      : null
  const scheduleId = positiveScheduleId(schedule?.id ?? options.scheduleId)
  // 일정에 연결된 커리큘럼 차시 '건수'. 차시 번호가 아니므로 그대로 「N차시」로 표시하지 않는다
  // (단일 회차에서 전 차시 연결 여부 판정에만 쓴다 — resolveEducationScheduleSessionLeadLabel).
  const curriculumSessionCount =
    positiveScheduleId(schedule?.curriculumSessionCount) ??
    positiveScheduleId(options.fallbackCurriculumSessionCount)
  const scheduleRole = schedule?.scheduleRole?.trim()
  const educationSlotKey = schedule?.educationSlotKey?.trim()

  return {
    // round는 이벤트 id 구분용. 표시는 `formatPersonCalendarSessionLabel`(교육 구조별 SSOT)만 쓴다
    round: sessionNo != null && sessionNo > 0 ? sessionNo : (options.order ?? 0) + 1,
    ...dateParts,
    duration: '-',
    format: '-',
    classNum: '',
    timeRange,
    status: 'pending',
    sessionNo,
    ...(curriculumSessionCount != null ? { curriculumSessionCount } : {}),
    ...(scheduleRole ? { scheduleRole } : {}),
    ...(educationSlotKey ? { educationSlotKey } : {}),
    ...(scheduleId != null ? { resolvedScheduleId: scheduleId } : {}),
    startAt: schedule?.startAt ?? schedule?.startDate ?? null,
    endAt: schedule?.endAt ?? schedule?.endDate ?? null,
  }
}

function indexSchedulesById(
  schedules: readonly ProgramScheduleResponse[]
): Map<number, ProgramScheduleResponse> {
  const map = new Map<number, ProgramScheduleResponse>()
  for (const schedule of schedules) {
    const id = positiveScheduleId(schedule.id)
    if (id != null) map.set(id, schedule)
  }
  return map
}

/** 강사 신청 `availableScheduleIds` → 신청(희망) 일정 세션. 프로그램 일정에 없는 id는 건너뛴다. */
export function buildScheduleIdsPersonCalendarSessions(
  scheduleIds: readonly number[] | null | undefined,
  schedules: readonly ProgramScheduleResponse[]
): ParticipatingSchoolSession[] {
  if (!scheduleIds?.length || schedules.length === 0) return []
  const byId = indexSchedulesById(schedules)
  const seen = new Set<number>()
  const sessions: ParticipatingSchoolSession[] = []
  for (const raw of scheduleIds) {
    const id = positiveScheduleId(raw)
    if (id == null || seen.has(id)) continue
    seen.add(id)
    const session = mapProgramScheduleToPersonCalendarSession(byId.get(id), {
      scheduleId: id,
      order: sessions.length,
    })
    if (session) sessions.push(session)
  }
  return sessions
}

function isCancelledAssignment(assignment: InstructorAssignmentListItemEnriched): boolean {
  const status = (assignment.assignmentStatus ?? '').toUpperCase()
  return status === 'CANCELLED' || status === 'CANCELED'
}

/** 배정 목록 → 강사 회원 ID별 배정 일정 세션(취소 제외, 같은 일정 중복 제거) */
export function buildAssignedPersonCalendarSessionsByMemberId(
  assignments: readonly InstructorAssignmentListItemEnriched[],
  schedules: readonly ProgramScheduleResponse[]
): Map<string, ParticipatingSchoolSession[]> {
  const byId = indexSchedulesById(schedules)
  const result = new Map<string, ParticipatingSchoolSession[]>()
  const seenByMember = new Map<string, Set<string>>()
  for (const assignment of assignments) {
    if (assignment.instructorMemberId == null || isCancelledAssignment(assignment)) continue
    const memberId = String(assignment.instructorMemberId)
    const scheduleId = positiveScheduleId(assignment.scheduleId)
    const dedupeKey =
      scheduleId != null ? `s:${scheduleId}` : `d:${assignment.lectureDate?.trim() ?? ''}`
    const seen = seenByMember.get(memberId) ?? new Set<string>()
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)
    seenByMember.set(memberId, seen)
    const list = result.get(memberId) ?? []
    const session = mapProgramScheduleToPersonCalendarSession(
      scheduleId != null ? byId.get(scheduleId) : undefined,
      {
        scheduleId,
        fallbackDateRaw: assignment.lectureDate,
        order: list.length,
        fallbackCurriculumSessionCount: assignment.curriculumSessionCount,
      }
    )
    if (!session) continue
    list.push(session)
    result.set(memberId, list)
  }
  return result
}

/**
 * 셀·카드·팝오버 일정 라벨 `{선행 라벨} (HH:mm ~ HH:mm)`.
 * 선행 라벨(사전교육·세부 일정명·N회차·연결 차시)은 교육 구조별 SSOT
 * {@link formatEducationScheduleSessionWithTime}을 따른다. 차시를 알 수 없으면 시간만.
 */
export function formatPersonCalendarSessionLabel(
  session: ParticipatingSchoolSession,
  program: Program | null | undefined
): string | undefined {
  return formatEducationScheduleSessionWithTime(session, program) ?? undefined
}
