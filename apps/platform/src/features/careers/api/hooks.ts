import { queryOptions, useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { isHomepageApiConfigured } from '@/shared/lib/api-remote-env'
import { getQueryRetryHttpStatus, queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import type { CareersGuideView } from '../model/guide-view'
import type {
  CareerJobListItem,
  CareerPostingDetail,
  CareerPostingDetailStatus,
} from '../model/types'
import { getAdjacentCareerPostings, type AdjacentCareerPostings } from '../lib/adjacent'
import { createFallbackCareersGuideView } from '../lib/fallback-guide'
import type { CareersTalentApplySchemaValues } from '../lib/validate-talent-apply-form'
import {
  createPublicCareerTalentApplication,
  fetchPublicCareerGuide,
  fetchPublicCareerPostingDetail,
  fetchPublicCareerPostings,
  uploadCareerTalentApplicationAttachment,
} from './client'
import {
  mapPublicCareerGuide,
  mapPublicCareerPostingDetail,
  mapPublicCareerPostings,
  toPublicCareerTalentApplicationCreateRequest,
} from './mappers'

/**
 * 공개 채용 안내 싱글톤.
 * Class B: 관리자 수정은 드물고 로그인·사용자와 무관하다.
 * stale 5분, gc 30분, 창 포커스 재조회 없음.
 */
const GUIDE_STALE_MS = 5 * 60_000
const GUIDE_GC_MS = 30 * 60_000

/**
 * 공개 채용공고 목록.
 * Class C: 공개 토글·상태 변경이 있다. stale 30초, gc 15분.
 */
const POSTINGS_STALE_MS = 30_000
const POSTINGS_GC_MS = 15 * 60_000

/**
 * 공개 채용공고 상세.
 * Class D: 본문·조회수. stale 2분, gc 15분. 404는 재시도하지 않는다.
 */
const POSTING_DETAIL_STALE_MS = 2 * 60_000
const POSTING_DETAIL_GC_MS = 15 * 60_000

function shouldRetryPostingDetail(failureCount: number, error: unknown): boolean {
  if (getQueryRetryHttpStatus(error) === 404) return false
  return shouldRetryQuery(failureCount, error)
}

export type CareerPostingDetailQuery = {
  data: CareerPostingDetail | null
  status: CareerPostingDetailStatus
  adjacent: AdjacentCareerPostings
  isRemoteEnabled: boolean
  refetch: () => void
}

export function publicCareerGuideQueryOptions() {
  return queryOptions({
    queryKey: platformQueryKeys.careers.guide(),
    queryFn: ({ signal }) => fetchPublicCareerGuide(signal),
    staleTime: GUIDE_STALE_MS,
    gcTime: GUIDE_GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })
}

export function publicCareerPostingsQueryOptions() {
  return queryOptions({
    queryKey: platformQueryKeys.careers.postings(),
    queryFn: ({ signal }) => fetchPublicCareerPostings(signal),
    staleTime: POSTINGS_STALE_MS,
    gcTime: POSTINGS_GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })
}

export function usePublicCareerGuide(): {
  view: CareersGuideView
  isRemoteEnabled: boolean
  isPending: boolean
  isError: boolean
} {
  const remote = isHomepageApiConfigured()
  const query = useQuery({
    ...publicCareerGuideQueryOptions(),
    enabled: remote,
  })

  const fallback = useMemo(() => createFallbackCareersGuideView(), [])

  const view = useMemo(() => {
    if (!remote || query.isError || !query.data) return fallback
    return mapPublicCareerGuide(query.data, fallback)
  }, [fallback, query.data, query.isError, remote])

  return {
    view,
    isRemoteEnabled: remote,
    isPending: remote && query.isPending,
    isError: query.isError,
  }
}

export function usePublicCareerPostings(): {
  jobs: readonly CareerJobListItem[]
  isRemoteEnabled: boolean
  isPending: boolean
  isError: boolean
} {
  const remote = isHomepageApiConfigured()
  const query = useQuery({
    ...publicCareerPostingsQueryOptions(),
    enabled: remote,
  })

  const jobs = useMemo(() => {
    if (!remote || query.isError || !query.data) return []
    return mapPublicCareerPostings(query.data)
  }, [query.data, query.isError, remote])

  return {
    jobs,
    isRemoteEnabled: remote,
    isPending: remote && query.isPending,
    isError: query.isError,
  }
}

export function useCareerPostingDetail(id: string | null): CareerPostingDetailQuery {
  const remote = isHomepageApiConfigured()
  const enabled = remote && Boolean(id)

  const detailQuery = useQuery({
    queryKey: platformQueryKeys.careers.postingDetail(id ?? ''),
    queryFn: ({ signal }) => fetchPublicCareerPostingDetail(id!, signal),
    enabled,
    staleTime: POSTING_DETAIL_STALE_MS,
    gcTime: POSTING_DETAIL_GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryPostingDetail,
    retryDelay: queryRetryDelay,
  })

  const listQuery = useQuery({
    ...publicCareerPostingsQueryOptions(),
    enabled: remote,
  })

  const {
    data: detailPayload,
    isPending: detailPending,
    isError: detailIsError,
    error: detailError,
    refetch: refetchDetail,
  } = detailQuery

  return useMemo(() => {
    const refetch = () => {
      void refetchDetail()
    }
    const emptyAdjacent = { previous: null, next: null }

    if (!id) {
      return {
        data: null,
        status: 'not-found' as const,
        adjacent: emptyAdjacent,
        isRemoteEnabled: remote,
        refetch,
      }
    }

    if (!remote) {
      return {
        data: null,
        status: 'not-found' as const,
        adjacent: emptyAdjacent,
        isRemoteEnabled: remote,
        refetch,
      }
    }

    if (detailPending) {
      return {
        data: null,
        status: 'loading' as const,
        adjacent: emptyAdjacent,
        isRemoteEnabled: remote,
        refetch,
      }
    }

    if (detailIsError) {
      const statusCode = getQueryRetryHttpStatus(detailError)
      return {
        data: null,
        status: statusCode === 404 ? ('unavailable' as const) : ('error' as const),
        adjacent: emptyAdjacent,
        isRemoteEnabled: remote,
        refetch,
      }
    }

    const data = detailPayload ? mapPublicCareerPostingDetail(detailPayload) : null
    if (!data) {
      return {
        data: null,
        status: 'not-found' as const,
        adjacent: emptyAdjacent,
        isRemoteEnabled: remote,
        refetch,
      }
    }

    const adjacentJobs =
      listQuery.data && !listQuery.isError ? mapPublicCareerPostings(listQuery.data) : []

    return {
      data,
      status: 'ready' as const,
      adjacent: getAdjacentCareerPostings(adjacentJobs, data.id),
      isRemoteEnabled: remote,
      refetch,
    }
  }, [
    detailError,
    detailIsError,
    detailPayload,
    detailPending,
    id,
    listQuery.data,
    listQuery.isError,
    refetchDetail,
    remote,
  ])
}

/** POST 공개 인재채용 지원. 선택 첨부는 careers path로 upload 후 assetId 포함. */
export function useCreatePublicCareerTalentApplication() {
  return useMutation({
    mutationFn: async (input: {
      values: CareersTalentApplySchemaValues
      attachmentFile?: File | null
    }) => {
      if (!isHomepageApiConfigured()) {
        throw new Error('신청 서비스를 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.')
      }
      let attachmentAssetId: number | undefined
      if (input.attachmentFile) {
        attachmentAssetId = await uploadCareerTalentApplicationAttachment(input.attachmentFile)
      }
      return createPublicCareerTalentApplication(
        toPublicCareerTalentApplicationCreateRequest(input.values, attachmentAssetId),
      )
    },
    retry: false,
  })
}
