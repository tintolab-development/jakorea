/**
 * 프로그램 상세 페이지 데이터 훅
 * - 프로그램 fetch + cleanup
 * - 후원사 이름 resolve
 * - 쓰기 권한 판별
 */

import { useEffect, useMemo } from 'react'
import { useProgramStore } from '@/features/program/general/model/program-store'
import { useSponsorService } from '@/features/sponsor/hooks/use-sponsor-service'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'

export function useProgramDetail(id: string | undefined) {
  const { user } = useAuthStore()
  const {
    selectedProgram: program,
    loading,
    fetchProgramById,
    setSelectedProgram,
    updateProgram,
  } = useProgramStore()
  const { getByIdSync: getSponsorByIdSync } = useSponsorService()

  const canWrite = canPerformWriteAction(user)

  const sponsorName = useMemo(() => {
    return program?.sponsorId ? getSponsorByIdSync(program.sponsorId)?.name : undefined
  }, [program?.sponsorId, getSponsorByIdSync])

  useEffect(() => {
    if (id) {
      setSelectedProgram(null)
      fetchProgramById(id)
    }
    return () => setSelectedProgram(null)
  }, [id, fetchProgramById, setSelectedProgram])

  return {
    program,
    loading,
    canWrite,
    sponsorName,
    updateProgram,
    setSelectedProgram,
  }
}
