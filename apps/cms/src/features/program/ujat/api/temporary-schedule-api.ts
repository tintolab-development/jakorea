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
  name?: string | null
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
  programId: string
): Promise<UjatOrganizationScheduleListResponse> {
  return unwrapApiBody(
    await customInstance({
      url: programPath(programId, '/ujat/organization-schedule-assignments'),
      method: 'GET',
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

export function isoDateFromScheduleInstant(value: string | null | undefined): string | null {
  if (!value?.trim()) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) {
    const m = value.trim().match(/^(\d{4}-\d{2}-\d{2})/)
    return m?.[1] ?? null
  }
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${day}`
}

export function buildScheduleIdByIsoDateMap(
  schedules: ProgramScheduleListItem[]
): Map<string, number> {
  const map = new Map<string, number>()
  for (const item of schedules) {
    const id = item.id ?? item.scheduleId
    if (id == null || !Number.isFinite(Number(id))) continue
    const iso =
      isoDateFromScheduleInstant(item.startAt) ??
      isoDateFromScheduleInstant(item.scheduleStartAt)
    if (!iso) continue
    if (!map.has(iso)) map.set(iso, Number(id))
  }
  return map
}
