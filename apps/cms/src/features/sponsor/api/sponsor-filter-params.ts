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
