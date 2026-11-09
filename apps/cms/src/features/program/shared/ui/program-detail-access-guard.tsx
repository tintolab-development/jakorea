import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useLocation, useSearchParams } from 'react-router-dom'
import {
  checkProgramDetailAccess,
  isProgramDetailAccessCheckRequired,
} from '@/features/program/shared/lib/program-detail-access'

/** 프로그램 상세 모달을 여는 URL 파라미터(일반·1사1교·교육 받은 교사·UJAT는 programId, Gemini 모집 공고는 recruitmentId). */
const PROGRAM_DETAIL_PARAM_KEYS = ['programId', 'recruitmentId'] as const

/**
 * 권한 설정 V1.2 원칙 3: Master 외 관리자는 담당 프로그램만 상세 진입.
 * 목록 클릭·URL 직접 진입 모두 상세 파라미터로 모달이 열리므로, 여기서 한 번 확인해 미배정이면 파라미터를 지워 모달을 닫는다.
 * 접근 불가 팝업은 …/my-assignment 403의 공통 처리가 띄운다. 프로그램 유형별 목록 코드는 건드리지 않는다.
 */
export function ProgramDetailAccessGuard() {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const onProgramPath = location.pathname.startsWith('/programs')
  const paramKey = PROGRAM_DETAIL_PARAM_KEYS.find(key => searchParams.get(key)?.trim()) ?? null
  const programId = paramKey ? (searchParams.get(paramKey)?.trim() ?? '') : ''

  useEffect(() => {
    if (!onProgramPath || !paramKey || !programId || !isProgramDetailAccessCheckRequired()) return
    let cancelled = false
    void checkProgramDetailAccess(programId, queryClient).then(allowed => {
      if (cancelled || allowed) return
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          next.delete(paramKey)
          return next
        },
        { replace: true }
      )
    })
    return () => {
      cancelled = true
    }
  }, [onProgramPath, paramKey, programId, queryClient, setSearchParams])

  return null
}
