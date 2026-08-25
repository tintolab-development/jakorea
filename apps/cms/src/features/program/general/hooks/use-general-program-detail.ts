import { useCallback, useMemo } from 'react'
import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchGeneralProgramRemoteById,
  getGeneralProgramMockById,
} from '@/features/program/general/api/admin-general-programs-service'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { useGeneralProgramsRemoteEnabled } from '@/features/program/general/hooks/use-general-programs-remote-enabled'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useSponsorNameById } from '@/features/sponsor/hooks/use-sponsor-name-by-id'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import type { Program } from '@/types/domain'

export interface UseGeneralProgramDetailOptions {
  /** 목록 행 클릭 시 전달된 프로그램 — mock 세션에서 즉시 표시용 */
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

export function usePrefetchGeneralProgramDetail() {
  const queryClient = useQueryClient()
  const remoteEnabled = useGeneralProgramsRemoteEnabled()

  return useCallback(
    (programId: string) => {
      if (!remoteEnabled || !programId) return
      void queryClient.prefetchQuery(generalProgramDetailQueryOptions(programId))
    },
    [queryClient, remoteEnabled]
  )
}

/**
 * 일반 프로그램 상세 데이터
 * - mock 로그인(우회·mock JWT): mock 즉시 반환, 전역 program-store fetch 없음
 * - API 로그인 + programs 모듈: GET /api/admin/programs/{id}
 */
export function useGeneralProgramDetail(
  programId: string | undefined,
  options: UseGeneralProgramDetailOptions = {}
) {
  const { initialProgram = null, enabled = true } = options
  const { user } = useAuthStore()
  const remoteEnabled = useGeneralProgramsRemoteEnabled(Boolean(programId) && enabled)

  const mockProgram = useMemo(() => {
    if (remoteEnabled || !programId) return null
    return getGeneralProgramMockById(programId) ?? initialProgram
  }, [remoteEnabled, programId, initialProgram])

  const remoteQuery = useQuery({
    ...generalProgramDetailQueryOptions(programId ?? ''),
    enabled: remoteEnabled,
  })

  const program = remoteEnabled ? (remoteQuery.data ?? null) : mockProgram
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
