/**
 * 수입&지출 관리 도메인 타입
 */

export type FinanceSection = 'income' | 'expense'
export type FinanceViewKind = 'graph' | 'table'
/** 직접사업비 / 직접사업비 이외 비용 */
export type ExpenseCategory = 'direct' | 'indirect'

export const MAX_GRAPH_ITEMS = 10

export class GraphItemLimitError extends Error {
  readonly name = 'GraphItemLimitError'
  constructor(
    message = `그래프 항목은 최대 ${MAX_GRAPH_ITEMS}개까지 등록할 수 있습니다.`
  ) {
    super(message)
  }
}

export type FinanceItem = {
  id: string
  name: string
  /** 비율 (%) */
  ratio: number
  /** 금액 (원) */
  amount: number
  sortOrder: number
  /** 지출 테이블 항목만 필수 */
  category?: ExpenseCategory
}

export type FinanceItemCreateInput = {
  name: string
  ratio: number
  amount: number
  category?: ExpenseCategory
}

export type FinanceItemUpdatePatch = {
  id: string
  name: string
  ratio: number
  amount: number
  category?: ExpenseCategory
}

export type FinanceListKey = {
  section: FinanceSection
  view: FinanceViewKind
}

export type IncomeExpenseFileData = {
  income: {
    graph: FinanceItem[]
    table: FinanceItem[]
  }
  expense: {
    graph: FinanceItem[]
    table: FinanceItem[]
  }
}

export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  direct: '직접사업비',
  indirect: '직접사업비 이외 비용',
}
