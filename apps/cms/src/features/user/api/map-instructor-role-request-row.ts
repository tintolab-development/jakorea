import { registerMemberIdMapping } from '@/features/user/api/member-id-registry'
import {
  mapInstructorRoleRequestStatusToApplicationStatus,
} from '@/features/user/api/lib/map-permission-approval-status'
import type { InstructorRoleRequestListItemResponse } from '@/shared/api/generated/members/schemas'
import type { MemberPermissionApplicationRow } from '@/types/member-permission-application'

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
    approvalStatus: mapInstructorRoleRequestStatusToApplicationStatus(item.requestStatus),
    appliedAt: item.requestedAt ?? new Date().toISOString(),
  }
}
