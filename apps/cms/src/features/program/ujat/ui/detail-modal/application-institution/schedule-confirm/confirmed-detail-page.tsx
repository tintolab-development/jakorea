import { useCallback, useMemo, useState } from 'react'
import { Space } from 'antd'
import { CmsButton, useCmsAlert } from '@/shared/ui'
import { patchUjatInstitutionScheduleConfirmStatus } from '@/features/program/ujat/model/ujat-institution-application'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import { useUjatInstitutionApplicationDetail } from '@/features/program/ujat/api/use-institution-application-detail'
import { postUjatScheduleChangeRequest } from '@/features/program/ujat/api/temporary-schedule-api'
import { readApiErrorAlertMessage } from '@/shared/lib/extract-api-error-message'
import { shouldShowScheduleConfirmGuidanceNotes } from './types'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import {
  UjatInstitutionApplicationActionModal,
} from '../list/action-modal'
import { buildUjatScheduleConfirmConfirmedDetail } from './build-confirmed-detail'
import { UjatScheduleConfirmConfirmedDetailView } from './confirmed-detail-view'
import {
  getUjatInstitutionScheduleConfirmApproveCompleteContent,
  UJAT_INSTITUTION_SCHEDULE_CONFIRM_APPROVE_ALERT_TITLE,
} from './institution-approve-complete'
import {
  UjatScheduleConfirmRevisionRequestModal,
  type UjatScheduleConfirmRevisionRequestModalPayload,
} from './revision-request-modal'

const APPROVE_BUTTON_STYLE = {
  borderColor: 'var(--color-primary, #00a9a5)',
  color: 'var(--color-primary, #00a9a5)',
} as const

