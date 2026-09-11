import type {
  ListAdminApprovalRequestsParams,
  PageResponseAdminAccountListItemResponse,
} from '@/shared/api/generated/members/schemas'

export type { ListAdminApprovalRequestsParams }

/** Swagger `approveAdminApprovalRequest` / `rejectAdminApprovalRequest` body */
export type AdminAccountApprovalDecisionRequest = {
  reason?: string
  /** 승인 시 최종 적용 권한. MASTER · MIDDLE · VIEWER */
  roleCode?: string
  requestedRoleCode?: string
  scheduledAt?: string
}

export type AdminApprovalRequestsPageResponse = PageResponseAdminAccountListItemResponse
