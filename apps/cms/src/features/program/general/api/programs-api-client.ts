import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { BulkActionResponse } from '@/shared/api/generated/dashboard/schemas/bulkActionResponse'
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
  /** OpenAPI 예시 필드 — 일부 BE는 미설정 */
  nameKo?: string
  /** 실제 목록 응답에서 주로 사용 (ProgramResponse와 동일) */
  title?: string
  mainTitle?: string
  lifecycleStatus?: string
  businessYear?: number
  businessStartDate?: string
  businessEndDate?: string
  startDate?: string
  endDate?: string
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
  payload: import('@/shared/api/generated/dashboard/schemas/programCreateRequest').ProgramCreateRequest & {
    /** OpenAPI 미반영 — BE 필수. ORGANIZATION | INDIVIDUAL | BOTH */
    applicationTargetMode?: 'ORGANIZATION' | 'INDIVIDUAL' | 'BOTH'
  }
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
  payload: import('@/shared/api/generated/dashboard/schemas/programUpdateRequest').ProgramUpdateRequest & {
    applicationTargetMode?: 'ORGANIZATION' | 'INDIVIDUAL' | 'BOTH'
  }
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

const PROGRAM_BULK_DELETE_MAX = 100

function toBulkProgramNumericIds(programIds: string[]): number[] {
  const ids: number[] = []
  for (const programId of programIds) {
    const parsed = Number(programId)
    if (!Number.isFinite(parsed)) {
      throw new Error(`프로그램 일괄 삭제 ID가 유효하지 않습니다: ${programId}`)
    }
    ids.push(parsed)
  }
  return [...new Set(ids)]
}

/** POST /api/admin/programs/bulk-delete — OpenAPI BulkIdsRequest (max 100) */
export async function bulkDeleteAdminProgramsRemote(programIds: string[]): Promise<void> {
  const ids = toBulkProgramNumericIds(programIds)
  if (ids.length === 0) return

  for (let offset = 0; offset < ids.length; offset += PROGRAM_BULK_DELETE_MAX) {
    const chunk = ids.slice(offset, offset + PROGRAM_BULK_DELETE_MAX)
    const result = await unwrapApiBody<BulkActionResponse>(
      await customInstance({
        url: '/api/admin/programs/bulk-delete',
        method: 'POST',
        data: { ids: chunk },
      })
    )
    if ((result.failureCount ?? 0) > 0) {
      const firstFailure = result.failures?.[0]
      throw new Error(
        firstFailure?.message?.trim() ||
          `선택한 프로그램 중 ${result.failureCount}건을 삭제하지 못했습니다.`
      )
    }
  }
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

/** GET /api/admin/programs/{programId}/surveys/{templateVersionId}/responses/{formResponseId} */
export async function fetchAdminProgramSurveyResponseDetailRemote(
  programId: string,
  templateVersionId: string,
  formResponseId: string
): Promise<
  import('@/shared/api/generated/dashboard/schemas/surveyResponseDetailResponse').SurveyResponseDetailResponse
> {
  return unwrapApiBody(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/surveys/${encodeURIComponent(templateVersionId)}/responses/${encodeURIComponent(formResponseId)}`,
      method: 'GET',
    })
  )
}

/** GET /api/admin/programs/{programId}/form-bindings */
export async function fetchAdminProgramFormBindingsRemote(
  programId: string
): Promise<
  import('@/shared/api/generated/forms-surveys/schemas/programFormBindingResponse').ProgramFormBindingResponse[]
> {
  const body = await unwrapApiBody<
    | import('@/shared/api/generated/forms-surveys/schemas/programFormBindingResponse').ProgramFormBindingResponse[]
    | {
        items?: import('@/shared/api/generated/forms-surveys/schemas/programFormBindingResponse').ProgramFormBindingResponse[]
      }
  >(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/form-bindings`,
      method: 'GET',
    })
  )
  if (Array.isArray(body)) return body
  return body.items ?? []
}

/** POST /api/admin/programs/{programId}/form-bindings */
export async function createAdminProgramFormBindingRemote(
  programId: string,
  payload: import('@/shared/api/generated/forms-surveys/schemas/programFormBindingRequest').ProgramFormBindingRequest
): Promise<
  import('@/shared/api/generated/forms-surveys/schemas/programFormBindingResponse').ProgramFormBindingResponse
> {
  return unwrapApiBody(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/form-bindings`,
      method: 'POST',
      data: payload,
    })
  )
}

/** DELETE /api/admin/programs/{programId}/form-bindings/{bindingId} */
export async function deleteAdminProgramFormBindingRemote(
  programId: string,
  bindingId: string
): Promise<void> {
  await customInstance({
    url: `/api/admin/programs/${encodeURIComponent(programId)}/form-bindings/${encodeURIComponent(bindingId)}`,
    method: 'DELETE',
  })
}

/** GET /api/admin/programs/{programId}/managers */
export async function fetchAdminProgramManagersRemote(
  programId: string
): Promise<
  import('@/shared/api/generated/dashboard/schemas/programManagerResponse').ProgramManagerResponse[]
> {
  const body = await unwrapApiBody<
    | import('@/shared/api/generated/dashboard/schemas/programManagerResponse').ProgramManagerResponse[]
    | {
        items?: import('@/shared/api/generated/dashboard/schemas/programManagerResponse').ProgramManagerResponse[]
      }
  >(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/managers`,
      method: 'GET',
    })
  )
  if (Array.isArray(body)) return body
  return body.items ?? []
}

/** POST /api/admin/programs/{programId}/managers */
export async function addAdminProgramManagerRemote(
  programId: string,
  payload: import('@/shared/api/generated/dashboard/schemas/programAdminAssignmentRequest').ProgramAdminAssignmentRequest
): Promise<
  import('@/shared/api/generated/dashboard/schemas/programManagerResponse').ProgramManagerResponse
> {
  return unwrapApiBody(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/managers`,
      method: 'POST',
      data: payload,
    })
  )
}

/** PATCH /api/admin/programs/{programId}/managers/{assignmentId} */
export async function updateAdminProgramManagerRemote(
  programId: string,
  assignmentId: string,
  payload: import('@/shared/api/generated/dashboard/schemas/programManagerUpdateRequest').ProgramManagerUpdateRequest
): Promise<
  import('@/shared/api/generated/dashboard/schemas/programManagerResponse').ProgramManagerResponse
> {
  return unwrapApiBody(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/managers/${encodeURIComponent(assignmentId)}`,
      method: 'PATCH',
      data: payload,
    })
  )
}

/** DELETE /api/admin/programs/{programId}/managers/{assignmentId} */
export async function deleteAdminProgramManagerRemote(
  programId: string,
  assignmentId: string
): Promise<void> {
  await customInstance({
    url: `/api/admin/programs/${encodeURIComponent(programId)}/managers/${encodeURIComponent(assignmentId)}`,
    method: 'DELETE',
  })
}

/** POST /api/admin/form-responses/submit — 강의평가 등 관리자 응답 제출 */
export async function submitAdminFormResponseRemote(
  payload: import('@/shared/api/generated/forms-surveys/schemas/formResponseCreateRequest').FormResponseCreateRequest
): Promise<
  import('@/shared/api/generated/forms-surveys/schemas/formResponseResponse').FormResponseResponse
> {
  return unwrapApiBody(
    await customInstance({
      url: '/api/admin/form-responses/submit',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: payload,
    })
  )
}
