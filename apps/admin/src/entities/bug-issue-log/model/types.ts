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
}

export type BugIssueListResult = {
  rows: BugIssueLog[]
  total: number
}
