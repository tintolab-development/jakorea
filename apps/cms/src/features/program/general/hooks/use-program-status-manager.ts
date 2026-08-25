/**
 * 프로그램 상태 운영 훅
 */

import { useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useProgramStore } from '@/features/program/general/model/program-store'
import {
  fetchGeneralProgramRemoteById,
  updateGeneralProgram,
} from '@/features/program/general/api/admin-general-programs-service'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { shouldUseGeneralProgramsRemoteApi } from '@/features/program/general/api/general-programs-remote-capabilities'
import { shouldUseCompanySchoolRemoteApi } from '@/features/program/1c-1s/api/capabilities'
import {
  getCompanySchoolProgram,
  updateCompanySchoolProgram,
} from '@/features/program/1c-1s/api/service'
import { companySchoolQueryKeys } from '@/features/program/1c-1s/api/query-keys'
import {
  useIsCompanySchoolProgramsSurface,
} from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import { getPreviousProgramLifecycleStatus } from '@/shared/lib/status-transition'
import { handleError } from '@/shared/utils/error-handler'
import type { ProgramLifecycleStatus } from '@/types/domain'

interface UseProgramStatusManagerResult {
  loading: boolean
  changeStatus: (programId: string, status: ProgramLifecycleStatus) => Promise<void>
  rollbackStatus: (programId: string, currentStatus?: ProgramLifecycleStatus | null) => Promise<void>
}

export function useProgramStatusManager(): UseProgramStatusManagerResult {
  const { updateProgram, fetchProgramById } = useProgramStore()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const isCompanySchoolSurface = useIsCompanySchoolProgramsSurface()

  const persistLifecycle = useCallback(
    async (programId: string, status: ProgramLifecycleStatus) => {
      if (isCompanySchoolSurface && shouldUseCompanySchoolRemoteApi()) {
        const current = await getCompanySchoolProgram(programId)
        await updateCompanySchoolProgram(programId, current, { lifecycleStatus: status })
        await queryClient.invalidateQueries({
          queryKey: companySchoolQueryKeys.detail(programId),
        })
        await queryClient.invalidateQueries({ queryKey: companySchoolQueryKeys.lists() })
        return
      }
      if (shouldUseGeneralProgramsRemoteApi()) {
        const current = await fetchGeneralProgramRemoteById(programId)
        await updateGeneralProgram(programId, { ...current, lifecycleStatus: status }, {
          lifecycleStatus: status,
        })
        await queryClient.invalidateQueries({
          queryKey: generalProgramQueryKeys.detail(programId),
        })
        await queryClient.invalidateQueries({ queryKey: generalProgramQueryKeys.lists() })
        await queryClient.invalidateQueries({
          queryKey: generalProgramQueryKeys.overviewStages(),
        })
        return
      }
      await updateProgram(programId, { lifecycleStatus: status })
      await fetchProgramById(programId)
    },
    [fetchProgramById, isCompanySchoolSurface, queryClient, updateProgram]
  )

  const changeStatus = useCallback(
    async (programId: string, status: ProgramLifecycleStatus) => {
      setLoading(true)
      try {
        await persistLifecycle(programId, status)
      } catch (error) {
        handleError(error, {
          defaultMessage: '상태 변경 중 오류가 발생했습니다',
          context: 'ProgramLifecycleStatusChange',
        })
      } finally {
        setLoading(false)
      }
    },
    [persistLifecycle]
  )

  const rollbackStatus = useCallback(
    async (programId: string, currentStatus?: ProgramLifecycleStatus | null) => {
      const previousStatus = currentStatus ? getPreviousProgramLifecycleStatus(currentStatus) : null
      if (!previousStatus) return

      setLoading(true)
      try {
        await persistLifecycle(programId, previousStatus)
      } catch (error) {
        handleError(error, {
          defaultMessage: '상태 변경 중 오류가 발생했습니다',
          context: 'ProgramLifecycleStatusRollback',
        })
      } finally {
        setLoading(false)
      }
    },
    [persistLifecycle]
  )

  return { loading, changeStatus, rollbackStatus }
}
