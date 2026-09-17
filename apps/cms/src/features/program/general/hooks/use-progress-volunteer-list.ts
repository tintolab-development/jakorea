/**
 * 프로그램 진행현황 탭 — 참여 봉사자 목록
 * remote only · mock/로컬 append 금지
 * TODO(temp-mock): 열여라 참깨 — 참여 봉사자·정산 현황 검증 후 삭제 (임시 목록 append)
 */

import { useEffect, useMemo, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { type ParticipatingVolunteerRow } from '@/features/program/general/model/participating-volunteers'
import { fetchGeneralParticipatingVolunteersPage } from '@/features/program/general/api/admin-program-progress-service'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { shouldUseGeneralProgramProgressRemoteApi } from '@/features/program/general/api/program-progress-remote-capabilities'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'
import {
  useIsCompanySchoolProgramsSurface,
  useIsTrainedTeachersProgramsSurface,
} from '@/features/program/1c-1s/lib/use-company-school-surface-remote'

// TODO(temp-mock): 열여라 참깨 — 참여 봉사자·정산 현황 검증 후 삭제
export const TEMP_PROGRESS_VOLUNTEER_PREFIX = 'temp-progress-volunteer-'

const TEMP_VOLUNTEER_SCHOOLS = [
  '서울해봄초등학교',
  '서울푸른초등학교',
  '서울나래초등학교',
  '서울미래중학교',
] as const

function buildTemporaryProgressVolunteers(programId: string): ParticipatingVolunteerRow[] {
  return TEMP_VOLUNTEER_SCHOOLS.map((schoolName, index) => {
    const sequence = index + 1
    return {
      id: `${TEMP_PROGRESS_VOLUNTEER_PREFIX}${sequence}`,
      memberId: 989_001 + index,
      programId,
      no: sequence,
      volunteerName: `임시 봉사자 ${sequence}`,
      id1365: `1365-${String(20260001 + index)}`,
      assignedInstitutionNames: [schoolName],
      sessions: [1, 2, 3, 4].map(round => ({
        round,
        date: `2026.10.${String(12 + index * 4 + round).padStart(2, '0')}`,
        dayOfWeek: ['월', '화', '수', '목'][index],
        duration: '2시간',
        format: '대면 봉사',
        classNum: `${round}교시`,
        timeRange: `${String(8 + round).padStart(2, '0')}:00 ~ ${String(9 + round).padStart(2, '0')}:50`,
        status: round === 1 ? 'completed' : 'pending',
      })),
      contact: `010-8000-${String(1000 + sequence)}`,
      email: `temp-volunteer-${sequence}@jakorea.example`,
      isReturningVolunteer: index % 2 === 1,
      contactRaw: `010-8000-${String(1000 + sequence)}`,
      emailRaw: `temp-volunteer-${sequence}@jakorea.example`,
      gender: index % 2 === 0 ? '여성' : '남성',
      birthDate: `199${index}-0${sequence}-10`,
      age: 27 + index,
      scheduleChangeCancelCount: index,
      hasJaVolunteerExperience: index % 2 === 1,
      applicationType: index % 2 === 0 ? 'new' : 'ujat-graduate',
      adminComment: `${schoolName} 정산 현황 확인용 임시 봉사자`,
      activityWithdrawn: false,
      activityWithdrawStopSessionKey: '',
      performanceExcludedSessionKeys: [],
      essayIntro: '청소년 교육에 기여하고자 JA Korea 봉사활동에 지원했습니다.',
      essayEducationExperience: '경제교육 보조 및 청소년 멘토링 경험이 있습니다.',
      essayNecessity: '학생 참여형 활동을 원활하게 운영하기 위해 봉사자가 필요합니다.',
      essayJaExperience:
        index % 2 === 1 ? '이전 JA Korea 프로그램 봉사활동에 참여했습니다.' : '첫 참여입니다.',
    }
  })
}

export function useProgressVolunteerList(programId?: string, _program?: unknown) {
  void _program
  const isCompanySchoolSurface = useIsCompanySchoolProgramsSurface()
  const isTrainedTeachersSurface = useIsTrainedTeachersProgramsSurface()
  const remoteEnabled = shouldUseGeneralProgramProgressRemoteApi() && Boolean(programId)

  // TODO(temp-mock): 열여라 참깨 — 참여 봉사자·정산 현황 검증 후 삭제
  const temporaryProgressVolunteers = useMemo(
    () =>
      programId && !isCompanySchoolSurface && !isTrainedTeachersSurface
        ? buildTemporaryProgressVolunteers(programId)
        : [],
    [isCompanySchoolSurface, isTrainedTeachersSurface, programId]
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
    if (remoteEnabled) {
      if (remoteQuery.data) {
        const remoteRows = remoteQuery.data.pages.flatMap(page => page.rows)
        setVolunteerList([...temporaryProgressVolunteers, ...remoteRows])
      } else {
        setVolunteerList(temporaryProgressVolunteers)
      }
      return
    }
    setVolunteerList(temporaryProgressVolunteers)
  }, [remoteEnabled, remoteQuery.data, temporaryProgressVolunteers])

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
