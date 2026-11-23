/**
 * 수입·지출 표시 포맷 · 합계 유틸
 */

import type {
  ExpenseCategory,
  FinanceItem,
} from '@/entities/income-expense/model/types'
import { formatNumberDisplay } from '@/shared/lib/format-display'

export function formatRatioDisplay(value: number): string {
  if (!Number.isFinite(value)) return '0%'
  return `${formatNumberDisplay(Number(value.toFixed(2)))}%`
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

/** 비율 입력 — 백엔드 규칙과 같이 0~100, 소수 4자리까지 */
const RATIO_MAX = 100
const RATIO_PATTERN = /^\d{0,3}(\.\d{0,4})?$/

/**
 * 비율 입력 중 정리 — 숫자·소수점만 남긴다(`12.5%` 붙여넣기 → `12.5`).
 * 소수점이 둘 이상이거나 자리수·100 초과면 null(입력 무시, 이전 값 유지).
 */
export function sanitizeRatioInput(raw: string): string | null {
  const cleaned = raw
    .replace(/[０-９]/g, d => String.fromCharCode(d.charCodeAt(0) - 0xfee0))
    .replace(/．/g, '.')
    .replace(/[^\d.]/g, '')
  if (!RATIO_PATTERN.test(cleaned)) return null
  if (cleaned !== '' && cleaned !== '.' && Number(cleaned) > RATIO_MAX) return null
  return cleaned
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
