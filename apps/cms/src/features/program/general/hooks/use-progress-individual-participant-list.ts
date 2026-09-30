import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchGeneralProgramParticipantsPage } from '@/features/program/general/api/admin-program-progress-service'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { isGeneralProgramTempMockProgramId } from '@/features/program/general/api/temp-mock-capabilities'
import { useProgramProgressRemoteEnabledForSurface } from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import { getTempMockShowcaseIndividualProgressParticipants } from '@/features/program/general/lib/temp-mock-program-resolve'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'
import { type ParticipatingIndividualParticipantRow } from '@/features/program/general/model/participating-individual-participants'

/** 개인 참여자 목록 — API 미연동 시 빈 목록 + alert */
export function useProgressIndividualParticipantList(
  programId: string | undefined,
  _program?: unknown
) {
  void _program
  const isTempMockProgram = isGeneralProgramTempMockProgramId(programId)
  const remoteEnabled = useProgramProgressRemoteEnabledForSurface(programId)

  useNotifyProgramApiUnavailableOnce(
    !remoteEnabled && !isTempMockProgram,
    'general-progress-individual-participants',
    '프로그램 진행 현황 · 개인 참여자'
  )

  const remoteQuery = useInfiniteQuery({
    queryKey: generalProgramProgressQueryKeys.participants(programId ?? ''),
    queryFn: ({ pageParam }) =>
      fetchGeneralProgramParticipantsPage(programId!, { page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })

  const participantList: ParticipatingIndividualParticipantRow[] = isTempMockProgram
    ? getTempMockShowcaseIndividualProgressParticipants(programId)
    : remoteEnabled
      ? (remoteQuery.data?.pages.flatMap(page => page.rows) ?? [])
      : []

  return {
    participantList,
    loading: isTempMockProgram
      ? false
      : remoteEnabled
        ? remoteQuery.isFetching && remoteQuery.data === undefined
        : false,
    isRemoteDataSource: remoteEnabled && !isTempMockProgram,
    hasNextPage: remoteQuery.hasNextPage ?? false,
    isFetchingNextPage: remoteQuery.isFetchingNextPage,
    fetchNextPage: remoteQuery.fetchNextPage,
  }
}
