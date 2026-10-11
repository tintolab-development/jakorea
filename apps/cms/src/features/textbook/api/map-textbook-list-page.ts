import {
  DATA_MANAGEMENT_LIST_PAGE_SIZE,
  type DataManagementListPage,
} from '@/features/data-management/api/data-management-list-page'
import { mapTextbookResponse } from '@/features/textbook/api/adapters/textbook-adapters'
import type { TextbookRow } from '@/features/textbook/model/textbook.types'
import type { PageResponseTextbookResponse } from '@/shared/api/generated/data-management/schemas'

function readFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export function mapTextbookListPage(
  dto: PageResponseTextbookResponse
): DataManagementListPage<TextbookRow> {
  const items = (dto.items ?? []).map(mapTextbookResponse)
  const page = readFiniteNumber(dto.page, 0)
  const size = readFiniteNumber(dto.size, DATA_MANAGEMENT_LIST_PAGE_SIZE)
  const totalElements = readFiniteNumber(dto.totalElements, items.length)
  const totalPages = readFiniteNumber(
    dto.totalPages,
    size > 0 ? Math.ceil(totalElements / size) : 0
  )
  const hasNext = page + 1 < totalPages

  return { items, page, size, totalElements, totalPages, hasNext }
}
