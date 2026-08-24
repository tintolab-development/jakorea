import type { SponsorsParams } from '@/shared/api/generated/data-management/schemas'

function parseKind(raw: string | null): 'ALL' | 'corporate' | 'foundation' {
  if (raw === 'corporate' || raw === 'foundation') return raw
  return 'ALL'
}

function parseStatus(raw: string | null): 'ALL' | 'active' | 'ended' {
  if (raw === 'active' || raw === 'ended') return raw
  return 'ALL'
}

export function sponsorsParamsFromSearchParams(searchParams: URLSearchParams): SponsorsParams {
  const params: SponsorsParams = {}

  const kind = parseKind(searchParams.get('sp_kind'))
  if (kind !== 'ALL') params.organizationKind = kind

  const name = (searchParams.get('sp_name') ?? '').trim()
  if (name) params.keyword = name

  const mgr = (searchParams.get('sp_mgr') ?? '').trim()
  if (mgr) params.managerName = mgr

  const st = parseStatus(searchParams.get('sp_st'))
  if (st !== 'ALL') params.sponsorshipStatus = st

  return params
}

/** 목록 캐시 키 — 상세 overlay(`sponsorId` 등)는 제외해 필터가 같으면 같은 키. */
export function serializeSponsorListFilters(searchParams: URLSearchParams): string {
  const next = new URLSearchParams()
  const kind = searchParams.get('sp_kind')
  if (kind === 'corporate' || kind === 'foundation') next.set('sp_kind', kind)
  const name = (searchParams.get('sp_name') ?? '').trim()
  if (name) next.set('sp_name', name)
  const mgr = (searchParams.get('sp_mgr') ?? '').trim()
  if (mgr) next.set('sp_mgr', mgr)
  const st = searchParams.get('sp_st')
  if (st === 'active' || st === 'ended') next.set('sp_st', st)
  return next.toString()
}
