import { useMutation, useQueryClient } from '@tanstack/react-query'
import { memberQueryKeys } from '@/features/user/api/member-query-keys'
import {
  approveInstructorRoleRequestRemote,
  bulkApproveInstructorRoleRequestsRemote,
  bulkRejectInstructorRoleRequestsRemote,
  rejectInstructorRoleRequestRemote,
  resetInstructorRoleRequestPendingRemote,
  resendInstructorRoleNotificationRemote,
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

function buildBulkBody(
  requestIds: number[],
  reason: string,
  extra?: { feeGrade?: string; activityType?: string; rejectReason?: string }
) {
  return {
    ids: requestIds,
    reason,
    ...extra,
  }
}

export function useInstructorRoleRequestMutations() {
  const queryClient = useQueryClient()

  const invalidateLists = async () => {
    await queryClient.invalidateQueries({
      queryKey: memberQueryKeys.instructorRoleRequests.all(),
    })
  }

  const invalidateDetail = async (requestId: number) => {
    await queryClient.invalidateQueries({
      queryKey: memberQueryKeys.instructorRoleRequests.detail(requestId),
    })
  }

  const approveMutation = useMutation({
    mutationFn: async (input: {
      requestIds: number[]
      payload: InstructorPermissionApprovePayload
    }) => {
      const body = buildApproveBody(input.payload)
      if (input.requestIds.length === 1) {
        await approveInstructorRoleRequestRemote(input.requestIds[0], body)
        return
      }
      await bulkApproveInstructorRoleRequestsRemote(
        buildBulkBody(input.requestIds, body.reason, {
          feeGrade: body.feeGrade,
          activityType: body.activityType,
        })
      )
    },
    onSuccess: async (_data, variables) => {
      await invalidateLists()
      await Promise.all(variables.requestIds.map(id => invalidateDetail(id)))
    },
  })

  const rejectMutation = useMutation({
    mutationFn: async (input: {
      requestIds: number[]
      payload: InstructorPermissionRejectPayload
    }) => {
      const body = buildRejectBody(input.payload)
      if (input.requestIds.length === 1) {
        await rejectInstructorRoleRequestRemote(input.requestIds[0], body)
        return
      }
      await bulkRejectInstructorRoleRequestsRemote(
        buildBulkBody(input.requestIds, body.reason, { rejectReason: body.rejectReason })
      )
    },
    onSuccess: async (_data, variables) => {
      await invalidateLists()
      await Promise.all(variables.requestIds.map(id => invalidateDetail(id)))
    },
  })

  const resetPendingMutation = useMutation({
    mutationFn: async (input: { requestId: number; reason: string }) => {
      await resetInstructorRoleRequestPendingRemote(input.requestId, {
        reason: input.reason.trim() || 'CMS 강사 권한 승인 취소',
      })
    },
    onSuccess: async (_data, variables) => {
      await invalidateLists()
      await invalidateDetail(variables.requestId)
    },
  })

  const resendNotificationMutation = useMutation({
    mutationFn: async (requestId: number) => {
      await resendInstructorRoleNotificationRemote(requestId)
    },
    onSuccess: async (_data, requestId) => {
      await invalidateDetail(requestId)
    },
  })

  return {
    approveMutation,
    rejectMutation,
    resetPendingMutation,
    resendNotificationMutation,
    getApproveError: (error: unknown) =>
      getMemberApiErrorMessage(error, '강사 권한 승인에 실패했습니다.'),
    getRejectError: (error: unknown) =>
      getMemberApiErrorMessage(error, '강사 권한 반려에 실패했습니다.'),
    getResetPendingError: (error: unknown) =>
      getMemberApiErrorMessage(error, '강사 권한 승인 취소에 실패했습니다.'),
    getResendNotificationError: (error: unknown) =>
      getMemberApiErrorMessage(error, '알림 재발송에 실패했습니다.'),
  }
}
