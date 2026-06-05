/**
 * 프로그램 상세 URL 쿼리 스택 — 후원사 상세 오버레이 (`?programId=…&sponsorId=…&sponsorLnb=…`)
 */

import { mockSponsorManagementListRows } from '@/data/mock/sponsor-management-list'
import { isGeneralProgramListPath } from '@/features/program/general/lib/detail-url'
import type { SponsorManagementRow } from '@/features/sponsor/model/sponsor-management.types'
import { SPONSOR_DETAIL_LNB } from '@/features/sponsor/lib/sponsor-detail-page-url'

export const SPONSOR_DETAIL_QUERY_ID_PARAM = 'sponsorId' as const
export const SPONSOR_DETAIL_QUERY_LNB_PARAM = 'sponsorLnb' as const

export function isUjatProgramListPath(pathname: string): boolean {
  const p = pathname.replace(/\/$/, '') || '/'
  return p === '/programs/ujat' || p.startsWith('/programs/ujat/')
}

/** 일반·UJAT 프로그램 상세 — 후원사 링크는 `/sponsor` 이동 없이 쿼리 스택 */
export function isProgramDetailSponsorQueryStackPath(pathname: string): boolean {
  return isGeneralProgramListPath(pathname) || isUjatProgramListPath(pathname)
}

export function resolveSponsorManagementRowById(
  sponsorManagementId: string | null | undefined
): SponsorManagementRow | undefined {
  const id = sponsorManagementId?.trim()
  if (!id) return undefined
  return mockSponsorManagementListRows.find(row => row.id === id)
}

export function appendSponsorDetailQueryStack(
  searchParams: URLSearchParams,
  sponsorManagementId: string
): URLSearchParams {
  const next = new URLSearchParams(searchParams)
  next.set(SPONSOR_DETAIL_QUERY_ID_PARAM, sponsorManagementId)
  next.set(SPONSOR_DETAIL_QUERY_LNB_PARAM, SPONSOR_DETAIL_LNB)
  return next
}

export function clearSponsorDetailQueryStack(searchParams: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(searchParams)
  next.delete(SPONSOR_DETAIL_QUERY_ID_PARAM)
  next.delete(SPONSOR_DETAIL_QUERY_LNB_PARAM)
  return next
}

export function readSponsorDetailQueryStack(searchParams: URLSearchParams): {
  sponsorId: string | null
  sponsorLnb: string | null
} {
  return {
    sponsorId: searchParams.get(SPONSOR_DETAIL_QUERY_ID_PARAM),
    sponsorLnb: searchParams.get(SPONSOR_DETAIL_QUERY_LNB_PARAM),
  }
}
