import { useQuery } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { getQueryRetryHttpStatus, queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import type { ResultDetail, ResultListItem, ResultsListParams } from '../model/types'
import { fetchProgramResultDetail, fetchProgramResults } from './client'
import { mapProgramResultDetail, mapProgramResultListItem, mapProgramResultNeighbors } from './mappers'
import type { ProgramResultSort } from './types'

const PAGE_SIZE = 10
const LIST_STALE_MS = 30_000
const LIST_GC_MS = 15 * 60_000
const CATEGORY_STALE_MS = 15 * 60_000
const CATEGORY_GC_MS = 60 * 60_000
const DETAIL_STALE_MS = 2 * 60_000
const DETAIL_GC_MS = 15 * 60_000

/** 시안 탭 key → 공개 API 카테고리 이름 */
const CATEGORY_NAME_BY_TAB: Record<string, string> = {
  result: '최종 합격 발표',
  docs: '서류 심사 결과',
  screening: '서류 심사 결과',
}

export function programResultSortParam(sort: ResultsListParams['sort']): ProgramResultSort {
  return sort === 'title' ? 'TITLE' : 'LATEST'
}

function shouldRetryDetail(failureCount: number, error: unknown): boolean {
  if (getQueryRetryHttpStatus(error) === 404) return false
  return shouldRetryQuery(failureCount, error)
}

export type ProgramResultsListQuery = {
  items: ResultListItem[]
  totalPages: number
  currentPage: number
  isRemoteEnabled: boolean
  isPending: boolean
  isError: boolean
  refetch: () => void
}

export function useProgramResultsList(params: ResultsListParams): ProgramResultsListQuery {
  const remote = isRemoteApiConfigured()
  const categoryName = CATEGORY_NAME_BY_TAB[params.category]
  const needsCategory = Boolean(categoryName)
  const sort = programResultSortParam(params.sort)
  const keyword = params.q.trim()

  const catalogQuery = useQuery({
    queryKey: platformQueryKeys.programResult.categories(),
    queryFn: ({ signal }) => fetchProgramResults({ page: 0, size: 1, sort: 'LATEST' }, signal),
    enabled: remote && needsCategory,
    staleTime: CATEGORY_STALE_MS,
    gcTime: CATEGORY_GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })

  const categoryId = needsCategory
    ? catalogQuery.data?.categories.find(category => category.categoryName === categoryName)?.categoryId
    : undefined
  const categoryResolved = !needsCategory || categoryId != null
  const categoryMissing =
    needsCategory && catalogQuery.isSuccess && categoryId == null

  const listQuery = useQuery({
    queryKey: platformQueryKeys.programResult.list({
      categoryId: categoryId ?? null,
      keyword,
      sort,
      page: Math.max(0, params.page - 1),
      size: PAGE_SIZE,
    }),
    queryFn: ({ signal }) =>
      fetchProgramResults(
        {
          page: Math.max(0, params.page - 1),
          size: PAGE_SIZE,
          sort,
          keyword: keyword || undefined,
          categoryId,
        },
        signal,
      ),
    enabled: remote && categoryResolved,
    staleTime: LIST_STALE_MS,
    gcTime: LIST_GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })

  const refetch = () => {
    void catalogQuery.refetch()
    void listQuery.refetch()
  }

  if (!remote) {
    return {
      items: [],
      totalPages: 1,
      currentPage: params.page,
      isRemoteEnabled: false,
      isPending: false,
      isError: false,
      refetch,
    }
  }

  if (categoryMissing) {
    return {
      items: [],
      totalPages: 1,
      currentPage: 1,
      isRemoteEnabled: true,
      isPending: false,
      isError: false,
      refetch,
    }
  }

  const pending = (needsCategory && catalogQuery.isPending) || (categoryResolved && listQuery.isPending)
  if (pending) {
    return {
      items: [],
      totalPages: 1,
      currentPage: params.page,
      isRemoteEnabled: true,
      isPending: true,
      isError: false,
      refetch,
    }
  }

  if (catalogQuery.isError || listQuery.isError) {
    return {
      items: [],
      totalPages: 1,
      currentPage: params.page,
      isRemoteEnabled: true,
      isPending: false,
      isError: true,
      refetch,
    }
  }

  const items = (listQuery.data?.items ?? []).map(mapProgramResultListItem)
  const totalPages = Math.max(1, listQuery.data?.totalPages ?? 1)

  return {
    items,
    totalPages,
    currentPage: Math.min(params.page, totalPages),
    isRemoteEnabled: true,
    isPending: false,
    isError: false,
    refetch,
  }
}

export type ProgramResultDetailStatus = 'loading' | 'ready' | 'not-found' | 'error'

export type ProgramResultDetailQuery = {
  data: ResultDetail | null
  previous: ResultListItem | null
  next: ResultListItem | null
  status: ProgramResultDetailStatus
  isRemoteEnabled: boolean
  refetch: () => void
}

export function useProgramResultDetail(
  resultId: string | null,
  sort: ProgramResultSort = 'LATEST',
): ProgramResultDetailQuery {
  const remote = isRemoteApiConfigured()
  const query = useQuery({
    queryKey: platformQueryKeys.programResult.detail(resultId ?? '', sort),
    queryFn: ({ signal }) => fetchProgramResultDetail(resultId!, sort, signal),
    enabled: remote && Boolean(resultId),
    staleTime: DETAIL_STALE_MS,
    gcTime: DETAIL_GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryDetail,
    retryDelay: queryRetryDelay,
  })

  const refetch = () => {
    void query.refetch()
  }

  if (!remote) {
    return {
      data: null,
      previous: null,
      next: null,
      status: 'not-found',
      isRemoteEnabled: false,
      refetch,
    }
  }

  if (!resultId) {
    return {
      data: null,
      previous: null,
      next: null,
      status: 'not-found',
      isRemoteEnabled: true,
      refetch,
    }
  }

  if (query.isPending) {
    return {
      data: null,
      previous: null,
      next: null,
      status: 'loading',
      isRemoteEnabled: true,
      refetch,
    }
  }

  if (query.isError) {
    const status = getQueryRetryHttpStatus(query.error) === 404 ? 'not-found' : 'error'
    return {
      data: null,
      previous: null,
      next: null,
      status,
      isRemoteEnabled: true,
      refetch,
    }
  }

  const neighbors = mapProgramResultNeighbors(query.data)
  return {
    data: mapProgramResultDetail(query.data),
    previous: neighbors.previous,
    next: neighbors.next,
    status: 'ready',
    isRemoteEnabled: true,
    refetch,
  }
}
