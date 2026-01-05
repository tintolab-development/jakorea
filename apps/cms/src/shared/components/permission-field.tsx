/**
 * 권한별 폼 필드 컴포넌트
 * Phase 4.2.3: 권한별 UI 컴포넌트
 */

import { Form } from 'antd'
import type { ComponentProps } from 'react'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { hasAnyRole } from '@/shared/utils/permissions'
import type { UserRole } from '@/types/user'
import { useMemo } from 'react'

export interface PermissionFieldProps extends ComponentProps<typeof Form.Item> {
  /**
   * 허용된 권한 목록
   * 없으면 모든 권한 허용
   */
  allowedRoles?: UserRole[]
  /**
   * 권한이 없을 때 필드를 숨길지 여부
   * false면 읽기 전용으로 표시
   */
  hideIfNoPermission?: boolean
  /**
   * 권한이 없을 때 읽기 전용으로 표시할지 여부
   */
  readOnlyIfNoPermission?: boolean
  children?: React.ReactNode
}

/**
 * 권한별 폼 필드 컴포넌트
 * 권한이 없으면 숨기거나 읽기 전용으로 표시
 */
export function PermissionField({
  allowedRoles,
  hideIfNoPermission = true,
  readOnlyIfNoPermission = true,
  children,
  ...props
}: PermissionFieldProps) {
  const { user } = useAuthStore()

  // 권한 확인
  const hasPermission = useMemo(() => {
    return allowedRoles ? hasAnyRole(user, allowedRoles) : true
  }, [allowedRoles, user])

  // 권한이 없고 숨김 옵션이 활성화된 경우
  if (!hasPermission && hideIfNoPermission) {
    return null
  }

  // 권한이 없고 읽기 전용 옵션이 활성화된 경우
  const isReadOnly = !hasPermission && readOnlyIfNoPermission

  return (
    <Form.Item {...props} className={isReadOnly ? 'permission-readonly-field' : undefined}>
      {isReadOnly ? (
        <div style={{ padding: '4px 11px', border: '1px solid #d9d9d9', borderRadius: '6px', backgroundColor: '#f5f5f5' }}>
          {children}
        </div>
      ) : (
        children
      )}
    </Form.Item>
  )
}

