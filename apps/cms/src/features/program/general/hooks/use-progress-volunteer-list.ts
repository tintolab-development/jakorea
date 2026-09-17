/**
 * 프로그램 진행현황 탭 — 참여 봉사자 목록
 * API 미연동 시 빈 목록 + alert
 */

import { useCallback, useEffect, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { type ParticipatingVolunteerRow } from '@/features/program/general/model/participating-volunteers'
import { buildParticipatingVolunteerRowFromMember } from '../lib/participating-volunteer-member-candidates'
import { fetchGeneralParticipatingVolunteersPage } from '@/features/program/general/api/admin-program-progress-service'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { shouldUseGeneralProgramProgressRemoteApi } from '@/features/program/general/api/program-progress-remote-capabilities'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'

export function useProgressVolunteerList(
  programId?: string,
  _program?: unknown
) {
  void _program
  const remoteEnabled = shouldUseGeneralProgramProgressRemoteApi() && Boolean(programId)

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
  }, [remoteEnabled, remoteQuery.data, programId])

  const addVolunteerFromMember = useCallback(
    async (memberId: string) => {
      const nextNo = volunteerList.reduce((max, row) => Math.max(max, row.no), 0) + 1
      const nextId = `participating-volunteer-added-${memberId}`
      const row = await buildParticipatingVolunteerRowFromMember(memberId, nextNo, nextId)
      if (row) {
        setVolunteerList(prev => [...prev, row])
      }
      return row
    },
    [volunteerList]
  )

  return {
    volunteerList,
    addVolunteerFromMember,
    applicationsLoading: remoteEnabled
      ? remoteQuery.isFetching && remoteQuery.data === undefined
      : false,
    isRemoteDataSource: remoteEnabled,
    hasNextPage: remoteQuery.hasNextPage ?? false,
    isFetchingNextPage: remoteQuery.isFetchingNextPage,
    fetchNextPage: remoteQuery.fetchNextPage,
  }
}
