import type { PageResponseAdminAccountListItemResponse } from '@/shared/api/generated/members/schemas'

/** Swagger `listAdminApprovalRequests` — `GET /api/admin/admin-approval-requests` */
export type ListAdminApprovalRequestsParams = {
  keyword?: string
  roleCode?: string
  page?: number
  size?: number
}

/** Swagger `approveAdminApprovalRequest` / `rejectAdminApprovalRequest` body */
export type AdminAccountApprovalDecisionRequest = {
  reason?: string
}

export type AdminApprovalRequestsPageResponse = PageResponseAdminAccountListItemResponse
