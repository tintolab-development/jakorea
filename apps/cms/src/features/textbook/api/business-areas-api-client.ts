import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type {
  PageResponseTextbookBusinessAreaResponse,
  TextbookBusinessAreaRequest,
  TextbookBusinessAreaResponse,
} from '@/shared/api/generated/data-management/schemas'

const LIST_PAGE_SIZE = 100

export async function fetchTextbookBusinessAreasRemote(): Promise<TextbookBusinessAreaResponse[]> {
  const page = unwrapApiBody<PageResponseTextbookBusinessAreaResponse>(
    await customInstance({
      url: '/api/admin/textbook-business-areas',
      method: 'GET',
      params: { page: 0, size: LIST_PAGE_SIZE },
    })
  )
  return page.items ?? []
}

export async function createTextbookBusinessAreaRemote(
  name: string
): Promise<TextbookBusinessAreaResponse> {
  const body: TextbookBusinessAreaRequest = { name, businessAreaName: name }
  return unwrapApiBody(
    await customInstance({
      url: '/api/admin/textbook-business-areas',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: body,
    })
  )
}

export async function updateTextbookBusinessAreaRemote(
  id: string,
  name: string
): Promise<TextbookBusinessAreaResponse> {
  const body: TextbookBusinessAreaRequest = { name, businessAreaName: name }
  return unwrapApiBody(
    await customInstance({
      url: `/api/admin/textbook-business-areas/${encodeURIComponent(id)}`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      data: body,
    })
  )
}

export async function deleteTextbookBusinessAreaRemote(id: string): Promise<void> {
  await customInstance({
    url: `/api/admin/textbook-business-areas/${encodeURIComponent(id)}`,
    method: 'DELETE',
  })
}
