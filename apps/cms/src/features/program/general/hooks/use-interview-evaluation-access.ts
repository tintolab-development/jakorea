/**
 * 면접 평가 담당자 슬롯 입력 권한 — 마스터·해당 프로그램 PM은 A·B 모두, 그 외는 한 슬롯
 * Cache: 담당자 목록 query key 공유 (staleTime 30s)
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { resolveAdminRoleCodeFromUser } from '@/shared/lib/admin-role-policy'
import { fetchGeneralProgramManagers } from '@/features/program/general/api/admin-general-programs-service'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import {
  buildProgramManagersListQuery,
  serializeProgramManagersListQuery,
} from '@/features/program/general/api/managers-list-query'
import { useProgramsReadsRemoteEnabledForSurface } from '@/features/program/1c-1s/lib/use-company-school-surface-remote'

export type GeneralInterviewEvaluationAccess = {
  canFillBothSlots: boolean
  currentAdminId: number | null
}

const MANAGERS_LIST_QUERY = buildProgramManagersListQuery({})
const MANAGERS_FILTERS_KEY = serializeProgramManagersListQuery(MANAGERS_LIST_QUERY)

export function useGeneralInterviewEvaluationAccess(
  programId: string | undefined
): GeneralInterviewEvaluationAccess {
  const user = useAuthStore(state => state.user)
  const isMaster = resolveAdminRoleCodeFromUser(user) === 'MASTER'
  const currentAdminId = user?.adminAccountId ?? null
  const remoteEnabled = useProgramsReadsRemoteEnabledForSurface(programId)

  const managersQuery = useQuery({
    queryKey: generalProgramQueryKeys.managers(programId ?? '', MANAGERS_FILTERS_KEY),
    queryFn: () => fetchGeneralProgramManagers(programId!, MANAGERS_LIST_QUERY),
    enabled: remoteEnabled && Boolean(programId) && !isMaster && currentAdminId != null,
    staleTime: 30_000,
    retry: false,
  })

  const isProgramPm = useMemo(
    () =>
      currentAdminId != null &&
      (managersQuery.data ?? []).some(
        manager => manager.role === 'OWNER' && manager.adminId === currentAdminId
      ),
    [currentAdminId, managersQuery.data]
  )

  return { canFillBothSlots: isMaster || isProgramPm, currentAdminId }
}
