import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { PageResponseParticipantListItemResponse } from '@/shared/api/generated/dashboard/schemas/pageResponseParticipantListItemResponse'
import type { ParticipantListItemResponse } from '@/shared/api/generated/dashboard/schemas/participantListItemResponse'

export type ProgramParticipantsListQuery = {
  participantType?: string
  status?: string
  page?: number
  size?: number
}

export interface ProgramParticipantsPageDto {
  items?: ParticipantListItemResponse[]
  page?: number
  size?: number
  totalElements?: number
  totalPages?: number
}

export async function fetchProgramParticipantsRemote(
  programId: string,
  params?: ProgramParticipantsListQuery
): Promise<ProgramParticipantsPageDto> {
  return unwrapApiBody<PageResponseParticipantListItemResponse>(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/participants`,
      method: 'GET',
      params,
    })
  )
}

export async function fetchScheduleAttendancesRemote(
  programId: string,
  scheduleId: string
): Promise<
  import('@/shared/api/generated/dashboard/schemas/attendanceItemResponse').AttendanceItemResponse[]
> {
  const body = await unwrapApiBody<
    | import('@/shared/api/generated/dashboard/schemas/attendanceItemResponse').AttendanceItemResponse[]
    | {
        items?: import('@/shared/api/generated/dashboard/schemas/attendanceItemResponse').AttendanceItemResponse[]
      }
  >(
    await customInstance({
      url: `/api/admin/program-execution/programs/${encodeURIComponent(programId)}/schedules/${encodeURIComponent(scheduleId)}/attendances`,
      method: 'GET',
    })
  )
  if (Array.isArray(body)) return body
  return body.items ?? []
}

export async function putScheduleAttendancesRemote(
  scheduleId: string,
  payload: import('@/shared/api/generated/dashboard/schemas/scheduleAttendanceBulkUpsertRequest').ScheduleAttendanceBulkUpsertRequest
): Promise<void> {
  await customInstance({
    url: `/api/admin/program-schedules/${encodeURIComponent(scheduleId)}/attendances`,
    method: 'PUT',
    data: payload,
  })
}

export async function bulkUpsertProgramAttendancesRemote(
  programId: string,
  payload: import('@/shared/api/generated/dashboard/schemas/attendanceBulkUpsertRequest').AttendanceBulkUpsertRequest
): Promise<
  import('@/shared/api/generated/dashboard/schemas/attendanceBulkUpsertResponse').AttendanceBulkUpsertResponse
> {
  return unwrapApiBody(
    await customInstance({
      url: `/api/admin/program-execution/programs/${encodeURIComponent(programId)}/attendances:bulk-upsert`,
      method: 'POST',
      data: payload,
    })
  )
}

/** GET /api/admin/dashboard/program-schedules — 프로그램 일정 목록(출석 세션 옵션용). P2-2 전용 schedules list 대체. */
export async function fetchProgramSchedulesViaDashboardRemote(
  programId: string
): Promise<
  import('@/shared/api/generated/dashboard/schemas/dashboardProgramScheduleResponse').DashboardProgramScheduleResponse[]
> {
  const { fetchDashboardProgramSchedulesRemote, toDashboardQueryParams } = await import(
    '@/features/dashboard/api/dashboard-api-client'
  )
  const body = await fetchDashboardProgramSchedulesRemote(
    toDashboardQueryParams({ programIds: [programId] })
  )
  return body.items ?? []
}

/** GET /api/admin/programs/{programId}/lecture-reports */
export async function fetchProgramLectureReportsRemote(
  programId: string,
  params?: { page?: number; size?: number }
): Promise<unknown[]> {
  const body = await unwrapApiBody<unknown[] | { items?: unknown[] }>(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/lecture-reports`,
      method: 'GET',
      params,
    })
  )
  if (Array.isArray(body)) return body
  return body.items ?? []
}
