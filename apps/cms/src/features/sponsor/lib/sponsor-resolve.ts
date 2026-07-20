import type { QueryClient } from '@tanstack/react-query'
import { findSponsorByKeyword, resolveSponsorRowById } from '@/features/sponsor/lib/sponsor-lookup'
import type { SponsorManagementRow } from '@/features/sponsor/model/sponsor-management.types'
import { shouldUseSponsorsRemoteApi } from '@/features/sponsor/api/admin-sponsors-service'

function normalizeSponsorName(name: string): string {
  return name.replace(/\s+/g, '').toLowerCase()
}

/** legacy 명칭 → 후원사 관리 목록 명칭 */
const SPONSOR_DETAIL_LINK_NAME_ALIASES: Record<string, string> = {
  'JA Korea 고유목적사업': '제이에이코리아',
  'JA코리아': '제이에이코리아',
  '한국 씨티은행': '한국씨티은행',
}

async function findSponsorManagementRowByName(name: string): Promise<SponsorManagementRow | undefined> {
  const trimmed = name.trim()
  if (!trimmed || !shouldUseSponsorsRemoteApi()) return undefined

  const exact = await findSponsorByKeyword(trimmed)
  if (exact) return exact

  const aliasTarget = SPONSOR_DETAIL_LINK_NAME_ALIASES[trimmed]
  if (aliasTarget) {
    const byAlias = await findSponsorByKeyword(aliasTarget)
    if (byAlias) return byAlias
  }

  const normalized = normalizeSponsorName(trimmed)
  const { getSponsorOptionsList } = await import('@/features/sponsor/api/admin-sponsors-service')
  const rows = await getSponsorOptionsList()
  return rows.find(row => normalizeSponsorName(row.name) === normalized)
}

/**
 * 프로그램 `sponsorId`(legacy) 또는 표시명 → 후원사 관리 id
 */
export async function resolveSponsorManagementIdForDetailLinkAsync(
  queryClient: QueryClient,
  input: {
    sponsorId?: string | null
    sponsorName?: string | null
    sponsorManagementId?: string | null
  }
): Promise<string | undefined> {
  const explicit = input.sponsorManagementId?.trim()
  if (explicit) {
    const row = await resolveSponsorRowById(queryClient, explicit)
    if (row) return row.id
  }

  const id = input.sponsorId?.trim()
  if (id) {
    const row = await resolveSponsorRowById(queryClient, id)
    if (row) return row.id
  }

  const name = input.sponsorName?.trim()
  if (name) {
    const byName = await findSponsorManagementRowByName(name)
    if (byName) return byName.id
  }

  return undefined
}

export async function resolveSponsorManagementRowByIdAsync(
  queryClient: QueryClient,
  sponsorManagementId: string | null | undefined
): Promise<SponsorManagementRow | undefined> {
  const id = sponsorManagementId?.trim()
  if (!id) return undefined
  return resolveSponsorRowById(queryClient, id)
}
