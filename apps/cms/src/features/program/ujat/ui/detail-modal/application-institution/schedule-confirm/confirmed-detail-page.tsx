import { useCallback, useMemo, useState } from 'react'
import { Space, Spin } from 'antd'
import { CmsButton, CMS_ACTION_BUTTON_WIDTH, useCmsAlert } from '@/shared/ui'
import { useUjatInstitutionApplicationDetail } from '@/features/program/ujat/api/use-institution-application-detail'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import { postUjatScheduleChangeRequest } from '@/features/program/ujat/api/temporary-schedule-api'
import { readApiErrorAlertMessage } from '@/shared/lib/extract-api-error-message'
import { shouldShowScheduleConfirmGuidanceNotes } from './types'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import { UjatInstitutionApplicationActionModal } from '../list/action-modal'
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
import '../detail/detail-page.css'

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
  const [actionLoading, setActionLoading] = useState(false)
  const {
    row,
    detail: baseDetail,
    loading,
    invalidate,
    approveRemote,
    rejectRemote,
    workflow,
    workflowReady,
    remoteDetail,
    temporarySchedule,
  } = useUjatInstitutionApplicationDetail({
    institutionId,
    programId,
  })

  const detail = useMemo(
    () =>
      buildUjatScheduleConfirmConfirmedDetail(
        row,
        baseDetail,
        remoteDetail,
        temporarySchedule
      ),
    [row, baseDetail, remoteDetail, temporarySchedule]
  )

  const showGuidanceNotes = shouldShowScheduleConfirmGuidanceNotes(
    detail?.scheduleConfirmStatus ?? row?.scheduleConfirmStatus ?? null
  )
  const isTerminal =
    detail?.scheduleConfirmStatus === 'approval_completed' ||
    detail?.scheduleConfirmStatus === 'application_rejected'

  const {
    personalInfoRevealed,
    openPersonalInfoRevealConfirm,
    confirmModal,
  } = usePersonalInfoReveal({
    resolveAccessItem: () => row?.institutionName ?? 'UJAT 임시 배정 기관',
    resetDeps: [row?.id],
    controlMode: 'headerStickyNoop',
  })

  const handleRejectConfirm = useCallback(
    (reason?: string) => {
      if (!row) return
      void (async () => {
        setActionLoading(true)
        try {
          await rejectRemote(reason ?? 'CMS UJAT 임시 배정 기관 신청 반려')
          onStatusUpdated()
          onBack()
          setPendingReject(false)
        } catch (error) {
          showAlert({
            title: '안내',
            content: readApiErrorAlertMessage(error, '신청기관 반려 처리에 실패했습니다.'),
          })
        } finally {
          setActionLoading(false)
        }
      })()
    },
    [onBack, onStatusUpdated, rejectRemote, row, showAlert]
  )

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
      setActionLoading(true)
      try {
        await approveRemote()
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
      } finally {
        setActionLoading(false)
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

  if (loading) {
    return (
      <div className="page-content-loading" role="status">
        <Spin size="large" />
      </div>
    )
  }

  if (!row || !detail) {
    return (
      <div className="ujat-institution-application-detail-page">
        <p>신청 기관 정보를 찾을 수 없습니다.</p>
        <CmsButton type="button" variant="secondary" size="large" onClick={onBack}>
          목록으로
        </CmsButton>
      </div>
    )
  }

  const approveOrReassignLabel =
    workflow.primaryAction === 'open_schedule_assign' ? '일정 재배정' : '신청 승인'
  const approveOrReassignDisabled =
    !workflowReady || workflow.primaryDisabled || isTerminal

  return (
    <div className="ujat-institution-application-detail-page">
      <div className="ujat-institution-application-detail-page__actions">
        <Space size={8} wrap>
          <CmsButton
            type="button"
            variant="delete"
            size="large"
            className="cms-button--action"
            width={CMS_ACTION_BUTTON_WIDTH}
            loading={actionLoading}
            disabled={isTerminal}
            onClick={() => setPendingReject(true)}
          >
            신청 반려
          </CmsButton>
          <CmsButton
            type="button"
            variant="secondary"
            size="large"
            className="cms-button--action"
            width={CMS_ACTION_BUTTON_WIDTH}
            style={APPROVE_BUTTON_STYLE}
            loading={actionLoading}
            disabled={approveOrReassignDisabled}
            onClick={() => {
              if (approveOrReassignDisabled) return
              if (workflow.primaryAction === 'open_schedule_assign') {
                onOpenScheduleAssign?.()
                return
              }
              if (workflow.canFinalApprove) setPendingApprove(true)
            }}
          >
            {approveOrReassignLabel}
          </CmsButton>
          <CmsButton
            type="button"
            variant="primary"
            size="large"
            className="cms-button--action"
            width={CMS_ACTION_BUTTON_WIDTH}
            disabled={isTerminal || workflow.revisionRequestDisabled}
            onClick={() => setPendingRevisionRequest(true)}
          >
            수정 요청
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
          onConfirm={payload => handleRejectConfirm(payload.reason)}
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
