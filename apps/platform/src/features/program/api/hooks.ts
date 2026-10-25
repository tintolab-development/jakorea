import { useQuery } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { getQueryRetryHttpStatus, queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import type { ProgramDetail, ProgramListItem, ProgramsListParams } from '../model/types'
import { fetchPortalProgramDetail, fetchPortalPrograms } from './client'
import {
  HOME_PORTAL_PROGRAMS_QUERY,
  normalizePortalProgramFilterValues,
  toPortalProgramListQuery,
} from './list-query'
import type { PortalRecruitmentFocus } from '../lib/portal-recruitment'
import { mapPortalProgramDetail, mapPortalProgramListItem, parsePortalProgramId } from './mappers'
import type { PortalProgramListQuery } from './types'

const LIST_STALE_MS = 30_000
const LIST_GC_MS = 15 * 60_000
const DETAIL_STALE_MS = 2 * 60_000
const DETAIL_GC_MS = 15 * 60_000
const DETAIL_FRESH_STALE_MS = 0
const PROGRAMS_PAGE_SIZE = 10

function shouldRetryDetail(failureCount: number, error: unknown): boolean {
  if (getQueryRetryHttpStatus(error) === 404) return false
  return shouldRetryQuery(failureCount, error)
}

/** 삭제·미존재(404)면 focus/reconnect 재요청을 막아 Network 노이즈를 줄인다. */
function shouldRefetchProgramDetail(query: { state: { error: unknown } }): boolean {
  return getQueryRetryHttpStatus(query.state.error) !== 404
}

function listKeyParams(query: PortalProgramListQuery) {
  return {
    keyword: query.keyword ?? '',
    portalTab: normalizePortalProgramFilterValues(query.portalTab),
    programType: normalizePortalProgramFilterValues(query.programType),
    recruitmentStatus: normalizePortalProgramFilterValues(query.recruitmentStatus),
    recruitmentTarget: normalizePortalProgramFilterValues(query.recruitmentTarget),
    educationTarget: normalizePortalProgramFilterValues(query.educationTarget),
    educationMethod: normalizePortalProgramFilterValues(query.educationMethod),
    operatingFrom: query.operatingFrom ?? '',
    operatingTo: query.operatingTo ?? '',
    sort: query.sort ?? 'LATEST',
    page: query.page,
    size: query.size,
  }
}

export type ProgramDetailStatus = 'loading' | 'ready' | 'not-found' | 'error'

export type ProgramDetailQuery = {
  program: ProgramDetail | undefined
  isLoading: boolean
  status: ProgramDetailStatus
  isRemoteEnabled: boolean
  refetch: () => void
}

export type PortalProgramsListQuery = {
  items: ProgramListItem[]
  totalCount: number
  totalPages: number
  currentPage: number
  isPending: boolean
  isError: boolean
  isRemoteEnabled: boolean
  refetch: () => void
}

export type HomePortalProgramsQuery = {
  items: ProgramListItem[]
  isPending: boolean
  isError: boolean
  isRemoteEnabled: boolean
}

/**
 * 홈 캐러셀 — GET /api/portal/programs?page=0&size=8&sort=LATEST
 * 실패·빈 목록이면 mock을 되살리지 않는다. 서버가 최대 8건을 내려도 FE에서 한 번 더 자른다.
 */
export function useHomePortalPrograms(): HomePortalProgramsQuery {
  const remote = isRemoteApiConfigured()
  const query = useQuery({
    queryKey: platformQueryKeys.program.homePreview(),
    queryFn: ({ signal }) => fetchPortalPrograms(HOME_PORTAL_PROGRAMS_QUERY, signal),
    enabled: remote,
    staleTime: LIST_STALE_MS,
    gcTime: LIST_GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })

  if (!remote) {
    return { items: [], isPending: false, isError: true, isRemoteEnabled: false }
  }
  if (query.isPending) {
    return { items: [], isPending: true, isError: false, isRemoteEnabled: true }
  }
  if (query.isError) {
    return { items: [], isPending: false, isError: true, isRemoteEnabled: true }
  }

  const items = (query.data?.items ?? [])
    .flatMap(row => {
      const mapped = mapPortalProgramListItem(row)
      return mapped ? [mapped] : []
    })
    .slice(0, HOME_PORTAL_PROGRAMS_QUERY.size)

  return { items, isPending: false, isError: false, isRemoteEnabled: true }
}

/** `/programs` 목록 — GET /api/portal/programs (Class C) */
export function usePortalProgramsList(params: ProgramsListParams): PortalProgramsListQuery {
  const remote = isRemoteApiConfigured()
  const portalQuery = toPortalProgramListQuery(params, PROGRAMS_PAGE_SIZE)
  const query = useQuery({
    queryKey: platformQueryKeys.program.list(listKeyParams(portalQuery)),
    queryFn: ({ signal }) => fetchPortalPrograms(portalQuery, signal),
    enabled: remote,
    staleTime: LIST_STALE_MS,
    gcTime: LIST_GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })

  const refetch = () => {
    void query.refetch()
  }

  if (!remote) {
    return {
      items: [],
      totalCount: 0,
      totalPages: 1,
      currentPage: 1,
      isPending: false,
      isError: true,
      isRemoteEnabled: false,
      refetch,
    }
  }

  if (query.isPending) {
    return {
      items: [],
      totalCount: 0,
      totalPages: 1,
      currentPage: params.page,
      isPending: true,
      isError: false,
      isRemoteEnabled: true,
      refetch,
    }
  }

  if (query.isError) {
    return {
      items: [],
      totalCount: 0,
      totalPages: 1,
      currentPage: params.page,
      isPending: false,
      isError: true,
      isRemoteEnabled: true,
      refetch,
    }
  }

  // The API applies every filter before pagination. Never filter only the current
  // page here, otherwise the cards and server total can describe different sets.
  const items = (query.data?.items ?? []).flatMap(row => {
    const mapped = mapPortalProgramListItem(row)
    return mapped ? [mapped] : []
  })
  const totalCount = query.data?.totalElements ?? 0
  const totalPages = Math.max(1, query.data?.totalPages ?? 1)

  return {
    items,
    totalCount,
    totalPages,
    currentPage: Math.min(params.page, totalPages),
    isPending: false,
    isError: false,
    isRemoteEnabled: true,
    refetch,
  }
}

/**
 * 공개 프로그램 상세.
 * CMS 숫자 id만 GET /api/portal/programs/{programId}.
 * slug·비숫자·404는 mock을 되살리지 않는다.
 *
 * `fresh: true` — 신청 화면 등 CMS에서 모집 기간을 바꾼 직후 캐시를 쓰지 않는다.
 */
export function useProgramDetail(
  programId: string | null | undefined,
  options?: { fresh?: boolean; focus?: PortalRecruitmentFocus | null },
): ProgramDetailQuery {
  const remote = isRemoteApiConfigured()
  const numericId = parsePortalProgramId(programId)
  const enabled = remote && numericId != null
  const fresh = options?.fresh === true

  const recruitmentId =
    options?.focus?.recruitmentIds?.length === 1 ? options.focus.recruitmentIds[0] : undefined
  const applicationType =
    options?.focus?.applicationTypes?.length === 1
      ? options.focus.applicationTypes[0]
      : undefined
  const detailScope = { recruitmentId, applicationType }

  const detailQuery = useQuery({
    queryKey: platformQueryKeys.program.detail(String(numericId ?? ''), detailScope),
    queryFn: ({ signal }) => fetchPortalProgramDetail(numericId!, signal, detailScope),
    enabled,
    staleTime: fresh ? DETAIL_FRESH_STALE_MS : DETAIL_STALE_MS,
    gcTime: DETAIL_GC_MS,
    refetchOnMount: query => {
      if (!shouldRefetchProgramDetail(query)) return false
      return fresh ? 'always' : true
    },
    refetchOnWindowFocus: query => (shouldRefetchProgramDetail(query) ? fresh : false),
    refetchOnReconnect: shouldRefetchProgramDetail,
    retry: shouldRetryDetail,
    retryDelay: queryRetryDelay,
  })

  const refetch = () => {
    void detailQuery.refetch()
  }

  if (!programId || numericId == null) {
    return {
      program: undefined,
      isLoading: false,
      status: 'not-found',
      isRemoteEnabled: remote,
      refetch,
    }
  }

  if (!remote) {
    return {
      program: undefined,
      isLoading: false,
      status: 'error',
      isRemoteEnabled: false,
      refetch,
    }
  }

  if (detailQuery.isPending) {
    return {
      program: undefined,
      isLoading: true,
      status: 'loading',
      isRemoteEnabled: remote,
      refetch,
    }
  }

  if (detailQuery.isError) {
    const statusCode = getQueryRetryHttpStatus(detailQuery.error)
    return {
      program: undefined,
      isLoading: false,
      status: statusCode === 404 ? 'not-found' : 'error',
      isRemoteEnabled: remote,
      refetch,
    }
  }

  const program = detailQuery.data
    ? mapPortalProgramDetail(detailQuery.data, options?.focus)
    : null
  if (!program) {
    return {
      program: undefined,
      isLoading: false,
      status: 'not-found',
      isRemoteEnabled: remote,
      refetch,
    }
  }

  return {
    program,
    isLoading: false,
    status: 'ready',
    isRemoteEnabled: remote,
    refetch,
  }
}

export { PROGRAMS_PAGE_SIZE }
