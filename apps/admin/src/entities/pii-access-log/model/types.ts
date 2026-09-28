/**
 * 개인정보 조회 이력
 */

export type PiiAccessLog = {
  id: string
  targetName: string
  purpose: string
  accessorName: string
  accessedAt: string
  ip: string
}

export type PiiAccessListFilter = {
  targetName?: string
  purpose?: string
  accessorName?: string
  from?: string | null
  to?: string | null
  /** 0-based. omit/0 = 첫 페이지 */
  page?: number
}

export type PiiAccessListResult = {
  rows: PiiAccessLog[]
  total: number
}
