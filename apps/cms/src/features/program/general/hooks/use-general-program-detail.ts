import { queryOptions, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { fetchGeneralProgramRemoteById } from '@/features/program/general/api/admin-general-programs-service'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { useGeneralProgramsRemoteEnabled } from '@/features/program/general/hooks/use-general-programs-remote-enabled'
import { resolveGeneralProgramForDetail } from '@/features/program/general/lib/detail-meta'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useSponsorNameById } from '@/features/sponsor/hooks/use-sponsor-name-by-id'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import type { Program } from '@/types/domain'

export interface UseGeneralProgramDetailOptions {
  /** 목록 행에서 전달된 스냅샷 — remote 로딩 중 placeholder */
  initialProgram?: Program | null
  enabled?: boolean
}

export function generalProgramDetailQueryOptions(programId: string) {
  return queryOptions({
    queryKey: generalProgramQueryKeys.detail(programId),
    queryFn: () => fetchGeneralProgramRemoteById(programId),
    staleTime: 30_000,
    retry: false,
  })
}

/**
 * 일반 프로그램 상세.
 * - remote ON + 숫자 API id: GET /programs/{id}
 * - FE 시드(`general-prog-*`) 또는 remote OFF: resolveGeneralProgramForDetail mock
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

  const resolvedMock = useMemo(() => {
    if (remoteEnabled || !programId || !enabled) return null
    return resolveGeneralProgramForDetail(programId) ?? null
  }, [remoteEnabled, programId, enabled])

  const program = remoteEnabled
    ? (remoteQuery.data ?? (remoteQuery.isFetching ? initialProgram : null))
    : resolvedMock
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
