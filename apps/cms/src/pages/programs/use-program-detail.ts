/**
 * 프로그램 상세 페이지 데이터 훅
 * - 프로그램 fetch + cleanup
 * - 후원사 이름 resolve
 * - 쓰기 권한 판별
 */

import { useEffect } from 'react'
import { useProgramStore } from '@/features/program/general/model/program-store'
import { useSponsorNameById } from '@/features/sponsor/hooks/use-sponsor-name-by-id'
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
  const canWrite = canPerformWriteAction(user)
  const sponsorName = useSponsorNameById(program?.sponsorId, Boolean(program?.sponsorId))

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
