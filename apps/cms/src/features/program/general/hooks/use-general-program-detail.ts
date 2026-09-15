import { queryOptions, useQuery } from '@tanstack/react-query'
import { fetchGeneralProgramRemoteById } from '@/features/program/general/api/admin-general-programs-service'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { useGeneralProgramsRemoteEnabled } from '@/features/program/general/hooks/use-general-programs-remote-enabled'
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
 * 일반 프로그램 상세 — API only (mock 폴백 없음).
 * gate OFF면 program=null.
 */
export function useGeneralProgramDetail(
  programId: string | undefined,
  options: UseGeneralProgramDetailOptions = {}
) {
  const { initialProgram = null, enabled = true } = options
  const { user } = useAuthStore()
  const remoteEnabled = useGeneralProgramsRemoteEnabled(Boolean(programId) && enabled)

  const remoteQuery = useQuery({
    ...generalProgramDetailQueryOptions(programId ?? ''),
    enabled: remoteEnabled,
  })

  const program = remoteEnabled
    ? (remoteQuery.data ?? (remoteQuery.isFetching ? initialProgram : null))
    : null
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
