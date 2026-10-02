/**
 * 프로그램 진행현황 탭 — 참여 봉사자 목록
 * remote only · mock/로컬 append 금지
 * TODO(temp-mock): 열여라 참깨 — FE 전용 기관 프로그램 id 에만 시드
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { type ParticipatingVolunteerRow } from '@/features/program/general/model/participating-volunteers'
import {
  createGeneralProgramVolunteerParticipant,
  fetchGeneralParticipatingVolunteersPage,
} from '@/features/program/general/api/admin-program-progress-service'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { useProgramProgressRemoteEnabledForSurface } from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import {
  notifyProgramApiUnavailable,
  useNotifyProgramApiUnavailableOnce,
} from '@/features/program/shared/lib/program-api-unavailable'
import { isGeneralProgramTempMockProgramId } from '@/features/program/general/api/temp-mock-capabilities'
import { getTempMockShowcaseProgressVolunteers } from '@/features/program/general/lib/temp-mock-program-resolve'
import type { Program } from '@/types/domain'

export function useProgressVolunteerList(programId?: string, _program?: Program | null) {
  const queryClient = useQueryClient()
  const isTempMockProgram = isGeneralProgramTempMockProgramId(programId)
  const remoteEnabled = useProgramProgressRemoteEnabledForSurface(programId)

  const temporaryProgressVolunteers = useMemo(
    () => (isTempMockProgram ? getTempMockShowcaseProgressVolunteers(programId) : []),
    [isTempMockProgram, programId]
  )

  useNotifyProgramApiUnavailableOnce(
    !remoteEnabled && !isTempMockProgram,
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

  const handleAddVolunteerByMemberId = useCallback(
    async (memberId: string, volunteerKind: 'GENERAL' | 'EMPLOYEE' = 'GENERAL'): Promise<boolean> => {
      if (isTempMockProgram) return true
      if (!remoteEnabled || !programId) {
        notifyProgramApiUnavailable(
          volunteerKind === 'EMPLOYEE'
            ? 'general-progress-volunteer-employee-register'
            : 'general-progress-volunteer-register',
          volunteerKind === 'EMPLOYEE'
            ? '참여 봉사자 · 임직원 자원봉사자 등록'
            : '참여 봉사자 · 봉사자 등록'
        )
        return false
      }
      const numericMemberId = Number(memberId)
      if (!Number.isFinite(numericMemberId) || numericMemberId <= 0) {
        throw new Error('봉사자 회원 ID가 올바르지 않습니다.')
      }
      await createGeneralProgramVolunteerParticipant(programId, numericMemberId, volunteerKind)
      await queryClient.invalidateQueries({
        queryKey: generalProgramProgressQueryKeys.volunteers(programId),
      })
      return true
    },
    [isTempMockProgram, programId, queryClient, remoteEnabled]
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
    handleAddVolunteerByMemberId,
  }
}
