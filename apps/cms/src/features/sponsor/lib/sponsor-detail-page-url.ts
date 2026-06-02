/**
 * 후원사 관리 상세 풀페이지 URL (`/sponsor?sponsorId=…&sponsorLnb=sponsor-detail`)
 */

import { mockSponsorManagementListRows } from '@/data/mock/sponsor-management-list'
import { mockSponsors } from '@/data/mock/sponsors'

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

function normalizeSponsorName(name: string): string {
  return name.replace(/\s+/g, '').toLowerCase()
}

/** legacy `mockSponsors` 명칭 → 후원사 관리 목록 명칭 */
const SPONSOR_DETAIL_LINK_NAME_ALIASES: Record<string, string> = {
  'JA Korea 고유목적사업': '제이에이코리아',
  'JA코리아': '제이에이코리아',
  '한국 씨티은행': '한국씨티은행',
}

function findSponsorManagementRowByName(name: string) {
  const trimmed = name.trim()
  if (!trimmed) return undefined

  const exact = mockSponsorManagementListRows.find(r => r.name === trimmed)
  if (exact) return exact

  const aliasTarget = SPONSOR_DETAIL_LINK_NAME_ALIASES[trimmed]
  if (aliasTarget) {
    const byAlias = mockSponsorManagementListRows.find(r => r.name === aliasTarget)
    if (byAlias) return byAlias
  }

  const normalized = normalizeSponsorName(trimmed)
  return mockSponsorManagementListRows.find(r => normalizeSponsorName(r.name) === normalized)
}

/**
 * 프로그램 `sponsorId`(legacy mock) 또는 표시명 → 후원사 관리 목록 id (`sponsor-list-*`)
 */
export function resolveSponsorManagementIdForDetailLink(input: {
  sponsorId?: string | null
  sponsorName?: string | null
  sponsorManagementId?: string | null
}): string | undefined {
  const explicit = input.sponsorManagementId?.trim()
  if (
    explicit &&
    mockSponsorManagementListRows.some(row => row.id === explicit)
  ) {
    return explicit
  }

  const id = input.sponsorId?.trim()
  if (id?.startsWith('sponsor-list-')) {
    if (mockSponsorManagementListRows.some(row => row.id === id)) return id
  }

  const name = input.sponsorName?.trim()
  if (name) {
    const byName = findSponsorManagementRowByName(name)
    if (byName) return byName.id
  }

  if (id) {
    const legacy = mockSponsors.find(s => s.id === id)
    if (legacy?.name) {
      const byLegacyName = findSponsorManagementRowByName(legacy.name)
      if (byLegacyName) return byLegacyName.id
    }
  }

  return undefined
}