export function UjatInstitutionScheduleConfirmConfirmedDetailPage({
  institutionId,
  programId,
  onBack,
  onStatusUpdated,
  onOpenScheduleAssign,
}: {
  institutionId: string
  programId?: string | null
  onBack: () => void
  onStatusUpdated: () => void
  onOpenScheduleAssign?: () => void
}) {
  const { showAlert } = useCmsAlert()
  const [pendingReject, setPendingReject] = useState(false)
  const [pendingApprove, setPendingApprove] = useState(false)
  const [pendingRevisionRequest, setPendingRevisionRequest] = useState(false)
  const { row, detail: baseDetail, invalidate, approveRemote, workflow, workflowReady } =
    useUjatInstitutionApplicationDetail({
    institutionId,
    programId,
  })

  const detail = useMemo(
    () => buildUjatScheduleConfirmConfirmedDetail(row, baseDetail),
    [row, baseDetail]
  )

  const showGuidanceNotes = shouldShowScheduleConfirmGuidanceNotes(
    row?.scheduleConfirmStatus ?? null
  )

  const {
    personalInfoRevealed,
    openPersonalInfoRevealConfirm,
    confirmModal,
  } = usePersonalInfoReveal({
    resolveAccessItem: () => row?.institutionName ?? 'UJAT 임시 배정 기관',
    resetDeps: [row?.id],
    controlMode: 'headerStickyNoop',
  })

  const handleRejectConfirm = useCallback(() => {
    if (!row) return
    patchUjatInstitutionScheduleConfirmStatus([row.id], 'application_rejected')
    onStatusUpdated()
    onBack()
    setPendingReject(false)
  }, [row, onStatusUpdated, onBack])

  const handleApproveConfirm = useCallback(() => {
    if (!row || !workflow.canFinalApprove) {
      setPendingApprove(false)
      showAlert({
        title: '안내',
        content: '먼저 임시 일정을 배정하고 기관 확인을 완료해 주세요.',
      })
      return
    }
    void (async () => {
      try {
        await approveRemote()
        patchUjatInstitutionScheduleConfirmStatus([row.id], 'approval_completed')
        onStatusUpdated()
        setPendingApprove(false)
        showAlert({
          title: UJAT_INSTITUTION_SCHEDULE_CONFIRM_APPROVE_ALERT_TITLE,
          content: getUjatInstitutionScheduleConfirmApproveCompleteContent(
            row.institutionName,
            row.assignedInstructorCount ?? null
          ),
        })
      } catch (error) {
        showAlert({
          title: '안내',
          content: readApiErrorAlertMessage(error, '최종 승인에 실패했습니다.'),
        })
      }
    })()
  }, [approveRemote, onStatusUpdated, row, showAlert, workflow.canFinalApprove])

  const handleRevisionRequestConfirm = useCallback(
    async (payload: UjatScheduleConfirmRevisionRequestModalPayload) => {
      if (!row) return
      if (shouldUseUjatApplicationsRemoteApi() && programId) {
        try {
          await postUjatScheduleChangeRequest(String(programId), row.id, {
            reason: payload.message || '학급 수 변경 요청',
          })
        } catch (error) {
          showAlert({
            title: '수정 요청 실패',
            content: readApiErrorAlertMessage(error, '수정 요청 전송에 실패했습니다. 다시 시도해 주세요.'),
          })
          return
        }
      }
      patchUjatInstitutionScheduleConfirmStatus([row.id], 'revision_requested')
      void invalidate()
      onStatusUpdated()
      setPendingRevisionRequest(false)
      showAlert({
        title: '수정 요청',
        content: `[${row.institutionName}] 담당교사님에게 수정 요청이 전달되었습니다.`,
      })
    },
    [programId, row, invalidate, onStatusUpdated, showAlert]
  )

  if (!row || !detail) {
    return null
  }

  return (
    <div className="ujat-institution-application-detail-page">
      <div
        className="ujat-institution-application-detail-page__actions"
        style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}
      >
        <Space size={8} wrap>
          <CmsButton
            type="button"
            variant="delete"
            size="large"
            width={140}
            onClick={() => setPendingReject(true)}
          >
            신청 반려
          </CmsButton>
          <CmsButton
            type="button"
            variant="secondary"
            size="large"
            width={180}
            style={APPROVE_BUTTON_STYLE}
            disabled={!workflowReady || workflow.primaryDisabled}
            onClick={() => {
              if (!workflowReady || workflow.primaryDisabled) return
              if (workflow.primaryAction === 'open_schedule_assign') {
                onOpenScheduleAssign?.()
                return
              }
              if (workflow.canFinalApprove) setPendingApprove(true)
            }}
          >
            {workflow.primaryAction === 'final_approve' ? '최종 승인' : workflow.primaryLabel}
          </CmsButton>
          <CmsButton
            type="button"
            variant="primary"
            size="large"
            width={140}
            disabled={workflow.scheduleEditDisabled}
            onClick={() => setPendingRevisionRequest(true)}
          >
            일정 수정 요청
          </CmsButton>
          <PersonalInfoRevealButton
            labelMode="stickyReveal"
            revealed={personalInfoRevealed}
            cmsVariant="primary"
            cmsSize="large"
            width={180}
            onClick={openPersonalInfoRevealConfirm}
          />
        </Space>
      </div>

      <UjatScheduleConfirmConfirmedDetailView
        detail={detail}
        personalInfoRevealed={personalInfoRevealed}
        showGuidanceNotes={showGuidanceNotes}
      />
      {confirmModal}
      {pendingReject ? (
        <UjatInstitutionApplicationActionModal
          open
          action="application_reject"
          variant="single"
          institutionName={row.institutionName}
          selectionCount={1}
          onCancel={() => setPendingReject(false)}
          onConfirm={handleRejectConfirm}
        />
      ) : null}
      {pendingApprove ? (
        <UjatInstitutionApplicationActionModal
          open
          action="application_approve"
          variant="single"
          institutionName={row.institutionName}
          selectionCount={1}
          onCancel={() => setPendingApprove(false)}
          onConfirm={handleApproveConfirm}
        />
      ) : null}
      {pendingRevisionRequest ? (
        <UjatScheduleConfirmRevisionRequestModal
          open
          institutionName={row.institutionName}
          onCancel={() => setPendingRevisionRequest(false)}
          onConfirm={payload => {
            void handleRevisionRequestConfirm(payload)
          }}
        />
      ) : null}
    </div>
  )
}
