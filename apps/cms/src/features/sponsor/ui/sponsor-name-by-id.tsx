import { useSponsorOptionsQuery } from '@/features/sponsor/hooks/use-sponsor-options-query'
import { getSponsorNameFromCache } from '@/features/sponsor/lib/sponsor-lookup'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'

export function SponsorNameById({ sponsorId }: { sponsorId?: string | null }) {
  const queryClient = useQueryClient()
  useSponsorOptionsQuery(Boolean(sponsorId))

  const name = useMemo(() => {
    if (!sponsorId?.trim()) return '-'
    return getSponsorNameFromCache(queryClient, sponsorId) ?? sponsorId
  }, [queryClient, sponsorId])

  return <>{name}</>
}
