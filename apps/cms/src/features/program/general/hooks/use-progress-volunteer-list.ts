/**
 * 프로그램 진행현황 탭 — 참여 봉사자 목록
 * remote only · mock/로컬 append 금지
 * TODO(temp-mock): 열여라 참깨 — FE 전용 기관 프로그램 id 에만 시드
 */

import { useEffect, useMemo, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { type ParticipatingVolunteerRow } from '@/features/program/general/model/participating-volunteers'
import { fetchGeneralParticipatingVolunteersPage } from '@/features/program/general/api/admin-program-progress-service'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { shouldUseGeneralProgramProgressRemoteApi } from '@/features/program/general/api/program-progress-remote-capabilities'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'
import { isGeneralProgramTempMockProgramId } from '@/features/program/general/api/temp-mock-capabilities'
import { getTempMockOrgProgressVolunteers } from '@/features/program/general/lib/temp-mock-org-program'
import type { Program } from '@/types/domain'

export function useProgressVolunteerList(programId?: string, _program?: Program | null) {
  const isTempMockProgram = isGeneralProgramTempMockProgramId(programId)
  const remoteEnabled =
    shouldUseGeneralProgramProgressRemoteApi() && Boolean(programId) && !isTempMockProgram

  const temporaryProgressVolunteers = useMemo(
    () => (isTempMockProgram ? getTempMockOrgProgressVolunteers(programId) : []),
    [isTempMockProgram, programId]
  )

  useNotifyProgramApiUnavailableOnce(
    !remoteEnabled && temporaryProgressVolunteers.length === 0,
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
    if (isTempMockProgram) {
      setVolunteerList(temporaryProgressVolunteers)
      return
    }
    if (remoteEnabled) {
      if (remoteQuery.data) {
        setVolunteerList(remoteQuery.data.pages.flatMap(page => page.rows))
      }
      return
    }
    setVolunteerList([])
  }, [isTempMockProgram, remoteEnabled, remoteQuery.data, temporaryProgressVolunteers])

  return {
    volunteerList,
    applicationsLoading: remoteEnabled
      ? remoteQuery.isFetching && remoteQuery.data === undefined
      : false,
    isRemoteDataSource: remoteEnabled,
    hasNextPage: remoteQuery.hasNextPage ?? false,
    isFetchingNextPage: remoteQuery.isFetchingNextPage,
    fetchNextPage: remoteQuery.fetchNextPage,
  }
}
