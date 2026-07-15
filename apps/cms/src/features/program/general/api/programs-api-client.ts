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

export async function fetchAdminProgramNavigationRemote(
  programId: string
): Promise<import('@/shared/api/generated/dashboard/schemas/programNavigationResponse').ProgramNavigationResponse> {
  return unwrapApiBody(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/navigation`,
      method: 'GET',
    })
  )
}

export async function fetchAdminProgramPostsRemote(
  programId: string
): Promise<
  import('@/shared/api/generated/dashboard/schemas/programPostListResponse').ProgramPostListResponse
> {
  return unwrapApiBody(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/posts`,
      method: 'GET',
    })
  )
}

export async function fetchAdminProgramSurveysRemote(
  programId: string
): Promise<
  import('@/shared/api/generated/dashboard/schemas/programSurveyResponse').ProgramSurveyResponse[]
> {
  const body = await unwrapApiBody<
    | import('@/shared/api/generated/dashboard/schemas/programSurveyResponse').ProgramSurveyResponse[]
    | {
        items?: import('@/shared/api/generated/dashboard/schemas/programSurveyResponse').ProgramSurveyResponse[]
      }
  >(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/surveys`,
      method: 'GET',
    })
  )
  if (Array.isArray(body)) return body
  return body.items ?? []
}

export async function createAdminProgramPostRemote(
  programId: string,
  payload: import('@/shared/api/generated/dashboard/schemas/programPostUpsertRequest').ProgramPostUpsertRequest
): Promise<
  import('@/shared/api/generated/dashboard/schemas/programPostMutationResponse').ProgramPostMutationResponse
> {
  return unwrapApiBody(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/posts`,
      method: 'POST',
      data: payload,
    })
  )
}

export async function updateAdminProgramPostRemote(
  programId: string,
  postId: string,
  payload: import('@/shared/api/generated/dashboard/schemas/programPostUpsertRequest').ProgramPostUpsertRequest
): Promise<
  import('@/shared/api/generated/dashboard/schemas/programPostMutationResponse').ProgramPostMutationResponse
> {
  return unwrapApiBody(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/posts/${encodeURIComponent(postId)}`,
      method: 'PATCH',
      data: payload,
    })
  )
}

export async function deleteAdminProgramPostRemote(
  programId: string,
  postId: string
): Promise<void> {
  await customInstance({
    url: `/api/admin/programs/${encodeURIComponent(programId)}/posts/${encodeURIComponent(postId)}`,
    method: 'DELETE',
  })
}

export async function fetchAdminProgramPostCommentsRemote(
  programId: string,
  postId: string
): Promise<
  import('@/shared/api/generated/dashboard/schemas/programPostCommentListResponse').ProgramPostCommentListResponse
> {
  return unwrapApiBody(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/posts/${encodeURIComponent(postId)}/comments`,
      method: 'GET',
    })
  )
}

export async function createAdminProgramPostCommentRemote(
  programId: string,
  postId: string,
  payload: import('@/shared/api/generated/dashboard/schemas/programPostCommentRequest').ProgramPostCommentRequest
): Promise<
  import('@/shared/api/generated/dashboard/schemas/programPostCommentMutationResponse').ProgramPostCommentMutationResponse
> {
  return unwrapApiBody(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/posts/${encodeURIComponent(postId)}/comments`,
      method: 'POST',
      data: payload,
    })
  )
}

export async function putAdminProgramPostReactionRemote(
  programId: string,
  postId: string,
  payload: import('@/shared/api/generated/dashboard/schemas/programPostReactionRequest').ProgramPostReactionRequest
): Promise<
  import('@/shared/api/generated/dashboard/schemas/programPostReactionMutationResponse').ProgramPostReactionMutationResponse
> {
  return unwrapApiBody(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/posts/${encodeURIComponent(postId)}/reaction`,
      method: 'PUT',
      data: payload,
    })
  )
}

export async function fetchAdminProgramSurveyResponsesRemote(
  programId: string,
  templateVersionId: string
): Promise<
  import('@/shared/api/generated/dashboard/schemas/surveyResponseListItemResponse').SurveyResponseListItemResponse[]
> {
  const body = await unwrapApiBody<
    | import('@/shared/api/generated/dashboard/schemas/surveyResponseListItemResponse').SurveyResponseListItemResponse[]
    | {
        items?: import('@/shared/api/generated/dashboard/schemas/surveyResponseListItemResponse').SurveyResponseListItemResponse[]
      }
  >(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/surveys/${encodeURIComponent(templateVersionId)}/responses`,
      method: 'GET',
    })
  )
  if (Array.isArray(body)) return body
  return body.items ?? []
}

export async function fetchAdminProgramSurveySummaryRemote(
  programId: string,
  templateVersionId: string
): Promise<
  import('@/shared/api/generated/dashboard/schemas/surveySummaryResponse').SurveySummaryResponse[]
> {
  const body = await unwrapApiBody<
    | import('@/shared/api/generated/dashboard/schemas/surveySummaryResponse').SurveySummaryResponse[]
    | {
        items?: import('@/shared/api/generated/dashboard/schemas/surveySummaryResponse').SurveySummaryResponse[]
      }
  >(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/surveys/${encodeURIComponent(templateVersionId)}/summary`,
      method: 'GET',
    })
  )
  if (Array.isArray(body)) return body
  return body.items ?? []
}
