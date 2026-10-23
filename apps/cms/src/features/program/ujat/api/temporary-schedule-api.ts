/**
 * UJAT temporary-schedule / organization-schedule-assignments API
 * OpenAPI schema는 dashboard orval 검증 블로커로 codegen 대신 수동 타입 유지.
 */

import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'

export type UjatTemporaryScheduleSlotRequest = {
  scheduleId: number
  grade: string
  className: string
  studentCount: number
}

export type UjatTemporaryScheduleSaveRequest = {
  educationRegionCode: string
  slots: UjatTemporaryScheduleSlotRequest[]
}

export type UjatScheduleChangeRequest = {
  reason: string
}

export type UjatOrganizationScheduleSlotResponse = {
  slotId?: number | null
  programId?: number | null
  organizationApplicationId?: number | null
  scheduleId?: number | null
  educationRegionCode?: string | null
  grade?: string | null
  className?: string | null
  classLabel?: string | null
  studentCount?: number | null
  assignmentStatus?: string | null
  scheduleStartAt?: string | null
  scheduleEndAt?: string | null
  organizationName?: string | null
  organizationAddress?: string | null
  organizationAddressDetail?: string | null
}

export type UjatCapacityWarning = {
  semesterType?: string | null
  educationRegionCode?: string | null
  capacityType?: string | null
  maxCount?: number | null
  currentCount?: number | null
  message?: string | null
}

export type UjatOrganizationScheduleResponse = {
  programId?: number | null
  organizationApplicationId?: number | null
  applicationStatus?: string | null
  temporaryAssignmentStatus?: string | null
  institutionConfirmationStatus?: string | null
  portalBannerState?: string | null
  assignmentRevision?: number | null
  institutionConfirmedAt?: string | null
  assignmentLockedAt?: string | null
  slots?: UjatOrganizationScheduleSlotResponse[]
  capacityWarnings?: UjatCapacityWarning[] | null
}

export type UjatOrganizationScheduleListResponse = {
  content?: UjatOrganizationScheduleSlotResponse[]
}

export type ProgramScheduleListItem = {
  id?: number
  scheduleId?: number
  startAt?: string | null
  endAt?: string | null
  scheduleStartAt?: string | null
  scheduleEndAt?: string | null
  startDate?: string | null
  endDate?: string | null
  name?: string | null
  semesterType?: string | null
  half?: string | null
  semester?: string | null
  scheduleOrigin?: string | null
}

function programPath(programId: string, suffix: string): string {
  return `/api/admin/programs/${encodeURIComponent(programId)}${suffix}`
}

export async function fetchUjatTemporarySchedule(
  programId: string,
  applicationId: string
): Promise<UjatOrganizationScheduleResponse> {
  return unwrapApiBody(
    await customInstance({
      url: programPath(
        programId,
        `/ujat/organization-applications/${encodeURIComponent(applicationId)}/temporary-schedule`
      ),
      method: 'GET',
    })
  )
}

export async function putUjatTemporarySchedule(
  programId: string,
  applicationId: string,
  body: UjatTemporaryScheduleSaveRequest
): Promise<UjatOrganizationScheduleResponse> {
  return unwrapApiBody(
    await customInstance({
      url: programPath(
        programId,
        `/ujat/organization-applications/${encodeURIComponent(applicationId)}/temporary-schedule`
      ),
      method: 'PUT',
      data: body,
    })
  )
}

export async function fetchUjatOrganizationScheduleAssignments(
  programId: string,
  query: { educationRegionCode?: string } = {}
): Promise<UjatOrganizationScheduleListResponse> {
  const educationRegionCode = query.educationRegionCode?.trim()
  return unwrapApiBody(
    await customInstance({
      url: programPath(programId, '/ujat/organization-schedule-assignments'),
      method: 'GET',
      ...(educationRegionCode ? { params: { educationRegionCode } } : {}),
    })
  )
}

export async function postUjatScheduleChangeRequest(
  programId: string,
  applicationId: string,
  body: UjatScheduleChangeRequest
): Promise<UjatOrganizationScheduleResponse> {
  return unwrapApiBody(
    await customInstance({
      url: programPath(
        programId,
        `/ujat/organization-applications/${encodeURIComponent(applicationId)}/schedule-change-request`
      ),
      method: 'POST',
      data: body,
    })
  )
}

