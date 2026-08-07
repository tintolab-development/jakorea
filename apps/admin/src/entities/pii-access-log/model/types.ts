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
  purpose?: string
  accessorName?: string
  from?: string | null
  to?: string | null
}

export type PiiAccessListResult = {
  rows: PiiAccessLog[]
  total: number
}
