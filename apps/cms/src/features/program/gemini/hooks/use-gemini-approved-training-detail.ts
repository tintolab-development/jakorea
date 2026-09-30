import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react'
import type { InfiniteData } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { geminiVisitingTrainingQueryKeys } from '../api/visiting-training/query-keys'
import type { GeminiApprovedTrainingsPage } from '../api/visiting-training/service'
import {
  resolveApprovedTrainingRowFromListQueries,
  type ApprovedTrainingListQueryView,
} from '../model/approved/approved-detail-from-list'
import { mapGeminiApprovedTrainingRowToDetail } from '../model/approved/approved-detail-resolver'
import type { GeminiApprovedTrainingDetail } from '../model/approved/detail-types'
import type { GeminiApprovedTrainingRow } from '../model/approved/types'

const LOADING = { status: 'loading' as const, row: null }
const MISSING = { status: 'missing' as const, row: null }

type ApprovedTrainingDetailSnapshot =
  | typeof LOADING
  | typeof MISSING
  | { status: 'ready'; row: GeminiApprovedTrainingRow }

export function useGeminiApprovedTrainingDetail(approvedTrainingId: string): {
  detail: GeminiApprovedTrainingDetail | null
  isLoading: boolean
} {
  const queryClient = useQueryClient()
  const readySnapshotRef = useRef<ApprovedTrainingDetailSnapshot | null>(null)

  const subscribe = useCallback(
    (onStoreChange: () => void) => queryClient.getQueryCache().subscribe(onStoreChange),
    [queryClient]
  )

  const getSnapshot = useCallback((): ApprovedTrainingDetailSnapshot => {
    const queries = queryClient
      .getQueryCache()
      .findAll({ queryKey: geminiVisitingTrainingQueryKeys.approved() })
      .map((query): ApprovedTrainingListQueryView => {
        const data = query.state.data as InfiniteData<GeminiApprovedTrainingsPage> | undefined
        return {
          rows: data?.pages.flatMap(page => page.rows) ?? [],
          fetchStatus: query.state.fetchStatus,
          status: query.state.status,
        }
      })
    const resolved = resolveApprovedTrainingRowFromListQueries(approvedTrainingId, queries)
    if (resolved === 'loading') return LOADING
    if (resolved === 'missing') return MISSING
    const previous = readySnapshotRef.current
    if (previous?.status === 'ready' && previous.row === resolved) return previous
    const next: ApprovedTrainingDetailSnapshot = { status: 'ready', row: resolved }
    readySnapshotRef.current = next
    return next
  }, [approvedTrainingId, queryClient])

  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => LOADING)
  const detail = useMemo(
    () => (snapshot.status === 'ready' ? mapGeminiApprovedTrainingRowToDetail(snapshot.row) : null),
    [snapshot]
  )

  return {
    detail,
    isLoading: snapshot.status === 'loading',
  }
}
