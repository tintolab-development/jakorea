/**
 * 프로그램 상세 페이지 데이터 훅
 * - 프로그램 fetch + cleanup
 * - 후원사 이름 resolve
 * - 쓰기 권한 판별
 * - id 요청이 끝나기 전에는 loading으로 취급 (마운트~effect 전 empty 플래시 방지)
 */

import { useEffect, useState } from 'react'
import { useProgramStore } from '@/features/program/general/model/program-store'
import { useSponsorNameById } from '@/features/sponsor/hooks/use-sponsor-name-by-id'
import {
  isLookupableSponsorId,
  resolveAssignedSponsorName,
} from '@/features/program/shared/lib/merge-program-sponsor-assignments'
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
  // id 없이 마운트된 경우(remote 부모가 상세를 담당) store에 남은 이전 프로그램으로 조회하지 않는다.
  // 배정 응답 이름이 있으면 후원사 전체 목록을 받지 않는다.
  const assignedSponsorName = resolveAssignedSponsorName(program)
  const lookedUpSponsorName = useSponsorNameById(
    program?.sponsorId,
    Boolean(id) && !assignedSponsorName && isLookupableSponsorId(program?.sponsorId)
  )
  const sponsorName = assignedSponsorName ?? lookedUpSponsorName
  /** fetch 완료된 id — 성공/실패 모두. 요청 중에는 id와 불일치 → 스피너 */
  const [resolvedId, setResolvedId] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setResolvedId(null)
      return
    }

    let cancelled = false
    setResolvedId(null)
    setSelectedProgram(null)
    void fetchProgramById(id).finally(() => {
      if (!cancelled) setResolvedId(id)
    })

    return () => {
      cancelled = true
      setSelectedProgram(null)
    }
  }, [id, fetchProgramById, setSelectedProgram])

  const awaitingDetail = Boolean(id) && resolvedId !== id

  return {
    program,
    loading: loading || awaitingDetail,
    canWrite,
    sponsorName,
    updateProgram,
    setSelectedProgram,
  }
}
