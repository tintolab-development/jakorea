import { useQuery } from '@tanstack/react-query'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { getAccessToken } from '@/shared/lib/auth-token'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import { platformQueryKeys } from '@/shared/api/query-keys'
import {
  fetchIndividualSettlementApplicationDocument,
  fetchInstructorSettlementApplicationDocument,
} from './application-document-client'
import type { SettlementApplicationDocumentKind } from './application-document-types'

/** Class G — viewUrl 단기 서명 URL. 캐시로 만료본을 붙잡지 않는다. */
const STALE_MS = 0
const GC_MS = 5 * 60_000

export function useSettlementApplicationDocumentQuery(options: {
  kind: SettlementApplicationDocumentKind | null
  documentId: number | null | undefined
  revisionNo?: number | null
  enabled?: boolean
}) {
  const kind = options.kind
  const documentId = options.documentId
  const revisionNo =
    options.revisionNo != null && options.revisionNo > 0 ? options.revisionNo : null
  const enabled =
    options.enabled !== false &&
    isRemoteApiConfigured() &&
    Boolean(getAccessToken()) &&
    kind != null &&
    documentId != null &&
    documentId > 0

  const query = useQuery({
    queryKey: platformQueryKeys.mypage.settlementApplicationDocument(
      kind ?? 'individual',
      documentId ?? 0,
      revisionNo,
    ),
    queryFn: ({ signal }) => {
      if (kind === 'instructor') {
        return fetchInstructorSettlementApplicationDocument(documentId!, {
          revisionNo,
          signal,
        })
      }
      return fetchIndividualSettlementApplicationDocument(documentId!, {
        revisionNo,
        signal,
      })
    },
    enabled,
    staleTime: STALE_MS,
    gcTime: GC_MS,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })

  return {
    enabled,
    isLoading: enabled && query.isPending,
    isError: enabled && query.isError,
    isFetching: query.isFetching,
    document: query.data ?? null,
    error: query.error,
    refetch: query.refetch,
  }
}
