import type { KeyboardEvent, MouseEvent, PointerEvent, ReactNode } from 'react'
import { useAdminMeProfile } from '@/features/auth/api/use-admin-me-profile'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { ADMIN_ACCESS_DENIED_ALERT } from '@/shared/lib/admin-access-denied'
import {
  isHomepageDragHandleTarget,
  resolveHomepageActionKind,
  resolveHomepageActionPermissions,
  type HomepageActionPermissions,
} from '@/shared/lib/homepage-action-guard'
import { cmsAlertModal } from '@/shared/ui'
import './homepage-action-guard.css'

export function useHomepageActionPermissions(): HomepageActionPermissions {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const adminId = useAuthStore(state => state.user?.id)
  const meQuery = useAdminMeProfile(adminId, isAuthenticated)
  return resolveHomepageActionPermissions({
    resolved: meQuery.isSuccess,
    roleCode: meQuery.data?.roleCode,
    permissions: meQuery.data?.permissions,
  })
}

/**
 * 권한 설정 V1.2 — 콘텐츠 영역의 등록·수정·삭제·신청 확인·설정 버튼과 신청자 첨부 다운로드는 노출하고,
 * 권한이 없으면 클릭을 막고 '접근 권한이 없습니다.' 안내를 띄운다.
 * React 합성 이벤트는 포털(모달)도 컴포넌트 트리를 따라 전파되므로 레이아웃 한 곳에서 가로챈다.
 */
export function HomepageActionGuard({ children }: { children: ReactNode }) {
  const permissions = useHomepageActionPermissions()

  const handleClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    const kind = resolveHomepageActionKind(event.target)
    if (kind == null || permissions[kind]) return
    event.preventDefault()
    event.stopPropagation()
    event.nativeEvent.stopImmediatePropagation?.()
    cmsAlertModal.show(ADMIN_ACCESS_DENIED_ALERT)
  }

  // 드래그 순서 변경은 pointerdown/keydown에서 시작하므로 조용히 막고, 이어지는 click에서 안내한다.
  const blockDragStart = (event: PointerEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>) => {
    if (permissions.write || !isHomepageDragHandleTarget(event.target)) return
    event.stopPropagation()
  }

  const handleKeyDownCapture = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== ' ' && event.key !== 'Enter') return
    blockDragStart(event)
  }

  return (
    <div
      className="homepage-action-guard"
      onClickCapture={handleClickCapture}
      onPointerDownCapture={blockDragStart}
      onKeyDownCapture={handleKeyDownCapture}
    >
      {children}
    </div>
  )
}
