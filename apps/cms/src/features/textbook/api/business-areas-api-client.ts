import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { getDataManagementSubsetApi } from '@/features/data-management/api/data-management-subset-api'
import type {
  PageResponseTextbookBusinessAreaResponse,
  TextbookBusinessAreaRequest,
  TextbookBusinessAreaResponse,
} from '@/shared/api/generated/data-management/schemas'

const LIST_PAGE_SIZE = 20

export async function fetchTextbookBusinessAreasRemote(): Promise<TextbookBusinessAreaResponse[]> {
  const rows: TextbookBusinessAreaResponse[] = []
  const seen = new Set<string>()
  for (let pageIndex = 0; ; pageIndex += 1) {
    const page = unwrapApiBody<PageResponseTextbookBusinessAreaResponse>(
      await getDataManagementSubsetApi().list1({ page: pageIndex, size: LIST_PAGE_SIZE })
    )
    const items = page.items ?? []
    if (page.page != null && page.page !== pageIndex) {
      throw new Error('사업 분야 목록의 페이지 응답이 올바르지 않습니다.')
    }
    for (const item of items) {
      if (item.id && seen.has(item.id)) throw new Error('사업 분야 목록이 변경되었습니다. 다시 시도해 주세요.')
      if (item.id) seen.add(item.id)
      rows.push(item)
    }
    if (items.length === 0 || (page.totalPages != null
      ? pageIndex + 1 >= page.totalPages
      : items.length < LIST_PAGE_SIZE)) return rows
  }
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
