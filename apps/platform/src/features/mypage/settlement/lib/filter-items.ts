import type { SettlementOverviewItem, SettlementOverviewParams } from '../model/types.ts'
import { isoDateKey } from './date-keys.ts'

function itemOverlapsMonth(item: SettlementOverviewItem, monthKey: string) {
  const startKey = isoDateKey(item.startsAt)
  const endKey = isoDateKey(item.endsAt)
  if (!startKey || !endKey) return false
  const monthStart = `${monthKey}-01`
  const [year, month] = monthKey.split('-').map(Number)
  const lastDay = new Date(year, month, 0).getDate()
  const monthEnd = `${monthKey}-${String(lastDay).padStart(2, '0')}`
  return startKey <= monthEnd && endKey >= monthStart
}

export function matchesSettlementSearch(item: SettlementOverviewItem, q: string) {
  const query = q.trim().toLowerCase()
  if (!query) return true
  return `${item.programName} ${item.organizationName}`.toLowerCase().includes(query)
}

export function filterSettlementListItems(
  items: SettlementOverviewItem[],
  params: Pick<SettlementOverviewParams, 'q' | 'status' | 'month'>,
) {
  return items.filter(item => {
    if (params.status !== 'all' && item.status !== params.status) return false
    if (!matchesSettlementSearch(item, params.q)) return false
    return itemOverlapsMonth(item, params.month)
  })
}

export function filterSettlementCalendarItems(
  items: SettlementOverviewItem[],
  params: Pick<SettlementOverviewParams, 'q' | 'status'>,
) {
  return items.filter(item => {
    if (params.status !== 'all' && item.status !== params.status) return false
    return matchesSettlementSearch(item, params.q)
  })
}

export function compareSettlementItems(a: SettlementOverviewItem, b: SettlementOverviewItem) {
  const startDiff = new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()
  if (startDiff !== 0) return startDiff
  return b.id.localeCompare(a.id)
}

export function withListNumbers(items: SettlementOverviewItem[]) {
  const sorted = [...items].sort(compareSettlementItems)
  const total = sorted.length
  return sorted.map((item, index) => ({
    item,
    no: total - index,
  }))
}
