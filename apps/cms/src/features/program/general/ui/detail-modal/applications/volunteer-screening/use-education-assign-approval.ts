import { useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Dayjs } from 'dayjs'
import { approveGeneralVolunteerApplicationWithEducationScope } from '@/features/program/general/api/admin-applications-service'
import {
  generalApplicationsQueryKeys,
  generalProgramProgressQueryKeys,
} from '@/features/program/general/api/general-applications-query-keys'
import {
  formatIndividualApprovalScopeErrorMessage,
  individualApprovalEducationSlotsQueryKey,
} from '@/features/program/general/lib/individual-approval-education-scope'
import { buildVolunteerApprovalWithScopeRequest } from '@/features/program/general/lib/volunteer-education-assign'
import type { PermissionModalNotifyTiming } from '@/shared/components/permission-modal'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'

export type VolunteerEducationAssignTarget = {
  applicationId: string
  volunteerName: string
  /** 앞 단계(승인 안내·합격 안내)에서 고른 알림 시점 */
  notifyTiming: PermissionModalNotifyTiming
  manualNotifyAt?: Dayjs | null
}

/**
 * 개인 프로그램 봉사자 승인 + 선택적 교육 배정 (approve-with-education-scope).
 * 결정 팝업 → 「교육 배정 안내」 → [배정] 순서. 취소하면 아무것도 저장하지 않는다.
 */
export function useGeneralVolunteerEducationAssignApproval({
  programId,
  invalidateApplications,
  onApproved,
}: {
  programId: string
  invalidateApplications: () => Promise<void>
  onApproved: (target: VolunteerEducationAssignTarget) => void
}) {
  const queryClient = useQueryClient()
  const { showAlert } = useCmsAlert()
  const [target, setTarget] = useState<VolunteerEducationAssignTarget | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const cancel = useCallback(() => {
    if (submitting) return
    setTarget(null)
  }, [submitting])

  const confirm = useCallback(
    async (confirmedScheduleIds: number[]) => {
      if (!target || submitting) return
      setSubmitting(true)
      try {
        await approveGeneralVolunteerApplicationWithEducationScope(
          target.applicationId,
          buildVolunteerApprovalWithScopeRequest({
            confirmedScheduleIds,
            notifyTiming: target.notifyTiming,
            manualNotifyAt: target.manualNotifyAt,
          })
        )
        await Promise.all([
          invalidateApplications(),
          queryClient.invalidateQueries({
            queryKey: generalApplicationsQueryKeys.volunteerDetail(target.applicationId),
          }),
          queryClient.invalidateQueries({
            queryKey: individualApprovalEducationSlotsQueryKey(programId),
          }),
          queryClient.invalidateQueries({
            queryKey: generalProgramProgressQueryKeys.volunteers(programId),
          }),
        ])
        const approved = target
        setTarget(null)
        onApproved(approved)
      } catch (error) {
        showAlert({ title: '승인 실패', content: formatIndividualApprovalScopeErrorMessage(error) })
      } finally {
        setSubmitting(false)
      }
    },
    [invalidateApplications, onApproved, programId, queryClient, showAlert, submitting, target]
  )

  return { target, open: setTarget, cancel, confirm, submitting }
}
