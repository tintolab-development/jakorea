import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { CreateMergeRequest } from '@/shared/api/generated/dashboard/schemas/createMergeRequest'
import type { MergeGroupResponse } from '@/shared/api/generated/dashboard/schemas/mergeGroupResponse'

export async function fetchOrganizationMergeGroupsRemote(
  programId: string
): Promise<MergeGroupResponse[]> {
  const body = await unwrapApiBody<MergeGroupResponse[]>(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/organization-merge-groups`,
      method: 'GET',
    })
  )
  return Array.isArray(body) ? body : []
}

export async function createOrganizationMergeGroupRemote(
  programId: string,
  payload: CreateMergeRequest
): Promise<MergeGroupResponse> {
  return unwrapApiBody<MergeGroupResponse>(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/organization-merge-groups`,
      method: 'POST',
      data: payload,
    })
  )
}

export async function cancelOrganizationMergeGroupRemote(
  programId: string,
  mergeGroupId: number
): Promise<MergeGroupResponse> {
  return unwrapApiBody<MergeGroupResponse>(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/organization-merge-groups/${encodeURIComponent(String(mergeGroupId))}`,
      method: 'DELETE',
    })
  )
}
