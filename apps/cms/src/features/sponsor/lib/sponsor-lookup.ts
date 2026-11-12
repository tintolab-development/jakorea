import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import type { DataManagementListPage } from '@/features/data-management/api/data-management-list-page'
import {
  getSponsorDetail,
  getSponsorList,
  getSponsorOptionsList,
  shouldUseSponsorsRemoteApi,
} from '@/features/sponsor/api/admin-sponsors-service'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import type { SponsorManagementRow } from '@/features/sponsor/model/sponsor-management.types'

function readSponsorRowsFromQueryCache(data: unknown): SponsorManagementRow[] {
  if (Array.isArray(data)) return data
  if (data != null && typeof data === 'object' && 'pages' in data) {
    const pages = (data as InfiniteData<DataManagementListPage<SponsorManagementRow>>).pages
    return pages.flatMap(page => page.items ?? [])
  }
  return []
}

export function getSponsorNameFromCache(queryClient: QueryClient, sponsorId: string): string | undefined {
  const detail = queryClient.getQueryData<{ name?: string; nameDisplayKo?: string }>(
    dataManagementQueryKeys.sponsors.detail(sponsorId)
  )
  if (detail?.nameDisplayKo?.trim()) return detail.nameDisplayKo.trim()
  if (detail?.name?.trim()) return detail.name.trim()

  const options = queryClient.getQueryData<unknown>(
    dataManagementQueryKeys.sponsors.options()
  )
  const fromOptions = readSponsorRowsFromQueryCache(options).find(row => row.id === sponsorId)
  if (fromOptions?.name?.trim()) return fromOptions.name.trim()

  const infiniteOptionsQueries = queryClient.getQueriesData<unknown>({
    queryKey: dataManagementQueryKeys.sponsors.optionsInfiniteAll(),
  })
  for (const [, data] of infiniteOptionsQueries) {
    const hit = readSponsorRowsFromQueryCache(data).find(row => row.id === sponsorId)
    if (hit?.name?.trim()) return hit.name.trim()
  }

  const listQueries = queryClient.getQueriesData<unknown>({
    queryKey: dataManagementQueryKeys.sponsors.all(),
  })
  for (const [, data] of listQueries) {
    const hit = readSponsorRowsFromQueryCache(data).find(row => row.id === sponsorId)
    if (hit?.name?.trim()) return hit.name.trim()
  }

  return undefined
}

export async function prefetchSponsorLookupData(queryClient: QueryClient): Promise<void> {
  if (!shouldUseSponsorsRemoteApi()) return
  await queryClient.ensureQueryData({
    queryKey: dataManagementQueryKeys.sponsors.options(),
    queryFn: getSponsorOptionsList,
    staleTime: 60_000,
  })
}

export async function resolveSponsorNameById(
  queryClient: QueryClient,
  sponsorId: string
): Promise<string | undefined> {
  const cached = getSponsorNameFromCache(queryClient, sponsorId)
  if (cached) return cached

  if (!shouldUseSponsorsRemoteApi()) return undefined

  try {
    const detail = await queryClient.fetchQuery({
      // 프로그램 화면의 후원사 이름·행 조회 — 담당자 연락처 원문이 필요 없으므로 MASKED(조회 기록 없음, CMS-32·37).
      queryKey: [...dataManagementQueryKeys.sponsors.detail(sponsorId), 'masked'],
      queryFn: () => getSponsorDetail(sponsorId, { contactPrivacy: 'MASKED' }),
      staleTime: 30_000,
    })
    return detail.nameDisplayKo?.trim() || detail.name?.trim() || undefined
  } catch {
    return undefined
  }
}

export function findSponsorInListCache(
  queryClient: QueryClient,
  sponsorId: string
): SponsorManagementRow | undefined {
  const options = queryClient.getQueryData<unknown>(
    dataManagementQueryKeys.sponsors.options()
  )
  const fromOptions = readSponsorRowsFromQueryCache(options).find(row => row.id === sponsorId)
  if (fromOptions) return fromOptions

  const infiniteOptionsQueries = queryClient.getQueriesData<unknown>({
    queryKey: dataManagementQueryKeys.sponsors.optionsInfiniteAll(),
  })
  for (const [, data] of infiniteOptionsQueries) {
    const hit = readSponsorRowsFromQueryCache(data).find(row => row.id === sponsorId)
    if (hit) return hit
  }

  const listQueries = queryClient.getQueriesData<unknown>({
    queryKey: dataManagementQueryKeys.sponsors.all(),
  })
  for (const [, data] of listQueries) {
    const hit = readSponsorRowsFromQueryCache(data).find(row => row.id === sponsorId)
    if (hit) return hit
  }

  return undefined
}

export async function resolveSponsorRowById(
  queryClient: QueryClient,
  sponsorId: string
): Promise<SponsorManagementRow | undefined> {
  const cached = findSponsorInListCache(queryClient, sponsorId)
  if (cached) return cached

  if (!shouldUseSponsorsRemoteApi()) return undefined

  try {
    const detail = await queryClient.fetchQuery({
      // 프로그램 화면의 후원사 이름·행 조회 — 담당자 연락처 원문이 필요 없으므로 MASKED(조회 기록 없음, CMS-32·37).
      queryKey: [...dataManagementQueryKeys.sponsors.detail(sponsorId), 'masked'],
      queryFn: () => getSponsorDetail(sponsorId, { contactPrivacy: 'MASKED' }),
      staleTime: 30_000,
    })
    return detail
  } catch {
    return undefined
  }
}

export async function findSponsorByKeyword(keyword: string): Promise<SponsorManagementRow | undefined> {
  if (!shouldUseSponsorsRemoteApi()) return undefined
  const trimmed = keyword.trim()
  if (!trimmed) return undefined
  const params = new URLSearchParams({ sp_name: trimmed })
  const rows = await getSponsorList(params)
  return rows.find(row => row.name === trimmed) ?? rows[0]
}