/** 프로그램 일정 목록 — OpenAPI schema thin, 런타임 배열/페이지 모두 수용 */
export async function fetchProgramSchedulesLoose(
  programId: string
): Promise<ProgramScheduleListItem[]> {
  const raw = await unwrapApiBody<unknown>(
    await customInstance({
      url: programPath(programId, '/schedules'),
      method: 'GET',
    })
  )
  if (Array.isArray(raw)) return raw as ProgramScheduleListItem[]
  if (raw && typeof raw === 'object') {
    const obj = raw as {
      content?: ProgramScheduleListItem[]
      items?: ProgramScheduleListItem[]
      schedules?: ProgramScheduleListItem[]
    }
    return obj.content ?? obj.items ?? obj.schedules ?? []
  }
  return []
}

const SEOUL_YMD = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** `startAt` → Asia/Seoul 달력일 `YYYY-MM-DD`. 파싱 불가면 선행 날짜만. */
export function isoDateFromScheduleInstant(value: string | null | undefined): string | null {
  if (!value?.trim()) return null
  const trimmed = value.trim()
  if (ISO_DATE.test(trimmed)) return trimmed
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) {
    return trimmed.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] ?? null
  }
  return SEOUL_YMD.format(parsed)
}

export function scheduleIdOf(item: ProgramScheduleListItem): number | null {
  const id = item.id ?? item.scheduleId
  if (id == null || !Number.isFinite(Number(id))) return null
  return Number(id)
}

/** 하루 행 판별은 `startDate`/`endDate` 우선. all-day exclusive `endAt`으로 이틀로 보지 않는다. */
export function scheduleCalendarRange(
  item: ProgramScheduleListItem
): { start: string; end: string } | null {
  const startDate = isoDateFromScheduleInstant(item.startDate)
  const endDate = isoDateFromScheduleInstant(item.endDate)
  if (startDate && endDate) return { start: startDate, end: endDate }

  const start =
    startDate ??
    isoDateFromScheduleInstant(item.startAt) ??
    isoDateFromScheduleInstant(item.scheduleStartAt)
  if (!start) return null
  const end =
    endDate ??
    isoDateFromScheduleInstant(item.endAt) ??
    isoDateFromScheduleInstant(item.scheduleEndAt) ??
    start
  return { start, end }
}

export function isExactDayProgramSchedule(item: ProgramScheduleListItem): boolean {
  const range = scheduleCalendarRange(item)
  return Boolean(range && range.start === range.end)
}

/** 희망일 열과 `startDate`가 같은 하루 행 id. 연간 기간 창 id는 쓰지 않는다. */
export function resolveScheduleIdForIsoDate(
  schedules: readonly ProgramScheduleListItem[],
  isoDate: string
): number | null {
  for (const item of schedules) {
    if (!isExactDayProgramSchedule(item)) continue
    const range = scheduleCalendarRange(item)
    const id = scheduleIdOf(item)
    if (range && id != null && range.start === isoDate) return id
  }
  return null
}

export function isDayProgramScheduleId(
  schedules: readonly ProgramScheduleListItem[],
  scheduleId: number
): boolean {
  return schedules.some(
    item => isExactDayProgramSchedule(item) && scheduleIdOf(item) === scheduleId
  )
}

export function buildScheduleIdByIsoDateMap(
  schedules: ProgramScheduleListItem[],
  extraIsoDates: readonly string[] = [],
  preferredScheduleIdByIso: Readonly<Record<string, number>> = {}
): Map<string, number> {
  const map = new Map<string, number>()
  for (const item of schedules) {
    if (!isExactDayProgramSchedule(item)) continue
    const id = scheduleIdOf(item)
    const range = scheduleCalendarRange(item)
    if (id == null || !range) continue
    if (!map.has(range.start)) map.set(range.start, id)
  }
  for (const [iso, preferredId] of Object.entries(preferredScheduleIdByIso)) {
    if (!Number.isFinite(preferredId)) continue
    if (!isDayProgramScheduleId(schedules, preferredId)) continue
    map.set(iso, preferredId)
  }
  for (const iso of extraIsoDates) {
    if (map.has(iso)) continue
    const id = resolveScheduleIdForIsoDate(schedules, iso)
    if (id != null) map.set(iso, id)
  }
  return map
}
