import { queryOptions, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { isHomepageApiConfigured } from '@/shared/lib/api-remote-env'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import {
  ANNUAL_REPORTS_PAGE_SIZE,
  AUDIT_REPORTS_PAGE_SIZE,
} from '../lib/constants'
import type { TransparencyReportType } from '../model/types'
import { fetchPublicTransparency, fetchPublicTransparencyReports } from './client'
import {
  hasTransparencyPageContent,
  mapPublicReportList,
  mapPublicTransparency,
  type TransparencyPageContent,
  type TransparencyReportsListResult,
} from './mappers'

/**
 * 공개 투명경영 싱글톤.
 * Class B: 관리자 수정은 드물고 로그인·사용자와 무관하다.
 * Remote API only — mock fallback 없음.
 */
const PAGE_STALE_MS = 5 * 60_000
const PAGE_GC_MS = 30 * 60_000

/** 공개 보고서 목록. Class C: 검색·페이지가 바뀌면 다른 키. */
const LIST_STALE_MS = 30_000
const LIST_GC_MS = 15 * 60_000

export function publicTransparencyQueryOptions() {
  return queryOptions({
    queryKey: platformQueryKeys.jaKorea.transparency.page(),
    queryFn: ({ signal }) => fetchPublicTransparency(signal),
    staleTime: PAGE_STALE_MS,
    gcTime: PAGE_GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })
}

export type PublicTransparencyQuery = {
  view: TransparencyPageContent | null
  isRemoteEnabled: boolean
  isPending: boolean
  isError: boolean
  refetch: () => void
}

export function usePublicTransparency(): PublicTransparencyQuery {
  const remote = isHomepageApiConfigured()
  const query = useQuery({
    ...publicTransparencyQueryOptions(),
    enabled: remote,
  })

  return useMemo(() => {
    const refetch = () => {
      void query.refetch()
    }

    if (!remote) {
      return {
        view: null,
        isRemoteEnabled: false,
        isPending: false,
        isError: true,
        refetch,
      }
    }

    if (query.isPending) {
      return {
        view: null,
        isRemoteEnabled: remote,
        isPending: true,
        isError: false,
        refetch,
      }
    }

    if (query.isError) {
      return {
        view: null,
        isRemoteEnabled: remote,
        isPending: false,
        isError: true,
        refetch,
      }
    }

    const mapped = mapPublicTransparency(query.data)
    return {
      view: hasTransparencyPageContent(mapped) ? mapped : null,
      isRemoteEnabled: remote,
      isPending: false,
      isError: false,
      refetch,
    }
  }, [query.data, query.isError, query.isPending, query.refetch, remote])
}

function toApiReportType(type: TransparencyReportType): 'ANNUAL' | 'AUDIT' {
  return type === 'annual' ? 'ANNUAL' : 'AUDIT'
}

function pageSizeFor(type: TransparencyReportType): number {
  return type === 'annual' ? ANNUAL_REPORTS_PAGE_SIZE : AUDIT_REPORTS_PAGE_SIZE
}

export type PublicTransparencyReportsQuery = TransparencyReportsListResult & {
  isRemoteEnabled: boolean
  isPending: boolean
  isError: boolean
}

export function usePublicTransparencyReports(
  type: TransparencyReportType,
  params: { q: string; page: number },
): PublicTransparencyReportsQuery {
  const remote = isHomepageApiConfigured()
  const pageSize = pageSizeFor(type)
  const apiPage = Math.max(0, params.page - 1)
  const q = params.q.trim()

  const query = useQuery({
    queryKey: platformQueryKeys.jaKorea.transparency.reports({
      type,
      q,
      page: params.page,
      size: pageSize,
    }),
    queryFn: ({ signal }) =>
      fetchPublicTransparencyReports(
        toApiReportType(type),
        { q, page: apiPage, size: pageSize },
        signal,
      ),
    enabled: remote,
    staleTime: LIST_STALE_MS,
    gcTime: LIST_GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })

  return useMemo(() => {
    if (!remote) {
      return {
        items: [],
        totalCount: 0,
        totalPages: 1,
        currentPage: params.page,
        isRemoteEnabled: false,
        isPending: false,
        isError: true,
      }
    }

    if (query.isPending) {
      return {
        items: [],
        totalCount: 0,
        totalPages: 1,
        currentPage: params.page,
        isRemoteEnabled: remote,
        isPending: true,
        isError: false,
      }
    }

    if (query.isError || !query.data) {
      return {
        items: [],
        totalCount: 0,
        totalPages: 1,
        currentPage: params.page,
        isRemoteEnabled: remote,
        isPending: false,
        isError: true,
      }
    }

    return {
      ...mapPublicReportList(query.data, type, params.page, pageSize),
      isRemoteEnabled: remote,
      isPending: false,
      isError: false,
    }
  }, [
    params.page,
    pageSize,
    q,
    query.data,
    query.isError,
    query.isPending,
    remote,
    type,
  ])
}
