import type { ReactNode } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { isProgramDetailAccessCheckRequired } from '@/features/program/shared/lib/program-detail-access'
import { useMyProgramPrivacyRole } from '@/features/user/detail/lib/use-my-program-privacy-role'
import { StatusDropdownReadOnlyContext } from '@/shared/components/status-dropdown-read-only-context'

/** 프로그램 상세 모달을 여는 URL 파라미터(일반·1사1교·교육 받은 교사·UJAT는 programId, Gemini 모집 공고는 recruitmentId). */
const PROGRAM_DETAIL_PARAM_KEYS = ['programId', 'recruitmentId'] as const

/** 프로그램 안에서 무언가를 바꿀 수 있는 capability. 하나도 없으면 조회 전용(Program Viewer)이다. */
const PROGRAM_WRITE_CAPABILITIES = [
  'PROGRAM_EDIT',
  'APPLICATION_REVIEW',
  'ASSIGNMENT_MANAGE',
  'SETTLEMENT_MANAGE',
  'PERFORMANCE_MANAGE',
  'CERTIFICATE_MANAGE',
  'NOTIFICATION_SEND',
  'PROGRAM_ADMIN_MANAGE',
] as const

/**
 * 권한 설정 V1.2: Program Viewer(프로그램 상세)는 기본 화면 조회만 가능하다.
 * 프로그램 상세가 열려 있고 내 프로그램 역할에 변경 권한이 없으면, 상세 안의 상태·역할 변경 드롭다운을
 * 모두 태그만 보이게 한다(열리지도 클릭되지도 않음). 역할 확인 전에도 잠가 둔다.
 * Master·원격 미사용 환경은 확인 없이 그대로 둔다.
 */
export function ProgramDetailReadOnlyProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const paramKey = PROGRAM_DETAIL_PARAM_KEYS.find(key => searchParams.get(key)?.trim()) ?? null
  const programId =
    location.pathname.startsWith('/programs') && paramKey
      ? (searchParams.get(paramKey)?.trim() ?? '')
      : ''
  const checkRequired = programId !== '' && isProgramDetailAccessCheckRequired()
  const { assignment, pending } = useMyProgramPrivacyRole(checkRequired ? programId : undefined)

  let readOnly = false
  if (checkRequired) {
    const capabilities = new Set(
      (assignment?.capabilities ?? []).map(item => item.trim().toUpperCase())
    )
    readOnly =
      pending || !PROGRAM_WRITE_CAPABILITIES.some(capability => capabilities.has(capability))
  }

  return (
    <StatusDropdownReadOnlyContext.Provider value={readOnly}>
      {children}
    </StatusDropdownReadOnlyContext.Provider>
  )
}
