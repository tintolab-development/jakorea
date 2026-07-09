import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { ProgramResponse } from '@/shared/api/generated/logs/schemas/programResponse'

export type AdminProgramsListQuery = {
  keyword?: string
  programType?: string
  periodStatus?: string
  businessYear?: number
  page?: number
  size?: number
}

export interface AdminProgramListItemDto {
  id?: number | string
  uuid?: string
  programCode?: string
  programType?: string
  deliveryType?: string
  draftStatus?: string
  periodStatus?: string
  nameKo?: string
  businessYear?: number
  businessStartDate?: string
  businessEndDate?: string
  organizationApplicationCount?: number
  approvedOrganizationApplicationCount?: number
  instructorApplicantCount?: number
  applicantCount?: number
  createdAt?: string
  updatedAt?: string
}

export interface AdminProgramsPageDto {
  items?: AdminProgramListItemDto[]
  page?: number
  size?: number
  totalElements?: number
  totalPages?: number
}

export async function fetchAdminProgramsRemote(
  params: AdminProgramsListQuery
): Promise<AdminProgramsPageDto> {
  return unwrapApiBody<AdminProgramsPageDto>(
    await customInstance({
      url: '/api/admin/programs',
      method: 'GET',
      params,
    })
  )
}

export async function fetchAdminProgramByIdRemote(programId: string): Promise<ProgramResponse> {
  return unwrapApiBody<ProgramResponse>(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}`,
      method: 'GET',
    })
  )
}

export async function createAdminProgramRemote(
  payload: import('@/shared/api/generated/dashboard/schemas/programCreateRequest').ProgramCreateRequest
): Promise<ProgramResponse> {
  return unwrapApiBody<ProgramResponse>(
    await customInstance({
      url: '/api/admin/programs',
      method: 'POST',
      data: payload,
    })
  )
}

export async function updateAdminProgramRemote(
  programId: string,
  payload: import('@/shared/api/generated/dashboard/schemas/programUpdateRequest').ProgramUpdateRequest
): Promise<ProgramResponse> {
  return unwrapApiBody<ProgramResponse>(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}`,
      method: 'PATCH',
      data: payload,
    })
  )
}

export async function deleteAdminProgramRemote(programId: string): Promise<void> {
  await customInstance({
    url: `/api/admin/programs/${encodeURIComponent(programId)}`,
    method: 'DELETE',
  })
}
