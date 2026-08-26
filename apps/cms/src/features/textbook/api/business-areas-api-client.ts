import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { getJAKoreaCMSBackendAPIDataManagementSubset } from '@/shared/api/generated/data-management/data-management-api'
import type {
  PageResponseTextbookBusinessAreaResponse,
  TextbookBusinessAreaRequest,
  TextbookBusinessAreaResponse,
} from '@/shared/api/generated/data-management/schemas'

const dmApi = getJAKoreaCMSBackendAPIDataManagementSubset()

const LIST_PAGE_SIZE = 100

export async function fetchTextbookBusinessAreasRemote(): Promise<TextbookBusinessAreaResponse[]> {
  const page = unwrapApiBody<PageResponseTextbookBusinessAreaResponse>(
    await dmApi.list({ page: 0, size: LIST_PAGE_SIZE })
  )
  return page.items ?? []
}

export async function createTextbookBusinessAreaRemote(
  name: string
): Promise<TextbookBusinessAreaResponse> {
  const body: TextbookBusinessAreaRequest = { name, businessAreaName: name }
  return unwrapApiBody(await dmApi.create2(body))
}

export async function updateTextbookBusinessAreaRemote(
  id: string,
  name: string
): Promise<TextbookBusinessAreaResponse> {
  const body: TextbookBusinessAreaRequest = { name, businessAreaName: name }
  return unwrapApiBody(await dmApi.update1(id, body))
}

export async function deleteTextbookBusinessAreaRemote(id: string): Promise<void> {
  await dmApi.delete1(id)
}
