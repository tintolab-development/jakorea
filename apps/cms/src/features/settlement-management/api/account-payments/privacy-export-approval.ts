import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type {
  PrivacyExportApprovalDecisionRequest,
  PrivacyExportApprovalRequestCreate,
  PrivacyExportApprovalResponse,
} from '@/shared/api/generated/settlement/schemas'

export const RAW_SETTLEMENT_EXPORT_DOMAIN = {
  'bulk-transfer': 'SETTLEMENT_BULK_TRANSFER',
  'tax-report': 'SETTLEMENT_TAX_REPORT',
} as const

export async function createPrivacyExportApprovalRemote(
  body: PrivacyExportApprovalRequestCreate
): Promise<PrivacyExportApprovalResponse> {
  return unwrapApiBody(
    await customInstance<PrivacyExportApprovalResponse>({
      url: '/api/admin/privacy/exports/approvals',
      method: 'POST',
      data: body,
    })
  )
}

export async function fetchPrivacyExportApprovalRemote(
  approvalId: number
): Promise<PrivacyExportApprovalResponse> {
  return unwrapApiBody(
    await customInstance<PrivacyExportApprovalResponse>({
      url: `/api/admin/privacy/exports/approvals/${approvalId}`,
      method: 'GET',
    })
  )
}

export async function approvePrivacyExportApprovalRemote(
  approvalId: number,
  body: PrivacyExportApprovalDecisionRequest
): Promise<PrivacyExportApprovalResponse> {
  return unwrapApiBody(
    await customInstance<PrivacyExportApprovalResponse>({
      url: `/api/admin/privacy/exports/approvals/${approvalId}/approve`,
      method: 'POST',
      data: body,
    })
  )
}

/** 원본 발급은 요청자 본인, 다른 관리자가 승인한 APPROVED reference만 허용한다. */
export function assertOwnApprovedRawExport(
  approval: PrivacyExportApprovalResponse,
  sessionAdminAccountId: number,
  exportDomain: string
): string {
  if (approval.requesterAdminId !== sessionAdminAccountId) {
    throw new Error('본인이 요청한 승인만 원본 발급에 사용할 수 있습니다.')
  }
  if (
    approval.approverAdminId == null ||
    approval.approverAdminId === approval.requesterAdminId ||
    approval.approverAdminId === sessionAdminAccountId
  ) {
    throw new Error('다른 마스터의 승인이 필요합니다.')
  }
  if (approval.status !== 'APPROVED') {
    throw new Error('마스터 승인이 완료되지 않았습니다.')
  }
  if (approval.exportDomain !== exportDomain) {
    throw new Error('요청한 양식의 승인만 사용할 수 있습니다.')
  }
  const reference = approval.approvalReference?.trim()
  if (!reference) throw new Error('승인 reference가 없습니다.')
  return reference
}

/** 요청자 본인은 승인할 수 없다. */
export function assertCanApproveRawExport(
  approval: PrivacyExportApprovalResponse,
  sessionAdminAccountId: number
): void {
  if (approval.requesterAdminId == null) throw new Error('요청자 정보가 없습니다.')
  if (approval.requesterAdminId === sessionAdminAccountId) {
    throw new Error('본인 요청은 승인할 수 없습니다.')
  }
}
