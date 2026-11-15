import { useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  approveGeneralIndividualApplicationWithEducationScope,
  bulkApproveGeneralIndividualApplicationsWithEducationScope,
} from '@/features/program/general/api/admin-applications-service'
import type { PreferredEducationSchedule } from '@/features/program/general/api/individual-application-screening-api-types'
import { toTimedBulkNotifyTiming } from '@/features/program/general/lib/application-decision-notify-timing'
import {
  formatIndividualApprovalScopeErrorMessage,
  invalidateIndividualApprovalScopeQueries,
  isEducationScopeRevisionConflict,
  isRejectedEducationScheduleSelectionError,
  parseRejectedEducationScheduleIds,
} from '@/features/program/general/lib/individual-approval-education-scope'
import type {
  IndividualApproveScopeConfirmPayload,
  IndividualApproveScopeConfirmResult,
  IndividualBulkApproveScopeConfirmPayload,
  IndividualBulkApproveScopeTarget,
} from '@/features/program/general/ui/detail-modal/applications/individual-approve-scope-modal'
import type { Dayjs } from 'dayjs'
import type { PermissionModalNotifyTiming } from '@/shared/components/permission-modal'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'

/** 앞 팝업(16-1 면접 합격 안내·12-1 면접 일괄 합격 안내)에서 고른 알림 발송 시점 */
export type ParticipantScopeApprovalNotify = {
  notifyTiming: PermissionModalNotifyTiming
  manualNotifyAt?: Dayjs | null
}

export type ParticipantScopeApprovalTarget = {
  applicationId: string
  participantName: string
  preferredEducationSchedules?: PreferredEducationSchedule[]
  /**
   * 지정하면 교육 일정 팝업의 알림 값 대신 이 값을 보낸다(일정 팝업은 알림 선택을 숨긴다).
   * 봉사자 교육 배정(`use-education-assign-approval`)과 같은 방식.
   */
  notify?: ParticipantScopeApprovalNotify
}

/** 앞 팝업 알림 값이 있으면 그것을, 없으면 일정 팝업 값을 쓴다 */
export function resolveParticipantScopeApprovalNotify(
  carried: ParticipantScopeApprovalNotify | null | undefined,
  payload: ParticipantScopeApprovalNotify
): ParticipantScopeApprovalNotify {
  return carried ?? { notifyTiming: payload.notifyTiming, manualNotifyAt: payload.manualNotifyAt }
}

function showScopeApprovalError(
  showAlert: ReturnType<typeof useCmsAlert>['showAlert'],
  error: unknown
): void {
  const message = formatIndividualApprovalScopeErrorMessage(error)
  showAlert({
    title: isEducationScopeRevisionConflict(error) ? '교육 일정 갱신' : '처리 실패',
    content: isEducationScopeRevisionConflict(error)
      ? `${message}\n최신 교육 일정을 다시 불러왔습니다. 선택을 확인한 뒤 다시 승인해 주세요.`
      : message,
  })
}

/**
 * 일반 개인 프로그램 참여자 2차 면접 「합격」 — 상세 「참여 승인」과 같은 approve-with-education-scope.
 * final-result PASS는 교육 범위 없이 승인되므로 참여자 합격에 쓰지 않는다.
 * 단건은 「프로그램 신청 승인 안내」(IndividualApproveScopeModal), 일괄은 「참여자 일괄 승인 안내」에서 일정을 고른다.
 */
