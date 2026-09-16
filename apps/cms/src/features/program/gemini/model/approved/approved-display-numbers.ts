import type { GeminiApprovedTrainingRow } from './types'

export function assignApprovedTrainingNumbers(
  rows: GeminiApprovedTrainingRow[]
): GeminiApprovedTrainingRow[] {
  const sorted = [...rows].sort((a, b) => b.id.localeCompare(a.id))
  const total = sorted.length
  return sorted.map((row, index) => ({
    ...row,
    no: total - index,
  }))
}
