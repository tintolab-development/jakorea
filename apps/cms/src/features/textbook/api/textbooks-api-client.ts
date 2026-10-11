import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import {
  assertBulkDeleteSucceeded,
  forEachBulkIdChunk,
  toBulkNumericIds,
} from '@/features/data-management/api/bulk-delete'
import { getDataManagementSubsetApi } from '@/features/data-management/api/data-management-subset-api'
import type {
  BulkActionResponse,
  MatchesParams,
  PageResponseTextbookResponse,
  TextbookMatchResponse,
  TextbookRequest,
  TextbookResponse,
  TextbooksParams,
} from '@/shared/api/generated/data-management/schemas'

export async function fetchTextbooksRemote(
  params: TextbooksParams
): Promise<PageResponseTextbookResponse> {
  return unwrapApiBody(await getDataManagementSubsetApi().textbooks(params))
}

export async function fetchTextbookRemote(id: string): Promise<TextbookResponse> {
  return unwrapApiBody(await getDataManagementSubsetApi().textbook(id))
}

export async function createTextbookRemote(body: TextbookRequest): Promise<TextbookResponse> {
  // POST /api/admin/textbooks (Orval create1)
  return unwrapApiBody(await getDataManagementSubsetApi().create1(body))
}

export async function updateTextbookRemote(
  id: string,
  body: TextbookRequest
): Promise<TextbookResponse> {
  return unwrapApiBody(await getDataManagementSubsetApi().update1(id, body))
}

export async function deleteTextbookRemote(id: string): Promise<void> {
  await getDataManagementSubsetApi()._delete(id)
}

export async function bulkDeleteTextbooksRemote(ids: string[]): Promise<void> {
  await forEachBulkIdChunk(ids, async chunk => {
    const result = unwrapApiBody<BulkActionResponse>(
      await getDataManagementSubsetApi().bulkDelete({ ids: toBulkNumericIds(chunk) })
    )
    assertBulkDeleteSucceeded(result, '교재 일괄 삭제에 실패했습니다.')
  })
}

export async function fetchTextbookMatchesRemote(
  params?: MatchesParams
): Promise<TextbookMatchResponse[]> {
  const payload = await getDataManagementSubsetApi().matches(params)
  const body = unwrapApiBody<TextbookMatchResponse[] | { items?: TextbookMatchResponse[] }>(
    payload
  )
  if (Array.isArray(body)) return body
  return body.items ?? []
}
