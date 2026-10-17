import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { getDataManagementSubsetApi } from '@/features/data-management/api/data-management-subset-api'
import type {
  PageResponseTextbookBusinessAreaResponse,
  TextbookBusinessAreaRequest,
  TextbookBusinessAreaResponse,
} from '@/shared/api/generated/data-management/schemas'

const LIST_PAGE_SIZE = 20

export async function fetchTextbookBusinessAreasRemote(): Promise<TextbookBusinessAreaResponse[]> {
  const page = unwrapApiBody<PageResponseTextbookBusinessAreaResponse>(
    await getDataManagementSubsetApi().list1({ page: 0, size: LIST_PAGE_SIZE })
  )
  return page.items ?? []
}

export async function createTextbookBusinessAreaRemote(
  name: string
): Promise<TextbookBusinessAreaResponse> {
  const body: TextbookBusinessAreaRequest = { name, businessAreaName: name }
  return unwrapApiBody(await getDataManagementSubsetApi().create2(body))
}

export async function updateTextbookBusinessAreaRemote(
  id: string,
  name: string
): Promise<TextbookBusinessAreaResponse> {
  const body: TextbookBusinessAreaRequest = { name, businessAreaName: name }
  return unwrapApiBody(await getDataManagementSubsetApi().update2(id, body))
}

export async function deleteTextbookBusinessAreaRemote(id: string): Promise<void> {
  await getDataManagementSubsetApi().delete1(id)
}
