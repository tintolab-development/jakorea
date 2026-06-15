import { useMutation, useQueryClient } from '@tanstack/react-query'
import { memberQueryKeys } from '@/features/user/api/member-query-keys'
import {
  approveInstructorRoleRequestRemote,
  rejectInstructorRoleRequestRemote,
} from '@/features/user/api/members-api-client'
import { getMemberApiErrorMessage } from '@/features/user/api/get-member-api-error'
import type { InstructorPermissionApprovePayload } from '@/features/user/permission-management/instructor-permission-approve-modal'
import type { InstructorPermissionRejectPayload } from '@/features/user/permission-management/instructor-permission-reject-modal'

function buildApproveBody(payload: InstructorPermissionApprovePayload) {
  const grade = payload.feeGrade.trim()
  return {
    reason: `CMS 강사 권한 승인 (${grade})`,
    feeGrade: grade,
    activityType: grade,
  }
}

function buildRejectBody(payload: InstructorPermissionRejectPayload) {
  const reason = payload.rejectionReason?.trim() || 'CMS 강사 권한 신청 반려'
  return {
    reason,
    rejectReason: reason,
  }
}

export function useInstructorRoleRequestMutations() {
  const queryClient = useQueryClient()

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: memberQueryKeys.instructorRoleRequests.all(),
    })
  }

  const approveMutation = useMutation({
    mutationFn: async (input: {
      requestIds: number[]
      payload: InstructorPermissionApprovePayload
    }) => {
      const body = buildApproveBody(input.payload)
      for (const requestId of input.requestIds) {
        await approveInstructorRoleRequestRemote(requestId, body)
      }
    },
    onSuccess: invalidate,
  })

  const rejectMutation = useMutation({
    mutationFn: async (input: {
      requestIds: number[]
      payload: InstructorPermissionRejectPayload
    }) => {
      const body = buildRejectBody(input.payload)
      for (const requestId of input.requestIds) {
        await rejectInstructorRoleRequestRemote(requestId, body)
      }
    },
    onSuccess: invalidate,
  })

  return {
    approveMutation,
    rejectMutation,
    getApproveError: (error: unknown) =>
      getMemberApiErrorMessage(error, '강사 권한 승인에 실패했습니다.'),
    getRejectError: (error: unknown) =>
      getMemberApiErrorMessage(error, '강사 권한 반려에 실패했습니다.'),
  }
}
