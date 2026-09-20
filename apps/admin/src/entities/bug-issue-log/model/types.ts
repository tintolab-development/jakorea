/**
 * 버그/이슈 이력
 */

export type BugIssueLog = {
  id: string
  errorMessage: string
  userName: string
  occurredAt: string
}

export type BugIssueListFilter = {
  userName?: string
  from?: string | null
  to?: string | null
  /** 0-based. omit/0 = 첫 페이지 */
  page?: number
}

export type BugIssueListResult = {
  rows: BugIssueLog[]
  total: number
}
