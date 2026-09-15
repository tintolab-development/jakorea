import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { EducationCompletionAdminCreateRequest } from '@/shared/api/generated/dashboard/schemas/educationCompletionAdminCreateRequest'
import type { EducationCompletionCancelRequest } from '@/shared/api/generated/dashboard/schemas/educationCompletionCancelRequest'
import type { EducationCompletionResponse } from '@/shared/api/generated/dashboard/schemas/educationCompletionResponse'

function completionsUrl(programId: string): string {
  return `/api/admin/programs/${encodeURIComponent(programId)}/trained-teacher/education-completions`
}

/** 학생교육 완료 증빙 목록 — journal과 별도 SSOT */
export async function fetchTrainedTeacherEducationCompletionsRemote(
  programId: string,
  organizationApplicationId?: string
): Promise<EducationCompletionResponse[]> {
  const body = await unwrapApiBody<
    EducationCompletionResponse[] | { content?: EducationCompletionResponse[] }
  >(
    await customInstance({
      url: completionsUrl(programId),
      method: 'GET',
      params: organizationApplicationId
        ? {
            organizationApplicationId:
              Number(organizationApplicationId) || organizationApplicationId,
          }
        : undefined,
    })
  )
  if (Array.isArray(body)) return body
  return body.content ?? []
}

export async function createTrainedTeacherEducationCompletionRemote(
  programId: string,
  request: EducationCompletionAdminCreateRequest
): Promise<EducationCompletionResponse> {
  return unwrapApiBody<EducationCompletionResponse>(
    await customInstance({
      url: completionsUrl(programId),
      method: 'POST',
      data: request,
      headers: { 'Content-Type': 'application/json' },
    })
  )
}

export async function cancelTrainedTeacherEducationCompletionRemote(
  programId: string,
  completionId: string,
  request: EducationCompletionCancelRequest
): Promise<EducationCompletionResponse> {
  return unwrapApiBody<EducationCompletionResponse>(
    await customInstance({
      url: `${completionsUrl(programId)}/${encodeURIComponent(completionId)}/cancel`,
      method: 'POST',
      data: request,
      headers: { 'Content-Type': 'application/json' },
    })
  )
}
