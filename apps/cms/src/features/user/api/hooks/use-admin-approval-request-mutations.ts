import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminPermissionFeeGradeToRoleCode } from '@/features/user/api/admin-approval-role'
import { memberQueryKeys } from '@/features/user/api/member-query-keys'
import {
  approveAdminApprovalRequestRemote,
  bulkApproveAdminApprovalRequestsRemote,
  bulkRejectAdminApprovalRequestsRemote,
  changeAdminAccountRoleRemote,
  rejectAdminApprovalRequestRemote,
  resetAdminApprovalRequestPendingRemote,
  resendAdminApprovalNotificationRemote,
} from '@/features/user/api/members-api-client'
import { getMemberApiErrorMessage } from '@/features/user/api/get-member-api-error'
import type { InstructorPermissionApprovePayload } from '@/features/user/permission-management/instructor-permission-approve-modal'
import type { InstructorPermissionRejectPayload } from '@/features/user/permission-management/instructor-permission-reject-modal'

function buildApproveBody(payload: InstructorPermissionApprovePayload) {
  const roleCode = adminPermissionFeeGradeToRoleCode(payload.feeGrade)
  return {
    roleCode,
    reason: `CMS 관리자 권한 승인 (${roleCode})`,
  }
}

function buildApproveReason(payload: InstructorPermissionApprovePayload): string {
  const roleCode = adminPermissionFeeGradeToRoleCode(payload.feeGrade)
  return `CMS 관리자 권한 승인 (${roleCode})`
}

function buildRejectReason(payload: InstructorPermissionRejectPayload): string {
  return payload.rejectionReason?.trim() || 'CMS 관리자 권한 신청 반려'
}

export function useAdminApprovalRequestMutations() {
  const queryClient = useQueryClient()

  const invalidateLists = async () => {
    await queryClient.invalidateQueries({
      queryKey: memberQueryKeys.adminApprovalRequests.all(),
    })
  }

  const invalidateDetail = async (adminAccountId: number) => {
    await queryClient.invalidateQueries({
      queryKey: memberQueryKeys.adminApprovalRequests.detail(adminAccountId),
    })
  }

  const approveMutation = useMutation({
    mutationFn: async (input: {
      adminIds: number[]
      payload: InstructorPermissionApprovePayload
    }) => {
      const roleBody = buildApproveBody(input.payload)
      const reason = buildApproveReason(input.payload)

      if (input.adminIds.length === 1) {
        const adminId = input.adminIds[0]
        await changeAdminAccountRoleRemote(adminId, roleBody)
        await approveAdminApprovalRequestRemote(adminId, { reason })
        return
      }

      await bulkApproveAdminApprovalRequestsRemote({
        ids: input.adminIds,
        roleCode: roleBody.roleCode,
        reason,
      })
    },
    onSuccess: async (_data, variables) => {
      await invalidateLists()
      await Promise.all(variables.adminIds.map(id => invalidateDetail(id)))
    },
  })

  const rejectMutation = useMutation({
    mutationFn: async (input: {
      adminIds: number[]
      payload: InstructorPermissionRejectPayload
    }) => {
      const reason = buildRejectReason(input.payload)
      if (input.adminIds.length === 1) {
        await rejectAdminApprovalRequestRemote(input.adminIds[0], { reason })
        return
      }
      await bulkRejectAdminApprovalRequestsRemote({
        ids: input.adminIds,
        reason,
      })
    },
    onSuccess: async (_data, variables) => {
      await invalidateLists()
      await Promise.all(variables.adminIds.map(id => invalidateDetail(id)))
    },
  })

  const resetPendingMutation = useMutation({
    mutationFn: async (input: { adminAccountId: number; reason: string }) => {
      await resetAdminApprovalRequestPendingRemote(input.adminAccountId, {
        reason: input.reason.trim() || 'CMS 관리자 권한 승인 취소',
      })
    },
    onSuccess: async (_data, variables) => {
      await invalidateLists()
      await invalidateDetail(variables.adminAccountId)
    },
  })

  const resendNotificationMutation = useMutation({
    mutationFn: async (adminAccountId: number) => {
      await resendAdminApprovalNotificationRemote(adminAccountId)
    },
    onSuccess: async (_data, adminAccountId) => {
      await invalidateDetail(adminAccountId)
    },
  })

  return {
    approveMutation,
    rejectMutation,
    resetPendingMutation,
    resendNotificationMutation,
    getApproveError: (error: unknown) =>
      getMemberApiErrorMessage(error, '관리자 권한 승인에 실패했습니다.'),
    getRejectError: (error: unknown) =>
      getMemberApiErrorMessage(error, '관리자 권한 반려에 실패했습니다.'),
    getResetPendingError: (error: unknown) =>
      getMemberApiErrorMessage(error, '관리자 권한 승인 취소에 실패했습니다.'),
    getResendNotificationError: (error: unknown) =>
      getMemberApiErrorMessage(error, '알림 재발송에 실패했습니다.'),
  }
}
