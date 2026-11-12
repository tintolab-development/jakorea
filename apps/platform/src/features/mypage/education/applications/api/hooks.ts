import { isAxiosError } from 'axios'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import type { EducationApplicationListItem, EducationApplicationTab } from '../model/types'
import { EDUCATION_APPLICATION_PAGE_SIZE } from '../model/types'
import { parsePortalProgramId } from '@/features/program/api/mappers'
import { getApplicationApiErrorCode } from '@/features/program/lib/application-api-error'
import { invalidateMypageApplicationSurfaces } from './invalidate-mypage-application-surfaces'
import {
  cancelMyProgramApplication,
  fetchMyProgramApplicationDetail,
  fetchMyProgramApplications,
  fetchPortalMeFormBindingRender,
} from './client'
import {
  mapPortalProgramApplicationDetail,
  mapPortalProgramApplicationListItem,
} from './mappers'
import { listEducationApplications } from '../lib/list'
import { resolveStatusGroupForTab } from './status-group'
import type { ProgramApplicationType } from './types'

const APPLICATIONS_STALE_MS = 30_000
const APPLICATIONS_GC_MS = 10 * 60_000
/** statusGroup 없이 전체 조회할 때(레거시·탭 미전달) 상한 */
const APPLICATIONS_FETCH_SIZE = 20
/** 탭별 displayStatus 분류용 — BE statusGroup과 어긋날 때 목록 SSOT를 맞춘다. */
const TAB_CLIENT_FILTER_FETCH_SIZE = 100

export type MypageApplicationScope = 'education' | 'lecture' | 'volunteer'

export const APPLICATION_TYPES_BY_SCOPE = {
  education: ['INDIVIDUAL', 'ORGANIZATION'],
  lecture: ['INSTRUCTOR'],
  volunteer: ['VOLUNTEER'],
} as const satisfies Record<MypageApplicationScope, readonly ProgramApplicationType[]>

export type MyProgramApplicationsListOptions = {
  /** 전달 시 탭별 `statusGroup` + 서버 페이지네이션을 사용한다. */
  tab?: EducationApplicationTab
  /** 1-base UI 페이지. tab이 있을 때만 사용. */
  page?: number
  pageSize?: number
}

type MyProgramApplicationsQueryResult = {
  items: EducationApplicationListItem[]
  totalElements: number
  totalPages: number
  currentPage: number
  isLoading: boolean
  isError: boolean
  isRemoteEnabled: boolean
  /** true면 items가 이미 서버 페이지 슬라이스다. 클라이언트 재필터/재페이징 불필요. */
  isServerPaged: boolean
  refetch: () => void
}

type MyProgramApplicationDetailQueryResult = {
  application: EducationApplicationListItem | undefined
  isLoading: boolean
  isError: boolean
  errorCode: string | null
  isRemoteEnabled: boolean
  refetch: () => void
}

function mapListItems(
  rows: Awaited<ReturnType<typeof fetchMyProgramApplications>>['items'],
): EducationApplicationListItem[] {
  return (rows ?? []).flatMap(row => {
    const mapped = mapPortalProgramApplicationListItem(row)
    return mapped ? [mapped] : []
  })
}

function emptyRemoteResult(refetch: () => void): MyProgramApplicationsQueryResult {
  return {
    items: [],
    totalElements: 0,
    totalPages: 1,
    currentPage: 1,
    isLoading: false,
    isError: true,
    isRemoteEnabled: false,
    isServerPaged: false,
    refetch,
  }
}

/**
 * 내 프로그램 신청 목록.
 * - `options.tab` 없음: applicationType별 전체(최대 20) 조회 — 봉사 등 클라이언트 탭 필터용
 * - `options.tab` 있음: 탭별 statusGroup + 서버 page/size (교육·강의현황)
 */
