/**
 * 프로그램 진행현황 탭 — 참여 봉사자 목록
 * prefer mock / remote OFF → FE mock; remote ON → API
 */

import { useCallback, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  MOCK_PARTICIPATING_VOLUNTEERS,
  type ParticipatingVolunteerRow,
} from '@/data/mock/participating-volunteers'
import { buildParticipatingVolunteerRowFromMember } from '../lib/participating-volunteer-member-candidates'
import { fetchGeneralParticipatingVolunteers } from '@/features/program/general/api/admin-program-progress-service'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { shouldUseGeneralProgramProgressRemoteApi } from '@/features/program/general/api/program-progress-remote-capabilities'
import { shouldPreferGeneralProgramProgressMock } from '@/features/program/general/lib/prefer-general-application-list-mock'
import type { Program } from '@/types/domain'

export function useProgressVolunteerList(
  programId?: string,
  program?: Program | null
) {
  const preferMock = shouldPreferGeneralProgramProgressMock(program ?? null)
  const remoteEnabled =
    !preferMock && shouldUseGeneralProgramProgressRemoteApi() && Boolean(programId)
  const remoteQuery = useQuery({
    queryKey: generalProgramProgressQueryKeys.volunteers(programId ?? ''),
    queryFn: () => fetchGeneralParticipatingVolunteers(programId!),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })

  const [volunteerList, setVolunteerList] = useState<ParticipatingVolunteerRow[]>(() =>
    remoteEnabled ? [] : MOCK_PARTICIPATING_VOLUNTEERS.map(row => ({ ...row }))
  )

  useEffect(() => {
    if (remoteEnabled) {
      if (remoteQuery.data) setVolunteerList(remoteQuery.data)
      return
    }
    setVolunteerList(MOCK_PARTICIPATING_VOLUNTEERS.map(row => ({ ...row })))
  }, [remoteEnabled, remoteQuery.data])

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
  }
}
