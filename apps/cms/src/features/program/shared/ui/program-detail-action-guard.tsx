import type { MouseEvent, ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { shouldUseProgramsHttpRemoteApi } from '@/features/program/general/api/general-programs-remote-capabilities'
import {
  resolveProgramDetailActionKind,
  resolveProgramDetailActionPermissions,
  type ProgramDetailActionPermissions,
} from '@/features/program/shared/lib/program-detail-action-guard'
import {
  fetchProgramMyAssignment,
  programMyAssignmentQueryKey,
} from '@/features/program/shared/lib/program-my-assignment'
import { AdminActionGuardDelegationContext } from '@/shared/lib/admin-action-guard-delegation'
import {
  resolveAdminRoleCodeFromUser,
  showAdminAccessDeniedAlert,
} from '@/shared/lib/admin-role-policy'
import './program-detail-action-guard.css'

/** 상세 진입 확인(`checkProgramDetailAccess`)과 같은 캐시를 쓴다. */
const ASSIGNMENT_STALE_TIME_MS = 30_000

/**
 * 상세 진입 판정. `unchecked`는 확인이 필요 없는 경우(Master·원격 미사용·programId 없음).
 * 조회 중(`pending`)과 미배정 403(`denied`)일 때는 상세를 그리지 않는다.
 */
export type ProgramDetailAccessState = 'unchecked' | 'pending' | 'allowed' | 'denied'

export function useProgramDetailActionPermissions(
  programId: string | number | null | undefined
): ProgramDetailActionPermissions {
  return useProgramDetailAccess(programId).permissions
}

export function useProgramDetailAccess(programId: string | number | null | undefined): {
  permissions: ProgramDetailActionPermissions
  access: ProgramDetailAccessState
} {
  const user = useAuthStore(state => state.user)
  const roleCode = resolveAdminRoleCodeFromUser(user)
  const adminAccountId = user?.adminAccountId ?? null
  const id = programId == null ? '' : String(programId).trim()
  const enabled =
    id.length > 0 &&
    adminAccountId != null &&
    roleCode !== 'MASTER' &&
    shouldUseProgramsHttpRemoteApi()
  const query = useQuery({
    queryKey: programMyAssignmentQueryKey(id || '_', adminAccountId),
    queryFn: () => fetchProgramMyAssignment(id),
    enabled,
    retry: false,
    staleTime: ASSIGNMENT_STALE_TIME_MS,
  })
  const permissions = resolveProgramDetailActionPermissions({
    roleCode,
    assignment: enabled && query.isSuccess ? query.data : null,
  })
  let access: ProgramDetailAccessState = 'unchecked'
  if (enabled) {
    if (query.isSuccess) {
      access =
        query.data?.masterBypass === true || query.data?.assigned === true ? 'allowed' : 'denied'
    } else if (query.isError) {
      // 미배정은 403. 그 밖의 실패(네트워크 등)는 상세 화면의 기존 오류 처리에 맡긴다.
      access =
        isAxiosError(query.error) && query.error.response?.status === 403 ? 'denied' : 'allowed'
    } else {
      access = 'pending'
    }
  }
  return { permissions, access }
}

export interface ProgramDetailActionGuardProps {
  /** 배정 개념이 없는 상세(Gemini 등)는 비워 두면 전역 역할로 판정한다. */
  programId?: string | number | null
  children: ReactNode
}

/**
 * 권한 설정 V1.2 — 프로그램 상세 안의 수정·승인·배정·발송·다운로드·개인정보 열람 버튼은 노출한 채로 두고,
 * 권한이 없으면 클릭을 막고 '접근 권한이 없습니다.' 안내를 띄운다.
 * React 합성 이벤트는 포털(모달)도 컴포넌트 트리를 따라 전파되므로 루트 한 곳에서 가로챈다.
 */
export function ProgramDetailActionGuard({ programId, children }: ProgramDetailActionGuardProps) {
  const { permissions, access } = useProgramDetailAccess(programId)

  const handleClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    const kind = resolveProgramDetailActionKind(event.target)
    if (kind == null || permissions[kind]) return
    event.preventDefault()
    event.stopPropagation()
    event.nativeEvent.stopImmediatePropagation?.()
    showAdminAccessDeniedAlert()
  }

  // 권한 설정 V1.2 원칙 3·7: 담당 배정이 확인되기 전에는 상세를 그리지 않는다.
  // 목록 행 클릭처럼 URL에 programId를 바로 넣는 진입에서 상세가 열렸다가 403으로 닫히는 깜빡임을 막는다.
  // 미배정 안내 팝업과 URL 정리는 레이아웃의 ProgramDetailAccessGuard가 맡는다.
  if (access === 'pending' || access === 'denied') return null

  return (
    <div className="program-detail-action-guard" onClickCapture={handleClickCapture}>
      {/* 툴바·상세 헤더의 전역 일괄 가드는 끄고, 이 가드의 버튼별 판정만 쓴다(조회 버튼은 통과). */}
      <AdminActionGuardDelegationContext.Provider value>
        {children}
      </AdminActionGuardDelegationContext.Provider>
    </div>
  )
}
