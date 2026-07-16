import { useQuery } from '@tanstack/react-query'
import { shouldUseGeminiPerformanceRemoteApi } from './capabilities'
import { geminiPerformanceQueryKeys } from './query-keys'
import { listGeminiPerformanceRows } from './service'

export function useGeminiPerformanceListQuery(enabled = true) {
  const remoteEnabled = shouldUseGeminiPerformanceRemoteApi()
  return useQuery({
    queryKey: geminiPerformanceQueryKeys.list(),
    queryFn: () => listGeminiPerformanceRows(),
    enabled,
    staleTime: remoteEnabled ? 30_000 : Number.POSITIVE_INFINITY,
    retry: false,
  })
}
