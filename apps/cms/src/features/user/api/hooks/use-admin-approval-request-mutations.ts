import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminPermissionFeeGradeToRoleCode } from '@/features/user/api/admin-approval-role'
import { memberQueryKeys } from '@/features/user/api/member-query-keys'
import {
  approveAdminApprovalRequestRemote,
  changeAdminAccountRoleRemote,
  rejectAdminApprovalRequestRemote,
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

  const invalidateAfterChange = async (adminIds: number[]) => {
    await queryClient.invalidateQueries({
      queryKey: memberQueryKeys.adminApprovalRequests.all(),
    })
    await queryClient.invalidateQueries({ queryKey: memberQueryKeys.listAll() })
    await Promise.all(
      adminIds.map(adminId =>
        queryClient.invalidateQueries({ queryKey: memberQueryKeys.detail(adminId) })
      )
    )
  }

  const approveMutation = useMutation({
    mutationFn: async (input: {
      adminIds: number[]
      payload: InstructorPermissionApprovePayload
    }) => {
      const roleBody = buildApproveBody(input.payload)
      const reason = buildApproveReason(input.payload)

      for (const adminId of input.adminIds) {
        await changeAdminAccountRoleRemote(adminId, roleBody)
        await approveAdminApprovalRequestRemote(adminId, { reason })
      }
    },
    onSuccess: async (_data, variables) => {
      await invalidateAfterChange(variables.adminIds)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: async (input: {
      adminIds: number[]
      payload: InstructorPermissionRejectPayload
    }) => {
      const reason = buildRejectReason(input.payload)
      for (const adminId of input.adminIds) {
        await rejectAdminApprovalRequestRemote(adminId, { reason })
      }
    },
    onSuccess: async (_data, variables) => {
      await invalidateAfterChange(variables.adminIds)
    },
  })

  return {
    approveMutation,
    rejectMutation,
    getApproveError: (error: unknown) =>
      getMemberApiErrorMessage(error, '관리자 권한 승인에 실패했습니다.'),
    getRejectError: (error: unknown) =>
      getMemberApiErrorMessage(error, '관리자 권한 반려에 실패했습니다.'),
  }
}
