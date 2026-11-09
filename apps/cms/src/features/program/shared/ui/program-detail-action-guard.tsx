import type { MouseEvent, ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
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

export function useProgramDetailActionPermissions(
  programId: string | number | null | undefined
): ProgramDetailActionPermissions {
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
  return resolveProgramDetailActionPermissions({
    roleCode,
    assignment: enabled && query.isSuccess ? query.data : null,
  })
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
  const permissions = useProgramDetailActionPermissions(programId)

  const handleClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    const kind = resolveProgramDetailActionKind(event.target)
    if (kind == null || permissions[kind]) return
    event.preventDefault()
    event.stopPropagation()
    event.nativeEvent.stopImmediatePropagation?.()
    showAdminAccessDeniedAlert()
  }

  return (
    <div className="program-detail-action-guard" onClickCapture={handleClickCapture}>
      {/* 툴바·상세 헤더의 전역 일괄 가드는 끄고, 이 가드의 버튼별 판정만 쓴다(조회 버튼은 통과). */}
      <AdminActionGuardDelegationContext.Provider value>
        {children}
      </AdminActionGuardDelegationContext.Provider>
    </div>
  )
}
