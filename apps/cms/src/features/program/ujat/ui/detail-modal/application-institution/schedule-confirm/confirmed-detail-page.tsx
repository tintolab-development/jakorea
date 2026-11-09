import { useCallback, useMemo, useState } from 'react'
import { Space, Spin } from 'antd'
import {
  UJAT_INSTITUTION_APPROVAL_BLOCKED_MESSAGE,
  UJAT_REVISION_REQUEST_CHECKING_BLOCKED_REASON,
} from '@/features/program/ujat/lib/ujat-institution-approval-workflow'
import { CmsButton, useCmsAlert } from '@/shared/ui'
import { useUjatInstitutionApplicationDetail } from '@/features/program/ujat/api/use-institution-application-detail'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import { postUjatScheduleChangeRequest } from '@/features/program/ujat/api/temporary-schedule-api'
import { readApiErrorAlertMessage } from '@/shared/lib/extract-api-error-message'
import { submitUjatScheduleConfirmRevisionRequest } from './submit-revision-request'
import { shouldShowScheduleConfirmGuidanceNotes } from './types'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import { useUjatInstitutionTeacherPrivacyReveal } from '../shared/use-institution-teacher-privacy-reveal'
import { UjatInstitutionApplicationActionModal } from '../list/action-modal'
import type { PermissionModalPayload } from '@/shared/components/permission-modal'
import {
  toOrganizationApproveNotifyTiming,
  toTimedBulkNotifyTiming,
} from '@/features/program/general/lib/application-decision-notify-timing'
import { buildUjatScheduleConfirmConfirmedDetail } from './build-confirmed-detail'
import { UjatScheduleConfirmConfirmedDetailView } from './confirmed-detail-view'
import {
  getUjatInstitutionScheduleConfirmApproveCompleteContent,
  UJAT_INSTITUTION_SCHEDULE_CONFIRM_APPROVE_ALERT_TITLE,
} from './institution-approve-complete'
import {
  UJAT_INSTITUTION_APPLICATION_REJECT_COMPLETE_CONTENT,
  UJAT_INSTITUTION_APPLICATION_REJECT_COMPLETE_TITLE,
} from '../list/temp-assign-complete'
import {
  UJAT_REVISION_REQUEST_COMPLETE_ALERT_CONTENT,
  UJAT_REVISION_REQUEST_COMPLETE_ALERT_TITLE,
} from './revision-request-complete'
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
  const [revisionRequestLoading, setRevisionRequestLoading] = useState(false)
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

  const {
    personalInfoRevealed,
    openPersonalInfoRevealConfirm,
    confirmModal,
    programPrivacyPending,
  } = useUjatInstitutionTeacherPrivacyReveal({
    institutionId,
    programId,
    accessItemLabel: row?.institutionName ?? 'UJAT 임시 배정 기관',
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

  const handleRejectConfirm = useCallback(
    (payload: PermissionModalPayload) => {
      if (!row) return
      const reason = payload.reason.trim()
      if (!reason) {
        showAlert({
          title: '필수 항목 미입력 안내',
          content: '반려 사유를 입력해 주세요.',
        })
        return
      }
      void (async () => {
        setActionLoading(true)
        try {
          await rejectRemote(
            reason,
            toTimedBulkNotifyTiming(payload.notifyTiming, payload.manualNotifyAt)
          )
          setPendingReject(false)
          onStatusUpdated()
          onBack()
          showAlert({
            title: UJAT_INSTITUTION_APPLICATION_REJECT_COMPLETE_TITLE,
            content: UJAT_INSTITUTION_APPLICATION_REJECT_COMPLETE_CONTENT,
          })
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

  const handleApproveConfirm = useCallback((payload: PermissionModalPayload) => {
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
        await approveRemote(
          toOrganizationApproveNotifyTiming(payload.notifyTiming, payload.manualNotifyAt)
        )
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
      if (!row || revisionRequestLoading) return
      const reason = payload.message.trim()
      if (!reason) {
        showAlert({
          title: '필수 항목 미입력 안내',
          content: '수정사항을 작성해 주세요.',
        })
        return
      }
      setRevisionRequestLoading(true)
      try {
        if (shouldUseUjatApplicationsRemoteApi() && programId) {
          await submitUjatScheduleConfirmRevisionRequest({
            request: () =>
              postUjatScheduleChangeRequest(String(programId), row.id, {
                reason,
              }),
            invalidate,
            onStatusUpdated,
            closeModal: () => setPendingRevisionRequest(false),
            showAlert,
          })
          return
        }
        void invalidate()
        onStatusUpdated()
        setPendingRevisionRequest(false)
        showAlert({
          title: UJAT_REVISION_REQUEST_COMPLETE_ALERT_TITLE,
          content: UJAT_REVISION_REQUEST_COMPLETE_ALERT_CONTENT,
        })
      } finally {
        setRevisionRequestLoading(false)
      }
    },
    [programId, revisionRequestLoading, row, invalidate, onStatusUpdated, showAlert]
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
  /** 로딩·종결(승인/반려) 상태만 비활성. 순서상 아직 안 되는 경우는 누르면 이유를 안내한다(서버도 같은 규칙으로 막음) */
  const approveOrReassignDisabled = !workflowReady || isTerminal

  return (
    <div className="ujat-institution-application-detail-page">
      <div className="ujat-institution-application-detail-page__actions">
        <Space size={8} wrap>
          <>
          <CmsButton
            type="button"
            variant="delete"
            size="large"
            loading={actionLoading}
            disabled={isTerminal}
            onClick={() => setPendingReject(true)} >
            신청 반려
          </CmsButton>
          <CmsButton
            type="button"
            variant="secondary"
            size="large"
            style={APPROVE_BUTTON_STYLE}
            loading={actionLoading}
            disabled={approveOrReassignDisabled}
            onClick={() => {
              if (approveOrReassignDisabled) return
              if (workflow.primaryDisabled) {
                showAlert({
                  title: '안내',
                  content: workflow.primaryDisabledReason ?? UJAT_INSTITUTION_APPROVAL_BLOCKED_MESSAGE,
                })
                return
              }
              if (workflow.primaryAction === 'open_schedule_assign') {
                onOpenScheduleAssign?.()
                return
              }
              if (workflow.canFinalApprove) setPendingApprove(true)
            }} >
            {approveOrReassignLabel}
          </CmsButton>
          {(() => {
            // 종결 상태만 비활성. 순서상 아직 안 되는 경우(기관 확인 중·이미 수정 요청됨)는 누르면 이유를 안내한다
            return (
              <CmsButton
                type="button"
                variant="primary"
                size="large"
                disabled={isTerminal}
                onClick={() => {
                  if (isTerminal) return
                  if (workflow.revisionRequestDisabled) {
                    showAlert({
                      title: '안내',
                      content:
                        workflow.revisionRequestDisabledReason ??
                        UJAT_REVISION_REQUEST_CHECKING_BLOCKED_REASON,
                    })
                    return
                  }
                  setPendingRevisionRequest(true)
                }} >
                수정 요청
              </CmsButton>
            )
          })()}
          </>
          <PersonalInfoRevealButton disabled={programPrivacyPending}
            labelMode="stickyReveal"
            revealed={personalInfoRevealed}
            cmsVariant="primary"
            cmsSize="large"
            onClick={openPersonalInfoRevealConfirm} />
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
          onConfirm={payload => handleRejectConfirm(payload)}
        />
      ) : null}
      {pendingApprove ? (
        <UjatInstitutionApplicationActionModal
          open
          action="application_approve"
          variant="single"
          institutionName={row.institutionName}
          selectionCount={1}
          confirmLoading={actionLoading}
          onCancel={() => {
            if (actionLoading) return
            setPendingApprove(false)
          }}
          onConfirm={handleApproveConfirm}
        />
      ) : null}
      {pendingRevisionRequest ? (
        <UjatScheduleConfirmRevisionRequestModal
          open
          institutionName={row.institutionName}
          confirmLoading={revisionRequestLoading}
          onCancel={() => {
            if (revisionRequestLoading) return
            setPendingRevisionRequest(false)
          }}
          onConfirm={payload => {
            void handleRevisionRequestConfirm(payload)
          }}
        />
      ) : null}
    </div>
  )
}