export function useMyProgramApplications(
  scope: MypageApplicationScope,
  options?: MyProgramApplicationsListOptions,
): MyProgramApplicationsQueryResult {
  const remote = isRemoteApiConfigured()
  const applicationTypes = APPLICATION_TYPES_BY_SCOPE[scope]
  const tab = options?.tab
  const pageSize = options?.pageSize ?? EDUCATION_APPLICATION_PAGE_SIZE
  const uiPage = Math.max(1, options?.page ?? 1)
  const useClientTabFilter = tab != null && tab !== 'all'
  const statusGroup =
    tab != null && tab !== 'all' ? resolveStatusGroupForTab(tab) : undefined
  const serverPaged = tab != null && !useClientTabFilter
  const statusGroupKey = useClientTabFilter
    ? `TAB:${tab}:${statusGroup ?? ''}`
    : tab === 'all'
      ? 'ALL'
      : statusGroup == null
        ? ''
        : statusGroup
  const apiPage = useClientTabFilter ? 0 : serverPaged ? uiPage - 1 : 0
  const apiSize = useClientTabFilter
    ? TAB_CLIENT_FILTER_FETCH_SIZE
    : serverPaged
      ? pageSize
      : APPLICATIONS_FETCH_SIZE

  const query = useQuery({
    queryKey: platformQueryKeys.mypage.programApplications.list({
      applicationTypes,
      statusGroup: statusGroupKey,
      keyword: '',
      page: apiPage,
      size: apiSize,
    }),
    queryFn: async ({ signal }) => {
      const pages = await Promise.all(
        applicationTypes.map(applicationType =>
          fetchMyProgramApplications(
            {
              applicationType,
              // 탭 클라이언트 필터: BE statusGroup이 결과 대기를 빼면 신청 탭이 비므로 전체에서 displayStatus로 나눈다.
              statusGroup: useClientTabFilter ? undefined : statusGroup ?? undefined,
              page: apiPage,
              size: apiSize,
            },
            signal,
          ),
        ),
      )
      const mergedItems = pages.flatMap(page => mapListItems(page.items))
      if (useClientTabFilter && tab != null) {
        const paged = listEducationApplications(mergedItems, {
          tab,
          page: uiPage,
          pageSize,
        })
        return {
          items: paged.items,
          totalElements: paged.totalElements,
          totalPages: paged.totalPages,
          currentPage: paged.currentPage,
          serverPaged: false,
        }
      }
      const totalElements = pages.reduce((sum, page) => sum + (page.totalElements ?? 0), 0)
      const totalPages = Math.max(
        1,
        pages.reduce((max, page) => Math.max(max, page.totalPages ?? 0), 0),
        Math.ceil(totalElements / apiSize) || 1,
      )
      return {
        items: mergedItems,
        totalElements,
        totalPages,
        currentPage: uiPage,
        serverPaged,
      }
    },
    enabled: remote,
    staleTime: APPLICATIONS_STALE_MS,
    gcTime: APPLICATIONS_GC_MS,
    placeholderData: serverPaged ? keepPreviousData : undefined,
    // 신청 완료·취소 후 목록 화면으로 돌아오면 서버 원본을 즉시 다시 확인한다.
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })

  const refetch = () => {
    void query.refetch()
  }

  if (!remote) {
    return emptyRemoteResult(refetch)
  }
  if (query.isPending && !query.data) {
    return {
      items: [],
      totalElements: 0,
      totalPages: 1,
      currentPage: uiPage,
      isLoading: true,
      isError: false,
      isRemoteEnabled: true,
      isServerPaged: serverPaged,
      refetch,
    }
  }
  if (query.isError && !query.data) {
    return {
      items: [],
      totalElements: 0,
      totalPages: 1,
      currentPage: uiPage,
      isLoading: false,
      isError: true,
      isRemoteEnabled: true,
      isServerPaged: serverPaged,
      refetch,
    }
  }

  const data = query.data
  return {
    items: data?.items ?? [],
    totalElements: data?.totalElements ?? 0,
    totalPages: data?.totalPages ?? 1,
    currentPage: data?.currentPage ?? uiPage,
    isLoading: query.isPending && !data,
    isError: query.isError,
    isRemoteEnabled: true,
    isServerPaged: data?.serverPaged ?? serverPaged,
    refetch,
  }
}

const PROBE_EDUCATION_APPLICATION_TYPES: ProgramApplicationType[] = ['ORGANIZATION', 'INDIVIDUAL']

function isNotFoundApplicationDetailError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 404
}

/**
 * `/mypage/education/:applicationId` 레거시 URL — ORGANIZATION·INDIVIDUAL 상세 probe.
 */
export function useProbeEducationApplicationType(
  applicationId: string,
  routeApplicationType: ProgramApplicationType | null,
) {
  const remote = isRemoteApiConfigured()
  const enabled = remote && Boolean(applicationId) && routeApplicationType == null
  const query = useQuery({
    queryKey: [
      ...platformQueryKeys.mypage.programApplications.all(),
      'education-type-probe',
      applicationId,
    ],
    queryFn: async ({ signal }) => {
      for (const applicationType of PROBE_EDUCATION_APPLICATION_TYPES) {
        try {
          await fetchMyProgramApplicationDetail(applicationType, applicationId, signal)
          return applicationType
        } catch (error) {
          if (isNotFoundApplicationDetailError(error)) continue
          if (isAxiosError(error) && error.response?.status === 409) return applicationType
          throw error
        }
      }
      return null
    },
    enabled,
    staleTime: 5 * 60_000,
    gcTime: APPLICATIONS_GC_MS,
    retry: false,
    refetchOnWindowFocus: false,
  })

  return {
    applicationType: query.data ?? null,
    isProbing: enabled && query.isPending,
  }
}

