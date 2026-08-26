import type { AdminPostsPendingDateRange } from '@/features/posts/lib/url-date-range-pending-sync'

/** 문의 관리 목록 — 필터·URL 동기화 */
export type AdminInquiryStatusFilter = 'ALL' | 'PENDING' | 'ANSWERED'

export type AdminInquiryCategoryFilter = 'ALL' | string

export interface AdminInquiryPendingFilters extends Record<string, unknown> {
  status: AdminInquiryStatusFilter
  category: AdminInquiryCategoryFilter
  programName: string
  title: string
  memberName: string
  assigneeName: string
  dateRange: AdminPostsPendingDateRange
}

export type InquiryCategoryRow = {
  id: string
  name: string
}

export type AdminInquiryTableContext = {
  allowedCategoryLabels: readonly string[]
}

/** 관리자 문의 목록 행 (사용자용 `Inquiry`와 별도) */
export type AdminInquiryRow = {
  id: string
  title: string
  category: string
  status: 'PENDING' | 'ANSWERED'
  createdAt: string
  memberName: string
  programName: string | null
  programId?: string
  assignee: string | null
  answeredAt: string | null
  /** 문의 본문 (mock) */
  body: string
  phone: string
  email: string
  /** 관리자 답변 마크다운 (mock) */
  answerMarkdown: string | null
}

/** 상세 모달 — 동일 스키마로 조회 */
export type AdminInquiryDetail = AdminInquiryRow
