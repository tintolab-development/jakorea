/**
 * 수입·지출 표시 포맷 · 합계 유틸
 */

import type {
  ExpenseCategory,
  FinanceItem,
} from '@/entities/income-expense/model/types'

export function formatRatioDisplay(value: number): string {
  if (!Number.isFinite(value)) return '0%'
  return `${Number(value.toFixed(2))}%`
}

export function formatAmount(value: number): string {
  if (!Number.isFinite(value)) return '0원'
  return `${Math.round(value).toLocaleString('ko-KR')}원`
}

export function sumRatio(items: FinanceItem[]): number {
  return items.reduce((acc, row) => acc + (Number.isFinite(row.ratio) ? row.ratio : 0), 0)
}

export function sumAmount(items: FinanceItem[]): number {
  return items.reduce((acc, row) => acc + (Number.isFinite(row.amount) ? row.amount : 0), 0)
}

export function sumByCategory(
  items: FinanceItem[],
  category: ExpenseCategory
): { ratio: number; amount: number } {
  const filtered = items.filter(row => row.category === category)
  return { ratio: sumRatio(filtered), amount: sumAmount(filtered) }
}

export function parseRatioInput(raw: string): number | null {
  const cleaned = raw.replace(/%/g, '').replace(/,/g, '').trim()
  if (cleaned === '') return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

export function parseAmountInput(raw: string): number | null {
  const cleaned = raw.replace(/원/g, '').replace(/,/g, '').trim()
  if (cleaned === '') return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}
