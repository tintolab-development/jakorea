/**
 * 프로그램 진행현황 탭 — 참여 봉사자 목록
 * remote only · mock/로컬 append 금지
 */

import { useCallback, useEffect, useState } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { type ParticipatingVolunteerRow } from '@/features/program/general/model/participating-volunteers'
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

  const [volunteerList, setVolunteerList] = useState<ParticipatingVolunteerRow[]>(() => [])

  useEffect(() => {
    if (remoteEnabled) {
      if (remoteQuery.data) {
        setVolunteerList(remoteQuery.data.pages.flatMap(page => page.rows))
      }
      return
    }
    setVolunteerList([])
  }, [remoteEnabled, remoteQuery.data])

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
    hasNextPage: remoteQuery.hasNextPage ?? false,
    isFetchingNextPage: remoteQuery.isFetchingNextPage,
    fetchNextPage: remoteQuery.fetchNextPage,
    registerVolunteerParticipant,
  }
}
