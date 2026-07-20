import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { TrainedTeacherOrganizationApplicationResponse } from '@/shared/api/generated/dashboard/schemas/trainedTeacherOrganizationApplicationResponse'

function listUrl(programId: string): string {
  return `/api/admin/programs/${encodeURIComponent(programId)}/trained-teacher/organization-applications`
}

export async function fetchTrainedTeacherOrganizationApplicationsRemote(
  programId: string
): Promise<TrainedTeacherOrganizationApplicationResponse[]> {
  const body = await unwrapApiBody<
    TrainedTeacherOrganizationApplicationResponse[] | { content?: TrainedTeacherOrganizationApplicationResponse[] }
  >(
    await customInstance({
      url: listUrl(programId),
      method: 'GET',
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
