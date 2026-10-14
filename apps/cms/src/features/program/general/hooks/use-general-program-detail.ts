import { queryOptions, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import {
  fetchGeneralProgramCoreRemoteById,
  fetchGeneralProgramSponsorAssignmentsRemote,
} from '@/features/program/general/api/admin-general-programs-service'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { useGeneralProgramsRemoteEnabled } from '@/features/program/general/hooks/use-general-programs-remote-enabled'
import { resolveGeneralProgramForDetail } from '@/features/program/general/lib/detail-meta'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useSponsorNameById } from '@/features/sponsor/hooks/use-sponsor-name-by-id'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { mergeProgramSponsorAssignments } from '@/features/program/shared/lib/merge-program-sponsor-assignments'
import type { Program } from '@/types/domain'

export interface UseGeneralProgramDetailOptions {
  /** 목록 행에서 전달된 스냅샷 — remote 로딩 중 placeholder */
  initialProgram?: Program | null
  enabled?: boolean
}

export function generalProgramDetailQueryOptions(programId: string) {
  return queryOptions({
    queryKey: generalProgramQueryKeys.detail(programId),
    queryFn: () => fetchGeneralProgramCoreRemoteById(programId),
    staleTime: 30_000,
    retry: false,
  })
}

/**
 * 일반 프로그램 상세.
 * - remote ON + 숫자 API id: GET /programs/{id}
 * - remote OFF: 등록 임시저장(`general-local-*`)만 resolveGeneralProgramForDetail
 */
export function useGeneralProgramDetail(
  programId: string | undefined,
  options: UseGeneralProgramDetailOptions = {}
) {
  const { initialProgram = null, enabled = true } = options
  const { user } = useAuthStore()
  const remoteEnabled = useGeneralProgramsRemoteEnabled(
    Boolean(programId) && enabled,
    programId
  )

  const remoteQuery = useQuery({
    ...generalProgramDetailQueryOptions(programId ?? ''),
    enabled: remoteEnabled,
  })

  const sponsorAssignmentsQuery = useQuery({
    queryKey: generalProgramQueryKeys.sponsorAssignments(programId ?? ''),
    queryFn: () => fetchGeneralProgramSponsorAssignmentsRemote(programId!),
    enabled: remoteEnabled && Boolean(programId),
    staleTime: 30_000,
    retry: false,
  })

  const resolvedMock = useMemo(() => {
    if (remoteEnabled || !programId || !enabled) return null
    return resolveGeneralProgramForDetail(programId) ?? null
  }, [remoteEnabled, programId, enabled])

  const remoteProgram = useMemo(() => {
    if (remoteQuery.data == null) {
      return remoteQuery.isFetching ? initialProgram : null
    }
    // 재검증 중인 오래된 sponsor 캐시가 저장 직후의 핵심 상세를 덮지 않게 한다.
    if (
      sponsorAssignmentsQuery.data == null ||
      sponsorAssignmentsQuery.isFetching ||
      sponsorAssignmentsQuery.isError
    ) {
      return remoteQuery.data
    }
    return mergeProgramSponsorAssignments(remoteQuery.data, sponsorAssignmentsQuery.data)
  }, [
    initialProgram,
    remoteQuery.data,
    remoteQuery.isFetching,
    sponsorAssignmentsQuery.data,
    sponsorAssignmentsQuery.isError,
    sponsorAssignmentsQuery.isFetching,
  ])
  const program = remoteEnabled ? remoteProgram : resolvedMock
  const loading = remoteEnabled ? remoteQuery.isFetching : false
  const canWrite = canPerformWriteAction(user)
  const sponsorName = useSponsorNameById(program?.sponsorId, Boolean(program?.sponsorId))

  return {
    program,
    loading,
    error: remoteEnabled ? remoteQuery.error : null,
    canWrite,
    sponsorName,
    isRemoteDataSource: remoteEnabled,
    refetch: remoteQuery.refetch,
  }
}
