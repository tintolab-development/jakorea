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
