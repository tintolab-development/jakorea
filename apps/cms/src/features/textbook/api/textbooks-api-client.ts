import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { getJAKoreaCMSBackendAPIDataManagementSubset } from '@/shared/api/generated/data-management/data-management-api'
import type {
  PageResponseTextbookResponse,
  TextbookRequest,
  TextbookResponse,
  TextbooksParams,
} from '@/shared/api/generated/data-management/schemas'

const dmApi = getJAKoreaCMSBackendAPIDataManagementSubset()

export async function fetchTextbooksRemote(
  params: TextbooksParams
): Promise<PageResponseTextbookResponse> {
  return unwrapApiBody(await dmApi.textbooks(params))
}

export async function fetchTextbookRemote(id: string): Promise<TextbookResponse> {
  return unwrapApiBody(await dmApi.textbook(id))
}

export async function createTextbookRemote(body: TextbookRequest): Promise<TextbookResponse> {
  return unwrapApiBody(await dmApi.create(body))
}

export async function updateTextbookRemote(
  id: string,
  body: TextbookRequest
): Promise<TextbookResponse> {
  return unwrapApiBody(await dmApi.update(id, body))
}

export async function deleteTextbookRemote(id: string): Promise<void> {
  await dmApi._delete(id)
}
