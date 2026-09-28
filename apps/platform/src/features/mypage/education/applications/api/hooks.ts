import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import type { EducationApplicationListItem } from '../model/types'
import {
  cancelMyProgramApplication,
  fetchMyProgramApplicationDetail,
  fetchMyProgramApplications,
} from './client'
import {
  mapPortalProgramApplicationDetail,
  mapPortalProgramApplicationListItem,
} from './mappers'
import type { ProgramApplicationType } from './types'

const APPLICATIONS_STALE_MS = 30_000
const APPLICATIONS_GC_MS = 10 * 60_000
const APPLICATIONS_FETCH_SIZE = 100

export type MypageApplicationScope = 'education' | 'lecture' | 'volunteer'

export const APPLICATION_TYPES_BY_SCOPE = {
  education: ['INDIVIDUAL', 'ORGANIZATION'],
  lecture: ['INSTRUCTOR'],
  volunteer: ['VOLUNTEER'],
} as const satisfies Record<MypageApplicationScope, readonly ProgramApplicationType[]>

type MyProgramApplicationsQueryResult = {
  items: EducationApplicationListItem[]
  isLoading: boolean
  isError: boolean
  isRemoteEnabled: boolean
  refetch: () => void
}

type MyProgramApplicationDetailQueryResult = {
  application: EducationApplicationListItem | undefined
  isLoading: boolean
  isError: boolean
  isRemoteEnabled: boolean
  refetch: () => void
}

export function useMyProgramApplications(
  scope: MypageApplicationScope,
): MyProgramApplicationsQueryResult {
  const remote = isRemoteApiConfigured()
  const applicationTypes = APPLICATION_TYPES_BY_SCOPE[scope]
  const query = useQuery({
    queryKey: platformQueryKeys.mypage.programApplications.list({
      applicationTypes,
      statusGroup: '',
      keyword: '',
      page: 0,
      size: APPLICATIONS_FETCH_SIZE,
    }),
    queryFn: async ({ signal }) => {
      const pages = await Promise.all(
        applicationTypes.map(applicationType =>
          fetchMyProgramApplications(
            {
              applicationType,
              page: 0,
              size: APPLICATIONS_FETCH_SIZE,
            },
            signal,
          ),
        ),
      )
      return pages.flatMap(page =>
        (page.items ?? []).flatMap(row => {
          const mapped = mapPortalProgramApplicationListItem(row)
          return mapped ? [mapped] : []
        }),
      )
    },
    enabled: remote,
    staleTime: APPLICATIONS_STALE_MS,
    gcTime: APPLICATIONS_GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })

  const refetch = () => {
    void query.refetch()
  }

  if (!remote) {
    return { items: [], isLoading: false, isError: true, isRemoteEnabled: false, refetch }
  }
  if (query.isPending) {
    return { items: [], isLoading: true, isError: false, isRemoteEnabled: true, refetch }
  }
  if (query.isError) {
    return { items: [], isLoading: false, isError: true, isRemoteEnabled: true, refetch }
  }
  return {
    items: query.data ?? [],
    isLoading: false,
    isError: false,
    isRemoteEnabled: true,
    refetch,
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
      isRemoteEnabled: false,
      refetch,
    }
  }
  if (!applicationType || !applicationId) {
    return {
      application: undefined,
      isLoading: false,
      isError: true,
      isRemoteEnabled: true,
      refetch,
    }
  }
  if (query.isPending) {
    return {
      application: undefined,
      isLoading: true,
      isError: false,
      isRemoteEnabled: true,
      refetch,
    }
  }
  if (query.isError) {
    return {
      application: undefined,
      isLoading: false,
      isError: true,
      isRemoteEnabled: true,
      refetch,
    }
  }

  return {
    application: query.data ? (mapPortalProgramApplicationDetail(query.data) ?? undefined) : undefined,
    isLoading: false,
    isError: false,
    isRemoteEnabled: true,
    refetch,
  }
}

export function useCancelMyProgramApplicationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: { applicationType: ProgramApplicationType; applicationId: string }) =>
      cancelMyProgramApplication(args.applicationType, args.applicationId),
    onSuccess: (_data, args) => {
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.mypage.programApplications.all(),
      })
      void queryClient.removeQueries({
        queryKey: platformQueryKeys.mypage.programApplications.detail(
          args.applicationType,
          args.applicationId,
        ),
      })
    },
  })
}
