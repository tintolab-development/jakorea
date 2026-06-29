import type { QueryClient } from '@tanstack/react-query'
import {
  getSponsorDetail,
  getSponsorList,
  getSponsorOptionsList,
  shouldUseSponsorsRemoteApi,
} from '@/features/sponsor/api/admin-sponsors-service'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import type { SponsorManagementRow } from '@/features/sponsor/model/sponsor-management.types'

export function getSponsorNameFromCache(queryClient: QueryClient, sponsorId: string): string | undefined {
  const detail = queryClient.getQueryData<{ name?: string; nameDisplayKo?: string }>(
    dataManagementQueryKeys.sponsors.detail(sponsorId)
  )
  if (detail?.nameDisplayKo?.trim()) return detail.nameDisplayKo.trim()
  if (detail?.name?.trim()) return detail.name.trim()

  const options = queryClient.getQueryData<SponsorManagementRow[]>(
    dataManagementQueryKeys.sponsors.options()
  )
  const fromOptions = options?.find(row => row.id === sponsorId)
  if (fromOptions?.name?.trim()) return fromOptions.name.trim()

  const listQueries = queryClient.getQueriesData<SponsorManagementRow[]>({
    queryKey: dataManagementQueryKeys.sponsors.all(),
  })
  for (const [, data] of listQueries) {
    const hit = data?.find(row => row.id === sponsorId)
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
      queryKey: dataManagementQueryKeys.sponsors.detail(sponsorId),
      queryFn: () => getSponsorDetail(sponsorId),
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
  const options = queryClient.getQueryData<SponsorManagementRow[]>(
    dataManagementQueryKeys.sponsors.options()
  )
  const fromOptions = options?.find(row => row.id === sponsorId)
  if (fromOptions) return fromOptions

  const listQueries = queryClient.getQueriesData<SponsorManagementRow[]>({
    queryKey: dataManagementQueryKeys.sponsors.all(),
  })
  for (const [, data] of listQueries) {
    const hit = data?.find(row => row.id === sponsorId)
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
      queryKey: dataManagementQueryKeys.sponsors.detail(sponsorId),
      queryFn: () => getSponsorDetail(sponsorId),
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
