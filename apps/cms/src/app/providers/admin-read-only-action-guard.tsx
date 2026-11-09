import type { MouseEvent, ReactNode } from 'react'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  resolveProgramDetailActionKind,
  type ProgramDetailActionPermissions,
} from '@/features/program/shared/lib/program-detail-action-guard'
import {
  canAdminAction,
  isReadOnlyAdminRoleCode,
  resolveAdminRoleCodeFromUser,
  showAdminAccessDeniedAlert,
} from '@/shared/lib/admin-role-policy'

/**
 * 권한 설정 V1.2 — 조회 전용 역할(Program Viewer)은 CMS 어디서든 수정·승인·배정·발송·발급·다운로드·개인정보 열람을 할 수 없다.
 * 화면·버튼마다 분기하지 않고 앱 루트 한 곳에서 클릭을 가로챈다(모달 포털도 React 트리로 전파되어 함께 걸린다).
 * 판정 기준은 프로그램 상세 가드와 같다: `data-program-action` 속성 → 버튼 라벨(aria-label → 텍스트).
 * 버튼은 숨기지 않고 노출하며, 누르면 접근 불가 안내만 띄운다.
 */
export function AdminReadOnlyActionGuard({ children }: { children: ReactNode }) {
  const roleCode = useAuthStore(state => resolveAdminRoleCodeFromUser(state.user))
  const readOnly = isReadOnlyAdminRoleCode(roleCode)

  if (!readOnly) return <>{children}</>

  const permissions: ProgramDetailActionPermissions = {
    write: false,
    download: canAdminAction({ roleCode, action: 'download' }),
    pii: false,
  }

  const handleClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    const kind = resolveProgramDetailActionKind(event.target)
    if (kind == null || permissions[kind]) return
    event.preventDefault()
    event.stopPropagation()
    event.nativeEvent.stopImmediatePropagation?.()
    showAdminAccessDeniedAlert()
  }

  return (
    <div style={{ display: 'contents' }} onClickCapture={handleClickCapture}>
      {children}
    </div>
  )
}
