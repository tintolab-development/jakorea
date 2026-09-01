/**
 * 후원사 관리 상세 풀페이지 URL (`/sponsor?sponsorId=…&sponsorLnb=sponsor-detail`)
 */

import type { QueryClient } from '@tanstack/react-query'
import { resolveSponsorManagementIdForDetailLinkAsync } from '@/features/sponsor/lib/sponsor-resolve'

export const SPONSOR_PAGE_PATH = '/sponsor' as const
export const SPONSOR_DETAIL_LNB = 'sponsor-detail' as const
/** 프로그램 상세 등 진입 경로 — 닫기 시 복귀용 */
export const SPONSOR_DETAIL_RETURN_TO_PARAM = 'returnTo' as const

/** same-origin 상대 경로만 허용 (open redirect 방지) */
export function sanitizeInternalReturnTo(value: string | null | undefined): string | null {
  if (!value?.trim()) return null
  let decoded = value.trim()
  try {
    decoded = decodeURIComponent(decoded)
  } catch {
    return null
  }
  if (!decoded.startsWith('/') || decoded.startsWith('//')) return null
  return decoded
}

export function buildSponsorDetailPageUrl(
  sponsorManagementId: string,
  returnTo?: string | null
): string {
  const params = new URLSearchParams({
    sponsorId: sponsorManagementId,
    sponsorLnb: SPONSOR_DETAIL_LNB,
  })
  const safeReturnTo = sanitizeInternalReturnTo(returnTo)
  if (safeReturnTo) {
    params.set(SPONSOR_DETAIL_RETURN_TO_PARAM, safeReturnTo)
  }
  return `${SPONSOR_PAGE_PATH}?${params.toString()}`
}

/**
 * 프로그램 `sponsorId`(legacy) 또는 표시명 → 후원사 관리 목록 id
 */
export async function resolveSponsorManagementIdForDetailLink(
  queryClient: QueryClient,
  input: {
    sponsorId?: string | null
    sponsorName?: string | null
    sponsorManagementId?: string | null
  }
): Promise<string | undefined> {
  return resolveSponsorManagementIdForDetailLinkAsync(queryClient, input)
}
