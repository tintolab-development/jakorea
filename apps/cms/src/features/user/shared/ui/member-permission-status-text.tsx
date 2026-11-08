import type { MemberPermissionApplicationStatus } from '@/types/member-permission-application'
import { StatusBadge } from '@/shared/components/status-badge'
import { getMemberPermissionStatusPresentation } from '../lib/member-permission-status-presentation'

export function MemberPermissionStatusText({ status, revoked = false, className }: {
  status: MemberPermissionApplicationStatus
  revoked?: boolean
  className?: string
}) {
  return <StatusBadge domain="custom" variant="text" {...getMemberPermissionStatusPresentation(status, { revoked })} className={className} />
}
