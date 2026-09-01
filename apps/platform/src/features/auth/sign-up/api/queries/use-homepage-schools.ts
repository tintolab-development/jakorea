import { useQuery } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { searchHomepageSchools } from '../client'

type UseHomepageSchoolsParams = {
  keyword: string
  regionSido: string
  regionSigungu: string
  page: number
  size?: number
  enabled?: boolean
}

export function useHomepageSchoolsQuery({
  keyword,
  regionSido,
  regionSigungu,
  page,
  size = 20,
  enabled = true,
}: UseHomepageSchoolsParams) {
  const remote = isRemoteApiConfigured()
  const trimmed = keyword.trim()
  const canFetch = remote && enabled && Boolean(regionSido && trimmed)

  return useQuery({
    queryKey: platformQueryKeys.auth.schools({
      keyword: trimmed,
      regionSido,
      regionSigungu,
      page,
    }),
    queryFn: () =>
      searchHomepageSchools({
        keyword: trimmed,
        regionSido,
        regionSigungu: regionSigungu || undefined,
        page,
        size,
      }),
    enabled: canFetch,
    staleTime: 60_000,
  })
}
