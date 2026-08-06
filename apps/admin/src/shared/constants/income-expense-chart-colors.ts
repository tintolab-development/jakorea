/**
 * 수입·지출 그래프 항목 색상 (노출 순서 0–9)
 * Notion: 홈페이지 어드민 2-2 수입 · 2-4 지출
 */

export const INCOME_GRAPH_COLORS = [
  '#E4EA86',
  '#BBD153',
  '#8EC85A',
  '#62BC68',
  '#46B17B',
  '#24A38A',
  '#078F72',
  '#00763D',
  '#14643F',
  '#164E35',
] as const

export const EXPENSE_GRAPH_COLORS = [
  '#285F74',
  '#277F91',
  '#01A1AF',
  '#25BEC9',
  '#4CD9E5',
  '#95E8F0',
  '#E3E24F',
  '#F2B84B',
  '#F49A81',
  '#F65F4E',
] as const

export type IncomeExpensePaletteSection = 'income' | 'expense'

/** sortOrder 0-based → 팔레트 (10색 순환) */
export function getIncomeExpenseGraphColor(
  section: IncomeExpensePaletteSection,
  orderIndex: number
): string {
  const palette = section === 'income' ? INCOME_GRAPH_COLORS : EXPENSE_GRAPH_COLORS
  const i = ((orderIndex % palette.length) + palette.length) % palette.length
  return palette[i]!
}
