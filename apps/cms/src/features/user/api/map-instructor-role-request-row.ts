import type { InstructorRoleRequestListItemResponse } from '@/shared/api/generated/members/schemas'
import type {
  MemberPermissionApplicationRow,
  MemberPermissionApplicationStatus,
} from '@/types/member-permission-application'
import { registerMemberIdMapping } from '@/features/user/api/member-id-registry'

function mapRequestStatus(status?: string): MemberPermissionApplicationStatus {
  const upper = (status ?? '').trim().toUpperCase()
  if (upper === 'APPROVED' || upper === 'COMPLETED') return 'APPROVED'
  if (upper === 'REJECTED' || upper === 'REVOKED') return 'REJECTED'
  return 'PENDING'
}

export function mapInstructorRoleRequestToRow(
  item: InstructorRoleRequestListItemResponse
): MemberPermissionApplicationRow {
  const requestId = item.requestId
  const memberId = item.memberId
  const userId =
    memberId != null
      ? (() => {
          const synthetic = `member-${memberId}`
          registerMemberIdMapping(synthetic, memberId)
          return synthetic
        })()
      : `request-${requestId ?? 'unknown'}`

  const name = item.maskedName?.trim() || '-'
  const applicationTypeLabel = item.requestedActivityType?.trim() || '-'

  return {
    id: `ir-${requestId ?? memberId ?? crypto.randomUUID()}`,
    requestId,
    memberId,
    userId,
    name,
    phone: item.maskedPhone?.trim() || '',
    email: item.maskedEmail?.trim() || '',
    memberCategory: 'INSTRUCTOR',
    applicationTypeLabel,
    approvalStatus: mapRequestStatus(item.requestStatus),
    appliedAt: item.requestedAt ?? new Date().toISOString(),
  }
}
