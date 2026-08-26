import type { TextbookBusinessAreaRow } from '@/features/textbook/model/business-area.types'

export function hasDuplicateBusinessAreaName(
  rows: readonly TextbookBusinessAreaRow[],
  name: string,
  excludeId?: string
): boolean {
  const normalized = name.trim()
  return rows.some(row => row.id !== excludeId && row.name === normalized)
}