export function useGeneralParticipantInterview2ScopeApproval({
  programId,
  onApproved,
  onBulkApproved,
}: {
  programId: string
  onApproved: (target: ParticipantScopeApprovalTarget, notifyTiming: PermissionModalNotifyTiming) => void
  onBulkApproved: (successIds: string[]) => void
}) {
  const queryClient = useQueryClient()
  const { showAlert } = useCmsAlert()
  const [target, setTarget] = useState<ParticipantScopeApprovalTarget | null>(null)
  const [bulkTargets, setBulkTargets] = useState<IndividualBulkApproveScopeTarget[] | null>(null)
  const [bulkNotify, setBulkNotify] = useState<ParticipantScopeApprovalNotify | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const cancel = useCallback(() => {
    if (submitting) return
    setTarget(null)
  }, [submitting])

  const cancelBulk = useCallback(() => {
    if (submitting) return
    setBulkTargets(null)
    setBulkNotify(null)
  }, [submitting])

  /** 일괄 일정 팝업 열기 — `notify`는 12-1 면접 일괄 합격 안내에서 고른 알림 값 */
  const openBulk = useCallback(
    (targets: IndividualBulkApproveScopeTarget[] | null, notify?: ParticipantScopeApprovalNotify) => {
      setBulkTargets(targets)
      setBulkNotify(targets ? (notify ?? null) : null)
    },
    []
  )

  const confirm = useCallback(
    async (
      payload: IndividualApproveScopeConfirmPayload
    ): Promise<IndividualApproveScopeConfirmResult> => {
      if (!target || submitting) return {}
      const notify = resolveParticipantScopeApprovalNotify(target.notify, payload)
      setSubmitting(true)
      try {
        const response = await approveGeneralIndividualApplicationWithEducationScope(
          target.applicationId,
          {
            confirmedScheduleIds: payload.confirmedScheduleIds,
            expectedScopeRevision: payload.expectedScopeRevision,
            reason: payload.reason,
            ...toTimedBulkNotifyTiming(notify.notifyTiming, notify.manualNotifyAt),
          }
        )
        await invalidateIndividualApprovalScopeQueries(queryClient, {
          programId,
          applicationIds: [target.applicationId],
          participantIds:
            response.decision?.participantId != null ? [response.decision.participantId] : [],
        })
        if (response.decision?.toStatus && response.decision.toStatus !== 'APPROVED') {
          showAlert({
            title: '승인 결과 확인',
            content: `신청 상태가 ${response.decision.toStatus}로 변경되었습니다.`,
          })
          return {}
        }
        const approved = target
        setTarget(null)
        onApproved(approved, notify.notifyTiming)
        return {}
      } catch (error) {
        await invalidateIndividualApprovalScopeQueries(queryClient, {
          programId,
          applicationIds: [target.applicationId],
        })
        showScopeApprovalError(showAlert, error)
        if (isRejectedEducationScheduleSelectionError(error)) {
          const rejectedScheduleIds = parseRejectedEducationScheduleIds(error)
          if (rejectedScheduleIds.length > 0) return { rejectedScheduleIds }
        }
        return {}
      } finally {
        setSubmitting(false)
      }
    },
    [onApproved, programId, queryClient, showAlert, submitting, target]
  )

  const confirmBulk = useCallback(
    async (
      payload: IndividualBulkApproveScopeConfirmPayload
    ): Promise<IndividualApproveScopeConfirmResult> => {
      if (!bulkTargets?.length || submitting) return {}
      const notify = resolveParticipantScopeApprovalNotify(bulkNotify, payload)
      setSubmitting(true)
      const applicationIds = payload.targets.map(item => item.applicationId)
      try {
        const response = await bulkApproveGeneralIndividualApplicationsWithEducationScope({
          reason: payload.reason,
          targets: payload.targets.map(item => ({
            applicationId: Number(item.applicationId),
            confirmedScheduleIds: item.confirmedScheduleIds,
            expectedScopeRevision: item.expectedScopeRevision,
          })),
          ...toTimedBulkNotifyTiming(notify.notifyTiming, notify.manualNotifyAt),
        })
        await invalidateIndividualApprovalScopeQueries(queryClient, { programId, applicationIds })
        const successIds = (response.successIds ?? []).map(String)
        const failures = response.failures ?? []
        setBulkTargets(null)
        setBulkNotify(null)
        if ((response.failureCount ?? failures.length) > 0) {
          showAlert({
            title: '일부 승인 실패',
            content: [
              `성공 ${successIds.length}건`,
              ...failures.map(failure => {
                const message = failure.message?.trim() || '처리하지 못했습니다.'
                return failure.id != null ? `${failure.id}: ${message}` : message
              }),
            ].join('\n'),
          })
        }
        onBulkApproved(successIds)
        return {}
      } catch (error) {
        await invalidateIndividualApprovalScopeQueries(queryClient, { programId, applicationIds })
        showScopeApprovalError(showAlert, error)
        if (isRejectedEducationScheduleSelectionError(error)) {
          const rejectedScheduleIds = parseRejectedEducationScheduleIds(error)
          if (rejectedScheduleIds.length > 0) return { rejectedScheduleIds }
        }
        return {}
      } finally {
        setSubmitting(false)
      }
    },
    [bulkNotify, bulkTargets, onBulkApproved, programId, queryClient, showAlert, submitting]
  )

  return {
    target,
    open: setTarget,
    cancel,
    confirm,
    bulkTargets,
    openBulk,
    cancelBulk,
    confirmBulk,
    submitting,
  }
}
