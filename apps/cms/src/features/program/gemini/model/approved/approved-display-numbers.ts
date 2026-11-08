import type { GeminiApprovedTrainingRow } from './types'

export function assignApprovedTrainingNumbers(
  rows: GeminiApprovedTrainingRow[]
): GeminiApprovedTrainingRow[] {
  const sorted = [...rows].sort((a, b) => b.id.localeCompare(a.id))
  return sorted.map((row, index) => ({
    ...row,
    no: index + 1,
  }))
}
