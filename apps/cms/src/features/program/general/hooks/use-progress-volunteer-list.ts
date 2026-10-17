/**
 * 프로그램 진행현황 탭 — 참여 봉사자 목록
 * remote only · mock/로컬 append 금지
 */

import { useCallback, useMemo } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchGeneralParticipatingVolunteersPage,
  registerGeneralVolunteerParticipant,
} from '@/features/program/general/api/admin-program-progress-service'
import type { VolunteerParticipantRegisterRequest } from '@/features/program/general/api/program-progress-api-client'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { useProgramProgressRemoteEnabledForSurface } from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import {
  notifyProgramApiUnavailable,
  useNotifyProgramApiUnavailableOnce,
} from '@/features/program/shared/lib/program-api-unavailable'
import type { Program } from '@/types/domain'

export function useProgressVolunteerList(programId?: string, _program?: Program | null) {
  const queryClient = useQueryClient()
  const remoteEnabled = useProgramProgressRemoteEnabledForSurface(programId)

  useNotifyProgramApiUnavailableOnce(
    !remoteEnabled,
    'general-progress-volunteers',
    '프로그램 진행 현황 · 봉사자'
  )

  const remoteQuery = useInfiniteQuery({
    queryKey: generalProgramProgressQueryKeys.volunteers(programId ?? ''),
    queryFn: ({ pageParam }) =>
      fetchGeneralParticipatingVolunteersPage(programId!, pageParam),
    initialPageParam: 0,
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })

  // 서버 응답을 그대로 파생해 사용한다. 별도 로컬 목록을 두면 재조회 결과가
  // 빈 배열인 경우에도 이전 목록이 남거나 프로그램 전환 시 stale row가 보일 수 있다.
  const volunteerList = useMemo(
    () =>
      remoteEnabled && remoteQuery.data
        ? remoteQuery.data.pages.flatMap(page => page.rows)
        : [],
    [remoteEnabled, remoteQuery.data]
  )

  const registerVolunteerParticipant = useCallback(
    async (payload: VolunteerParticipantRegisterRequest): Promise<boolean> => {
      if (!remoteEnabled || !programId) {
        notifyProgramApiUnavailable(
          'general-progress-volunteer-register',
          '참여 봉사자 · 봉사자 등록'
        )
        return false
      }
      await registerGeneralVolunteerParticipant(programId, payload)
      await queryClient.invalidateQueries({
        queryKey: generalProgramProgressQueryKeys.volunteers(programId),
      })
      await queryClient.invalidateQueries({
        queryKey: generalProgramProgressQueryKeys.educationScopes(),
      })
      return true
    },
    [programId, queryClient, remoteEnabled]
  )

  return {
    volunteerList,
    applicationsLoading: remoteEnabled
      ? remoteQuery.isFetching && remoteQuery.data === undefined
      : false,
    isRemoteDataSource: remoteEnabled,
    isSuccess: remoteQuery.isSuccess,
    hasNextPage: remoteQuery.hasNextPage ?? false,
    isFetchingNextPage: remoteQuery.isFetchingNextPage,
    fetchNextPage: remoteQuery.fetchNextPage,
    registerVolunteerParticipant,
  }
}
