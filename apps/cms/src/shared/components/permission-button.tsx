/**
 * 권한별 버튼 컴포넌트
 * Phase 4.2.3: 권한별 UI 컴포넌트
 * Phase 0.5.2: GENERAL 관리자 쓰기 작업 제한 추가
 */

import { Button } from 'antd'
import type { ComponentProps } from 'react'
import { useAuth } from '@/shared/lib/auth/auth-context'
import { hasAnyRole, canPerformWriteAction, hasAdminLevelOrAbove } from '@/shared/utils/permissions'
import type { UserRole, AdminLevel } from '@/types/user'

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
  /**
   * 쓰기 작업인지 여부 (GENERAL 관리자 제한)
   * Phase 0.5.2: GENERAL은 모든 쓰기 작업(create/update/delete) 금지
   */
  isWriteAction?: boolean
  /**
   * 최소 관리자 레벨 요구사항
   * Phase 0.5.2: 관리자 레벨별 접근 제어
   */
  minAdminLevel?: AdminLevel
}

/**
 * 권한별 버튼 컴포넌트
 * 권한이 없으면 숨기거나 비활성화
 * Phase 0.5.2: GENERAL 관리자 쓰기 작업 제한 적용
 */
export function PermissionButton({
  allowedRoles,
  hideIfNoPermission = true,
  isWriteAction = false,
  minAdminLevel,
  disabled,
  ...props
}: PermissionButtonProps) {
  const { user } = useAuth()

  // 역할 체크
  const hasRolePermission = allowedRoles ? hasAnyRole(user, allowedRoles) : true // allowedRoles가 없으면 모든 권한 허용

  // 쓰기 작업인 경우 GENERAL 제한
  // Phase 0.5.2: GENERAL 관리자는 모든 쓰기 작업 금지
  const canWrite = isWriteAction ? canPerformWriteAction(user) : true

  // 관리자 레벨 체크
  const hasAdminLevelPermission = minAdminLevel ? hasAdminLevelOrAbove(user, minAdminLevel) : true

  const hasPermission = hasRolePermission && canWrite && hasAdminLevelPermission

  // 권한이 없고 숨김 옵션이 활성화된 경우
  if (!hasPermission && hideIfNoPermission) {
    return null
  }

  // 권한이 없으면 비활성화
  return <Button {...props} disabled={disabled || !hasPermission} />
}
