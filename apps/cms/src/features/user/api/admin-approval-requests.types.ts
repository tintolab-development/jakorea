import type {
  ListAdminApprovalRequestsParams,
  PageResponseAdminAccountListItemResponse,
} from '@/shared/api/generated/members/schemas'

export type { ListAdminApprovalRequestsParams }

/** Swagger `approveAdminApprovalRequest` / `rejectAdminApprovalRequest` body */
export type AdminAccountApprovalDecisionRequest = {
  reason?: string
}

export type AdminApprovalRequestsPageResponse = PageResponseAdminAccountListItemResponse
