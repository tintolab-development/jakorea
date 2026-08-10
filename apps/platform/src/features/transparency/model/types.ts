export type TransparencyPrincipleIcon =
  | 'audit'
  | 'governance'
  | 'privacy'
  | 'asset'
  | 'partnership'

export type TransparencyPrinciple = {
  id: string
  icon: TransparencyPrincipleIcon
  title: string
  /** 시안 기준 줄바꿈 단위 문장 */
  description: string[]
}

/** 도넛 차트·테이블 공용 재정 항목 */
export type FinanceSlice = {
  id: string
  label: string
  /** 표기용 비율 문자열 (예: '0.20') — 차트 값은 Number() 파생 */
  percent: string
  amount: number
  color: string
}

export type FinanceSummary = {
  slices: FinanceSlice[]
  totalLabel: string
  totalAmount: number
}

export type ExpenseDetailRow = {
  id: string
  label: string
  percent: string
  amount: number
}

export type ExpenseDetailGroup = {
  id: string
  label: string
  rows: ExpenseDetailRow[]
  subtotal: {
    label: string
    percent: string
    amount: number
  }
}
