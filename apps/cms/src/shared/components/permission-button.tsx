/**
 * 권한별 버튼 컴포넌트
 * Phase 4.2.3: 권한별 UI 컴포넌트
 */

import { Button } from 'antd'
import type { ComponentProps } from 'react'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { hasAnyRole } from '@/shared/utils/permissions'
import type { UserRole } from '@/types/user'

export interface PermissionButtonProps extends ComponentProps<typeof Button> {
  /**
   * 허용된 권한 목록
   * 없으면 모든 권한 허용
   */
  allowedRoles?: UserRole[]
  /**
   * 권한이 없을 때 버튼을 숨길지 여부
   * false면 비활성화만 함
   */
  hideIfNoPermission?: boolean
}

/**
 * 권한별 버튼 컴포넌트
 * 권한이 없으면 숨기거나 비활성화
 */
export function PermissionButton({
  allowedRoles,
  hideIfNoPermission = true,
  disabled,
  ...props
}: PermissionButtonProps) {
  const { user } = useAuthStore()

  // 권한 확인
  const hasPermission = allowedRoles
    ? hasAnyRole(user, allowedRoles)
    : true // allowedRoles가 없으면 모든 권한 허용

  // 권한이 없고 숨김 옵션이 활성화된 경우
  if (!hasPermission && hideIfNoPermission) {
    return null
  }

  // 권한이 없으면 비활성화
  return <Button {...props} disabled={disabled || !hasPermission} />
}

