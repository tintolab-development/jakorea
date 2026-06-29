import { useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getSponsorNameFromCache } from '@/features/sponsor/lib/sponsor-lookup'
import { useSponsorOptionsQuery } from '@/features/sponsor/hooks/use-sponsor-options-query'

export function useSponsorNameById(sponsorId?: string | null, enabled = true): string | undefined {
  const queryClient = useQueryClient()
  const sponsorsQuery = useSponsorOptionsQuery(enabled && Boolean(sponsorId?.trim()))

  return useMemo(() => {
    if (!sponsorId?.trim()) return undefined
    return getSponsorNameFromCache(queryClient, sponsorId)
  }, [queryClient, sponsorId, sponsorsQuery.data])
}
