import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { FormResponseResponse } from '@/shared/api/generated/forms-surveys/schemas/formResponseResponse'
import type { PageResponseFormResponseResponse } from '@/shared/api/generated/forms-surveys/schemas/pageResponseFormResponseResponse'

export type FormResponseContextType =
  | 'ORGANIZATION_APPLICATION'
  | 'INSTRUCTOR_APPLICATION'
  | 'VOLUNTEER_APPLICATION'
  | (string & {})

export type ListFormResponsesQuery = {
  programId?: number
  contextType?: FormResponseContextType
  contextId?: number
  page?: number
  size?: number
}

/** GET /api/admin/form-responses */
export async function listFormResponsesRemote(
  params?: ListFormResponsesQuery
): Promise<PageResponseFormResponseResponse> {
  return unwrapApiBody<PageResponseFormResponseResponse>(
    await customInstance({
      url: '/api/admin/form-responses',
      method: 'GET',
      params,
    })
  )
}

/** GET /api/admin/form-responses/{responseId} */
export async function getFormResponseRemote(
  responseId: number
): Promise<FormResponseResponse> {
  return unwrapApiBody<FormResponseResponse>(
    await customInstance({
      url: `/api/admin/form-responses/${encodeURIComponent(String(responseId))}`,
      method: 'GET',
    })
  )
}

/**
 * context 기준 최신 form_response 상세 (answers 포함).
 * list → id로 get 하여 answers를 확실히 로드한다.
 */
export async function fetchLatestFormResponseByContextRemote(input: {
  programId: number
  contextType: FormResponseContextType
  contextId: number
}): Promise<FormResponseResponse | null> {
  const page = await listFormResponsesRemote({
    programId: input.programId,
    contextType: input.contextType,
    contextId: input.contextId,
    page: 0,
    size: 5,
  })
  const first = page.items?.[0]
  const responseId = first?.formResponseId
  if (responseId == null) return first ?? null
  try {
    return await getFormResponseRemote(responseId)
  } catch {
    return first ?? null
  }
}
