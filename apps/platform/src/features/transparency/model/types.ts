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

export type TransparencyReportType = 'annual' | 'audit'

export type TransparencyReport = {
  id: string
  /** 카드 하단 타이틀 (예: 2025 Annual Report JA Korea) */
  title: string
  /** 회계감사 카드 하단 게시일 (예: 2026년 05월 08일) */
  date?: string
  /** 커버 placeholder 텍스트 — 실이미지(coverUrl) 없을 때 표시 */
  coverLabel: string
  /** 커버 placeholder 그라디언트 CSS 값 */
  coverGradient: string
  /** 실제 커버 이미지 URL (있으면 그라디언트 대신 사용) */
  coverUrl?: string
  /** 다운로드 파일명 */
  fileName: string
}

export type TransparencyReportsListParams = {
  q: string
  page: number
}
