import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { OrganizationActivityGiveUpRequest } from '@/shared/api/generated/dashboard/schemas/organizationActivityGiveUpRequest'
import type { OrganizationApplicationApprovePayload } from '@/features/program/general/api/applications-api-client'
import type { TrainedTeacherOrganizationApplicationResponse } from '@/shared/api/generated/dashboard/schemas/trainedTeacherOrganizationApplicationResponse'
import type { TrainedTeacherOrganizationApplicationsListQuery } from './organization-applications-list-query'
import type { TrainedTeacherOrganizationApplicationDetailResponse } from './organization-applications-types'
import type { TrainedTeacherApproveRequest } from './trained-teacher-organization-approve-payload'

function listUrl(programId: string): string {
  return `/api/admin/programs/${encodeURIComponent(programId)}/trained-teacher/organization-applications`
}

export async function fetchTrainedTeacherOrganizationApplicationsRemote(
  programId: string,
  query: TrainedTeacherOrganizationApplicationsListQuery = {}
): Promise<TrainedTeacherOrganizationApplicationResponse[]> {
  const params: Record<string, string> = {}
  if (query.keyword?.trim()) params.keyword = query.keyword.trim()
  if (query.status?.trim()) params.status = query.status.trim()

  const body = await unwrapApiBody<
    | TrainedTeacherOrganizationApplicationResponse[]
    | { content?: TrainedTeacherOrganizationApplicationResponse[] }
  >(
    await customInstance({
      url: listUrl(programId),
      method: 'GET',
      ...(Object.keys(params).length > 0 ? { params } : {}),
    })
  )
  if (Array.isArray(body)) return body
  return body.content ?? []
}

export async function fetchTrainedTeacherOrganizationApplicationRemote(
  programId: string,
  applicationId: string
): Promise<TrainedTeacherOrganizationApplicationDetailResponse> {
  return unwrapApiBody<TrainedTeacherOrganizationApplicationDetailResponse>(
    await customInstance({
      url: `${listUrl(programId)}/${encodeURIComponent(applicationId)}`,
      method: 'GET',
    })
  )
}

export async function approveTrainedTeacherOrganizationApplicationRemote(
  programId: string,
  applicationId: string,
  payload?: OrganizationApplicationApprovePayload | TrainedTeacherApproveRequest
): Promise<void> {
  await unwrapApiBody(
    await customInstance({
      url: `${listUrl(programId)}/${encodeURIComponent(applicationId)}/approve`,
      method: 'POST',
      ...(payload ? { data: payload } : {}),
    })
  )
}

export async function rejectTrainedTeacherOrganizationApplicationRemote(
  programId: string,
  applicationId: string,
  payload: { reason: string }
): Promise<void> {
  await unwrapApiBody(
    await customInstance({
      url: `${listUrl(programId)}/${encodeURIComponent(applicationId)}/reject`,
      method: 'POST',
      data: payload,
      headers: { 'Content-Type': 'application/json' },
    })
  )
}

export type TrainedTeacherOrganizationNotificationResendPayload = {
  timing: 'IMMEDIATE' | 'SCHEDULED'
  scheduledAt: string | null
  reason: string | null
}

/** OpenAPI operationId: resendTrainedTeacherOrganizationApplicationNotification */
export async function resendTrainedTeacherOrganizationApplicationNotificationRemote(
  programId: string,
  applicationId: string,
  payload: TrainedTeacherOrganizationNotificationResendPayload,
  idempotencyKey: string
): Promise<void> {
  await unwrapApiBody(
    await customInstance({
      url: `${listUrl(programId)}/${encodeURIComponent(applicationId)}/notifications/resend`,
      method: 'POST',
      data: payload,
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
    })
  )
}

export type TrainedTeacherOrganizationActivityGiveUpPayload = OrganizationActivityGiveUpRequest

export type TrainedTeacherOrganizationProgressRemovalPayload = {
  reason: string
}

/** POST …/trained-teacher/organization-applications/{id}/give-up — participant give-up 쓰지 않음 */
export async function giveUpTrainedTeacherOrganizationApplicationRemote(
  programId: string,
  applicationId: string,
  payload: TrainedTeacherOrganizationActivityGiveUpPayload
): Promise<TrainedTeacherOrganizationApplicationResponse> {
  return unwrapApiBody<TrainedTeacherOrganizationApplicationResponse>(
    await customInstance({
      url: `${listUrl(programId)}/${encodeURIComponent(applicationId)}/give-up`,
      method: 'POST',
      data: payload,
      headers: { 'Content-Type': 'application/json' },
    })
  )
}

/** POST …/trained-teacher/organization-applications/{id}/remove-from-progress */
export async function removeTrainedTeacherOrganizationApplicationFromProgressRemote(
  programId: string,
  applicationId: string,
  payload: TrainedTeacherOrganizationProgressRemovalPayload
): Promise<TrainedTeacherOrganizationApplicationResponse> {
  return unwrapApiBody<TrainedTeacherOrganizationApplicationResponse>(
    await customInstance({
      url: `${listUrl(programId)}/${encodeURIComponent(applicationId)}/remove-from-progress`,
      method: 'POST',
      data: payload,
      headers: { 'Content-Type': 'application/json' },
    })
  )
}
