import { queryClient } from '@/shared/lib/query-client'

/**
 * 수신자 후보 원문은 Cache-Control: no-store.
 * query cache에 남기지 않는다. persisted cache도 쓰지 않는다.
 */
export const recipientCandidateQueryOptions = {
  staleTime: 0,
  gcTime: 0,
  retry: false as const,
  refetchOnReconnect: false,
  refetchOnWindowFocus: false,
}

export function isRecipientCandidateQueryKey(queryKey: readonly unknown[]): boolean {
  return (
    queryKey[0] === 'cms' &&
    queryKey[1] === 'notifications' &&
    queryKey.includes('recipients')
  )
}

export function clearRecipientCandidateQueries(): void {
  queryClient.removeQueries({
    predicate: query => isRecipientCandidateQueryKey(query.queryKey),
  })
}