export function useMyProgramApplicationDetail(
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined,
): MyProgramApplicationDetailQueryResult {
  const remote = isRemoteApiConfigured()
  const enabled = remote && Boolean(applicationType && applicationId)
  const query = useQuery({
    queryKey: platformQueryKeys.mypage.programApplications.detail(
      applicationType ?? '',
      applicationId ?? '',
    ),
    queryFn: ({ signal }) => fetchMyProgramApplicationDetail(applicationType!, applicationId!, signal),
    enabled,
    staleTime: APPLICATIONS_STALE_MS,
    gcTime: APPLICATIONS_GC_MS,
    refetchOnMount: 'always',
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
      application: undefined,
      isLoading: false,
      isError: true,
      errorCode: null,
      isRemoteEnabled: false,
      refetch,
    }
  }
  if (!applicationType || !applicationId) {
    return {
      application: undefined,
      isLoading: false,
      isError: true,
      errorCode: null,
      isRemoteEnabled: true,
      refetch,
    }
  }
  if (query.isPending) {
    return {
      application: undefined,
      isLoading: true,
      isError: false,
      errorCode: null,
      isRemoteEnabled: true,
      refetch,
    }
  }
  if (query.isError) {
    return {
      application: undefined,
      isLoading: false,
      isError: true,
      errorCode: getApplicationApiErrorCode(query.error),
      isRemoteEnabled: true,
      refetch,
    }
  }

  const application = query.data
    ? (mapPortalProgramApplicationDetail(query.data, applicationType ?? undefined) ?? undefined)
    : undefined
  return {
    application,
    isLoading: false,
    isError: false,
    errorCode: application?.portalWarningCode ?? null,
    isRemoteEnabled: true,
    refetch,
  }
}

export function usePortalMeFormBindingRender(
  programId: string | null | undefined,
  bindingId: number | null | undefined,
): {
  document: Record<string, unknown> | null
  isLoading: boolean
  isError: boolean
} {
  const remote = isRemoteApiConfigured()
  const numericProgramId = parsePortalProgramId(programId)
  const enabled = remote && numericProgramId != null && bindingId != null && bindingId > 0
  const query = useQuery({
    queryKey: platformQueryKeys.mypage.programApplications.formBindingRender(
      String(numericProgramId ?? ''),
      bindingId ?? 0,
    ),
    queryFn: ({ signal }) => fetchPortalMeFormBindingRender(numericProgramId!, bindingId!, signal),
    enabled,
    staleTime: APPLICATIONS_STALE_MS,
    gcTime: APPLICATIONS_GC_MS,
    refetchOnWindowFocus: false,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })

  if (!enabled) {
    return { document: null, isLoading: false, isError: false }
  }
  if (query.isPending) {
    return { document: null, isLoading: true, isError: false }
  }
  if (query.isError) {
    return { document: null, isLoading: false, isError: true }
  }
  return { document: query.data ?? null, isLoading: false, isError: false }
}

export function useCancelMyProgramApplicationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: {
      applicationType: ProgramApplicationType
      applicationId: string
      /** 신청 취소 후 재신청 가능 여부 캐시를 갱신하기 위한 프로그램 ID */
      programId?: string | number | null
    }) =>
      cancelMyProgramApplication(args.applicationType, args.applicationId),
    onSuccess: async (_data, args) => {
      const invalidationTasks = [invalidateMypageApplicationSurfaces(queryClient)]
      if (args.programId != null && String(args.programId).trim()) {
        const programId = String(args.programId)
        invalidationTasks.push(
          queryClient.invalidateQueries({
            queryKey: platformQueryKeys.program.applicationOptions(programId),
          }),
          // 프로그램 상세는 모집 상태·신청 가능 상태를 함께 보여줄 수 있으므로
          // 취소 직후 오래된 상세 캐시를 남기지 않는다. scope가 다른 상세도 같은
          // programId prefix 아래에서 함께 재검증한다.
          queryClient.invalidateQueries({
            queryKey: platformQueryKeys.program.detailPrefix(programId),
          }),
        )
      }
      await Promise.all(invalidationTasks)
      queryClient.removeQueries({
        queryKey: platformQueryKeys.mypage.programApplications.detail(
          args.applicationType,
          args.applicationId,
        ),
      })
    },
  })
}
