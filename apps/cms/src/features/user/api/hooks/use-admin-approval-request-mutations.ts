import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminPermissionFeeGradeToRoleCode } from '@/features/user/api/admin-approval-role'
import { memberQueryKeys } from '@/features/user/api/member-query-keys'
import {
  changeAdminAccountRoleRemote,
  verifyAdminAccountRemote,
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

function buildVerifyApproveBody(payload: InstructorPermissionApprovePayload) {
  const roleCode = adminPermissionFeeGradeToRoleCode(payload.feeGrade)
  return {
    result: 'APPROVED',
    reason: `CMS 관리자 권한 승인 (${roleCode})`,
  }
}

function buildVerifyRejectBody(payload: InstructorPermissionRejectPayload) {
  const reason = payload.rejectionReason?.trim() || 'CMS 관리자 권한 신청 반려'
  return {
    result: 'REJECTED',
    reason,
  }
}

export function useAdminApprovalRequestMutations() {
  const queryClient = useQueryClient()

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: memberQueryKeys.adminApprovalRequests.all(),
    })
  }

  const approveMutation = useMutation({
    mutationFn: async (input: {
      adminIds: number[]
      payload: InstructorPermissionApprovePayload
    }) => {
      const roleBody = buildApproveBody(input.payload)
      const verifyBody = buildVerifyApproveBody(input.payload)

      for (const adminId of input.adminIds) {
        await changeAdminAccountRoleRemote(adminId, roleBody)
        await verifyAdminAccountRemote(adminId, verifyBody)
      }
    },
    onSuccess: invalidate,
  })

  const rejectMutation = useMutation({
    mutationFn: async (input: {
      adminIds: number[]
      payload: InstructorPermissionRejectPayload
    }) => {
      const body = buildVerifyRejectBody(input.payload)
      for (const adminId of input.adminIds) {
        await verifyAdminAccountRemote(adminId, body)
      }
    },
    onSuccess: invalidate,
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
