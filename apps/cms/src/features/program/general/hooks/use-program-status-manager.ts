/**
 * 프로그램 상태 운영 훅
 */

import { useCallback, useState } from 'react'
import { useProgramStore } from '@/features/program/general/model/program-store'
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
  const [loading, setLoading] = useState(false)

  const changeStatus = useCallback(async (programId: string, status: ProgramLifecycleStatus) => {
    setLoading(true)
    try {
      await updateProgram(programId, { lifecycleStatus: status })
      await fetchProgramById(programId)
      } catch (error) {
      handleError(error, {
        defaultMessage: '상태 변경 중 오류가 발생했습니다',
        context: 'ProgramLifecycleStatusChange',
      })
    } finally {
      setLoading(false)
    }
  }, [fetchProgramById, updateProgram])

  const rollbackStatus = useCallback(async (
    programId: string,
    currentStatus?: ProgramLifecycleStatus | null
  ) => {
    const previousStatus = currentStatus ? getPreviousProgramLifecycleStatus(currentStatus) : null
    if (!previousStatus) return

    setLoading(true)
    try {
      await updateProgram(programId, { lifecycleStatus: previousStatus })
      await fetchProgramById(programId)
      } catch (error) {
      handleError(error, {
        defaultMessage: '상태 변경 중 오류가 발생했습니다',
        context: 'ProgramLifecycleStatusRollback',
      })
    } finally {
      setLoading(false)
    }
  }, [fetchProgramById, updateProgram])

  return { loading, changeStatus, rollbackStatus }
}
