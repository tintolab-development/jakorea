import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import type { SponsorsParams } from '@/shared/api/generated/data-management/schemas'
import {
  isSponsorSponsorshipStatus,
  parseSponsorSponsorshipStatusFilter,
} from '@/features/sponsor/model/sponsorship-status'
import type { SponsorOrganizationKind, SponsorSponsorshipStatus } from '@/types/domain'
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

function parseStatus(raw: string | null): 'ALL' | SponsorSponsorshipStatus {
  return parseSponsorSponsorshipStatusFilter(raw)
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
  if (isSponsorSponsorshipStatus(st)) next.set('sp_st', st)
  const from = (searchParams.get('sp_from') ?? '').trim()
  if (from) next.set('sp_from', from)
  const to = (searchParams.get('sp_to') ?? '').trim()
  if (to) next.set('sp_to', to)
  return next.toString()
}

/**
 * pending 날짜 구간 → URL `sp_from` / `sp_to`.
 * 시작·종료 중 한쪽만 있으면 그날 하루로 기록한다 (조회 시 URL이 바뀌지 않아 API가 안 나가는 것 방지).
 */
export function writeSponsorshipStartDateRangeToSearchParams(
  nextParams: URLSearchParams,
  range: [Dayjs | null, Dayjs | null] | null | undefined
): void {
  const start = range?.[0] ?? null
  const end = range?.[1] ?? null
  if (start == null && end == null) {
    nextParams.delete('sp_from')
    nextParams.delete('sp_to')
    return
  }
  const fromDay = start ?? end
  const toDay = end ?? start
  nextParams.set('sp_from', fromDay!.format('YYYY-MM-DD'))
  nextParams.set('sp_to', toDay!.format('YYYY-MM-DD'))
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
