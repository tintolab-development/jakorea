/**
 * 공개 투명경영 — Homepage Admin OpenAPI 계약
 * GET /api/public/ja-korea/transparency
 * GET /api/public/ja-korea/transparency/reports/{type}
 */

export type PublicPrincipleResponse = {
  id?: number
  itemCode?: string
  iconCode?: string
  title?: string
  subText?: string
  displayOrder?: number
}

export type PublicFinanceItemExpenseCategory = 'DIRECT_PROGRAM' | 'OTHER'

export type PublicFinanceItemResponse = {
  id?: number
  expenseCategory?: PublicFinanceItemExpenseCategory
  itemName?: string
  ratio?: number
  amount?: number
  displayOrder?: number
  colorHex?: string
}

export type PublicFinanceSummaryResponse = {
  section?: 'INCOME' | 'EXPENSE'
  view?: 'CHART' | 'TABLE'
  totalRatio?: number
  totalAmount?: number
  directProgramRatio?: number
  directProgramAmount?: number
  otherRatio?: number
  otherAmount?: number
  items?: PublicFinanceItemResponse[]
}

export type PublicTransparencyResponse = {
  introSubText?: string
  introMainText?: string
  principles?: PublicPrincipleResponse[]
  incomeChart?: PublicFinanceSummaryResponse
  incomeTable?: PublicFinanceSummaryResponse
  expenseChart?: PublicFinanceSummaryResponse
  expenseTable?: PublicFinanceSummaryResponse
  disclosureUrl?: string
}

export type PublicReportType = 'ANNUAL' | 'AUDIT'

export type PublicReportResponse = {
  id?: number
  reportType?: PublicReportType
  title?: string
  thumbnailUrl?: string | null
  attachmentFileName?: string
  downloadUrl?: string
  downloadCount?: number
  createdAt?: string
}

export type PublicReportListPage = {
  items?: PublicReportResponse[]
  totalCount?: number
  page?: number
  size?: number
  totalPages?: number
}

export type PublicReportListQuery = {
  /** 제목 부분일치. 빈 값이면 보내지 않음 */
  q?: string
  page?: number
  size?: number
}
