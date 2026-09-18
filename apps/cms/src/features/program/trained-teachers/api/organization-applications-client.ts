import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { TrainedTeacherOrganizationApplicationResponse } from '@/shared/api/generated/dashboard/schemas/trainedTeacherOrganizationApplicationResponse'
import type { TrainedTeacherOrganizationApplicationsListQuery } from './organization-applications-list-query'

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
    TrainedTeacherOrganizationApplicationResponse[] | { content?: TrainedTeacherOrganizationApplicationResponse[] }
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
): Promise<TrainedTeacherOrganizationApplicationResponse> {
  return unwrapApiBody<TrainedTeacherOrganizationApplicationResponse>(
    await customInstance({
      url: `${listUrl(programId)}/${encodeURIComponent(applicationId)}`,
      method: 'GET',
    })
  )
}

export async function approveTrainedTeacherOrganizationApplicationRemote(
  programId: string,
  applicationId: string
): Promise<void> {
  await unwrapApiBody(
    await customInstance({
      url: `${listUrl(programId)}/${encodeURIComponent(applicationId)}/approve`,
      method: 'POST',
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
