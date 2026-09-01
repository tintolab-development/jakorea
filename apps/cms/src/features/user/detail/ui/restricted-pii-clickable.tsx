import type { ReactNode, MouseEvent } from 'react'
import {
  denyAdminActionEvent,
  type AdminActionKind,
} from '@/shared/lib/admin-role-policy'
import { useSessionAdminRoleCode } from '@/shared/lib/use-session-admin-role-code'

/** 파트너·뷰어가 주민번호·계좌 원문을 보려 할 때 클릭을 가로챈다. */
export function RestrictedPiiClickable({
  action,
  children,
}: {
  action: Extract<AdminActionKind, 'piiRrn' | 'piiAccount'>
  children: ReactNode
}) {
  const roleCode = useSessionAdminRoleCode()
  const onClick = (event: MouseEvent<HTMLSpanElement>) => {
    denyAdminActionEvent(event, { roleCode, action })
  }
  return (
    <span onClick={onClick} onKeyDown={undefined}>
      {children}
    </span>
  )
}
