/**
 * 권한별 정보 표시 컴포넌트
 * Phase 4.2.3: 권한별 UI 컴포넌트
 */

import { useAuth } from '@/shared/lib/auth/auth-context'
import { hasAnyRole } from '@/shared/utils/permissions'
import type { UserRole } from '@/types/user'
import { useMemo } from 'react'

export interface PermissionInfoProps {
  /**
   * 허용된 권한 목록
   * 없으면 모든 권한 허용
   */
  allowedRoles?: UserRole[]
  /**
   * 권한이 없을 때 정보를 숨길지 여부
   * false면 마스킹 처리
   */
  hideIfNoPermission?: boolean
  /**
   * 권한이 없을 때 마스킹 텍스트
   */
  maskText?: string
  /**
   * 표시할 정보
   */
  children: React.ReactNode
}

/**
 * 권한별 정보 표시 컴포넌트
 * 권한이 없으면 숨기거나 마스킹 처리
 */
export function PermissionInfo({
  allowedRoles,
  hideIfNoPermission = true,
  maskText = '***',
  children,
}: PermissionInfoProps) {
  const { user } = useAuth()

  // 권한 확인
  const hasPermission = useMemo(() => {
    return allowedRoles ? hasAnyRole(user, allowedRoles) : true
  }, [allowedRoles, user])

  // 권한이 없고 숨김 옵션이 활성화된 경우
  if (!hasPermission && hideIfNoPermission) {
    return null
  }

  // 권한이 없으면 마스킹 처리
  if (!hasPermission) {
    return <span style={{ color: 'rgba(0, 0, 0, 0.25)' }}>{maskText}</span>
  }

  return <>{children}</>
}



