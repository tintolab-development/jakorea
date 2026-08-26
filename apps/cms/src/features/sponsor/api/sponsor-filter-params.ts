import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import type { SponsorsParams } from '@/shared/api/generated/data-management/schemas'
import type { SponsorOrganizationKind } from '@/types/domain'
import type { DateValue } from '@/types'

/** OpenAPI SponsorsParams에 아직 없는 후원 시작일 구간 — BE 갭 P1 */
export type SponsorsListQueryParams = SponsorsParams & {
  sponsorshipStartDateFrom?: string
  sponsorshipStartDateTo?: string
}

function parseKind(raw: string | null): SponsorOrganizationKind {
  if (raw === 'foundation') return 'foundation'
  return 'corporate'
}

function parseStatus(raw: string | null): 'ALL' | 'active' | 'ended' {
  if (raw === 'active' || raw === 'ended') return raw
  return 'ALL'
}

export function sponsorsParamsFromSearchParams(
  searchParams: URLSearchParams
): SponsorsListQueryParams {
  const params: SponsorsListQueryParams = {}

  params.organizationKind = parseKind(searchParams.get('sp_kind'))

  const name = (searchParams.get('sp_name') ?? '').trim()
  if (name) params.keyword = name

  const mgr = (searchParams.get('sp_mgr') ?? '').trim()
  if (mgr) params.managerName = mgr

  const st = parseStatus(searchParams.get('sp_st'))
  if (st !== 'ALL') params.sponsorshipStatus = st

  const from = (searchParams.get('sp_from') ?? '').trim()
  const to = (searchParams.get('sp_to') ?? '').trim()
  if (from) params.sponsorshipStartDateFrom = from
  if (to) params.sponsorshipStartDateTo = to

  return params
}

/** 목록 캐시 키 — 상세 overlay(`sponsorId` 등)는 제외해 필터가 같으면 같은 키. */
export function serializeSponsorListFilters(searchParams: URLSearchParams): string {
  const next = new URLSearchParams()
  next.set('sp_kind', parseKind(searchParams.get('sp_kind')))
  const name = (searchParams.get('sp_name') ?? '').trim()
  if (name) next.set('sp_name', name)
  const mgr = (searchParams.get('sp_mgr') ?? '').trim()
  if (mgr) next.set('sp_mgr', mgr)
  const st = searchParams.get('sp_st')
  if (st === 'active' || st === 'ended') next.set('sp_st', st)
  const from = (searchParams.get('sp_from') ?? '').trim()
  if (from) next.set('sp_from', from)
  const to = (searchParams.get('sp_to') ?? '').trim()
  if (to) next.set('sp_to', to)
  return next.toString()
}

/** BE 미구현 시 목록 응답에 대한 일시적 클라 보조 필터 */
export function filterSponsorsBySponsorshipStartDateRange<
  T extends { sponsorshipStartDate?: DateValue | Dayjs | null },
>(rows: T[], from: string | null, to: string | null): T[] {
  const fromKey = from?.trim() || null
  const toKey = to?.trim() || null
  if (!fromKey && !toKey) return rows
  return rows.filter(row => {
    const raw = row.sponsorshipStartDate
    if (raw == null || raw === '') return false
    const day = dayjs(raw).format('YYYY-MM-DD')
    if (fromKey && day < fromKey) return false
    if (toKey && day > toKey) return false
    return true
  })
}
