import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { getDataManagementSubsetApi } from '@/features/data-management/api/data-management-subset-api'
import type {
  PageResponseTextbookBusinessAreaResponse,
  TextbookBusinessAreaRequest,
  TextbookBusinessAreaResponse,
} from '@/shared/api/generated/data-management/schemas'

const LIST_PAGE_SIZE = 20

type BusinessAreaListOptions = { signal?: AbortSignal; skipGlobalErrorAlert?: boolean }

export async function fetchTextbookBusinessAreasRemote(options?: BusinessAreaListOptions): Promise<TextbookBusinessAreaResponse[]> {
  const rows: TextbookBusinessAreaResponse[] = []
  const seen = new Set<string>()
  let expectedTotalPages: number | undefined
  let expectedTotalElements: number | undefined
  for (let pageIndex = 0; pageIndex < 1000; pageIndex += 1) {
    const page = unwrapApiBody<PageResponseTextbookBusinessAreaResponse>(
      await getDataManagementSubsetApi().list1({ page: pageIndex, size: LIST_PAGE_SIZE }, options)
    )
    const items = page.items
    if (!Array.isArray(items) || items.length > LIST_PAGE_SIZE) {
      throw new Error('사업 분야 목록의 페이지 응답이 올바르지 않습니다.')
    }
    if (page.totalPages != null) {
      if (!Number.isInteger(page.totalPages) || page.totalPages < 0 ||
          (expectedTotalPages != null && page.totalPages !== expectedTotalPages)) {
        throw new Error('사업 분야 목록이 변경되었습니다. 다시 시도해 주세요.')
      }
      expectedTotalPages = page.totalPages
    }
    if (page.totalElements != null) {
      if (!Number.isInteger(page.totalElements) || page.totalElements < 0 ||
          (expectedTotalElements != null && page.totalElements !== expectedTotalElements)) {
        throw new Error('사업 분야 목록이 변경되었습니다. 다시 시도해 주세요.')
      }
      expectedTotalElements = page.totalElements
    }
    if (page.page != null && page.page !== pageIndex) {
      throw new Error('사업 분야 목록의 페이지 응답이 올바르지 않습니다.')
    }
    for (const item of items) {
      if (item.id && seen.has(item.id)) throw new Error('사업 분야 목록이 변경되었습니다. 다시 시도해 주세요.')
      if (item.id) seen.add(item.id)
      rows.push(item)
    }
    const lastPage = expectedTotalPages != null
      ? pageIndex + 1 >= expectedTotalPages
      : items.length < LIST_PAGE_SIZE
    if (lastPage) {
      if (expectedTotalElements != null && rows.length !== expectedTotalElements) {
        throw new Error('사업 분야 목록이 변경되었습니다. 다시 시도해 주세요.')
      }
      return rows
    }
    if (items.length === 0 || items.length < LIST_PAGE_SIZE) {
      throw new Error('사업 분야 목록이 변경되었습니다. 다시 시도해 주세요.')
    }
  }
  throw new Error('사업 분야 목록의 페이지 제한을 초과했습니다.')
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
