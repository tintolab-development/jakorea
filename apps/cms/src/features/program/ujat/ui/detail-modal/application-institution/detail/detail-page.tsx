import { useCallback, useState } from 'react'
import { Space, Spin } from 'antd'
import { useCmsAlert } from '@/shared/ui'
import { CmsButton, CMS_ACTION_BUTTON_WIDTH } from '@/shared/ui'
import { useUjatCanWrite } from '@/features/program/ujat/lib/use-can-write'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import { useUjatInstitutionApplicationDetail } from '@/features/program/ujat/api/use-institution-application-detail'
import { useUjatInstitutionTeacherPrivacyReveal } from '../shared/use-institution-teacher-privacy-reveal'
import { UjatInstitutionApplicationDetailView } from './detail-view'
import {
  UjatInstitutionApplicationActionModal,
  type UjatInstitutionApplicationModalAction,
} from '../list/action-modal'
import { TemporaryActionModal } from '../temporary-action-modal'
import type { UjatTemporaryActionKind } from '../temporary-action-copy'
import { releaseUjatTemporarySchedules } from '../list/temp-release'
import {
  getUjatInstitutionTempRejectCompleteContent,
  UJAT_INSTITUTION_APPLICATION_REJECT_COMPLETE_CONTENT,
  UJAT_INSTITUTION_APPLICATION_REJECT_COMPLETE_TITLE,
  UJAT_INSTITUTION_TEMP_ASSIGN_CANCEL_COMPLETE_CONTENT,
  UJAT_INSTITUTION_TEMP_ASSIGN_CANCEL_COMPLETE_TITLE,
  UJAT_INSTITUTION_TEMP_REJECT_ALERT_TITLE,
  UJAT_INSTITUTION_TEMP_REJECT_CANCEL_COMPLETE_CONTENT,
  UJAT_INSTITUTION_TEMP_REJECT_CANCEL_COMPLETE_TITLE,
} from '../list/temp-assign-complete'
import type { PermissionModalPayload } from '@/shared/components/permission-modal'
import { readApiErrorAlertMessage } from '@/shared/lib/extract-api-error-message'
import {
  toOrganizationApproveNotifyTiming,
  toTimedBulkNotifyTiming,
} from '@/features/program/general/lib/application-decision-notify-timing'
import './detail-page.css'

export function UjatInstitutionApplicationDetailPage({
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
  const canWrite = useUjatCanWrite()
  const {
    row,
    detail,
    loading,
    approveRemote,
    rejectRemote,
    tempRejectRemote,
    tempRejectCancelRemote,
    workflow,
    workflowReady,
  } = useUjatInstitutionApplicationDetail({ institutionId, programId })

  const {
    personalInfoRevealed,
    openPersonalInfoRevealConfirm,
    confirmModal,
    programPrivacyPending,
  } = useUjatInstitutionTeacherPrivacyReveal({
    institutionId,
    programId,
    accessItemLabel: row?.institutionName ?? 'UJAT 신청 기관',
  })

  const [pendingAction, setPendingAction] = useState<UjatInstitutionApplicationModalAction | null>(
    null
  )
  const [pendingTempKind, setPendingTempKind] = useState<UjatTemporaryActionKind | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const handlePrimaryAction = useCallback(() => {
    if (!workflowReady || workflow.primaryDisabled) return
    if (workflow.primaryAction === 'open_schedule_assign') {
      setPendingTempKind('temp_assign')
      return
    }
    if (workflow.primaryAction === 'final_approve') {
      setPendingAction('application_approve')
    }
  }, [workflow.primaryAction, workflow.primaryDisabled, workflowReady])

  const handleFinalApprove = useCallback(
    (payload?: PermissionModalPayload) => {
      if (!workflow.canFinalApprove) {
        setPendingAction(null)
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
            payload
              ? toOrganizationApproveNotifyTiming(payload.notifyTiming, payload.manualNotifyAt)
              : undefined
          )
          setPendingAction(null)
          onStatusUpdated()
          onBack()
          showAlert({
            title: '최종 승인',
            content: '기관 확인이 완료된 신청을 최종 승인했습니다.',
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
    },
    [approveRemote, onBack, onStatusUpdated, showAlert, workflow.canFinalApprove]
  )

  const handleActionConfirm = (payload: PermissionModalPayload) => {
    if (!pendingAction || !row) return
    if (pendingAction === 'application_approve') {
      handleFinalApprove(payload)
      return
    }
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
        setPendingAction(null)
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
  }

  const closeTempModal = useCallback(() => {
    if (actionLoading) return
    setPendingTempKind(null)
  }, [actionLoading])

  const handleTempActionConfirm = useCallback(async () => {
    if (!pendingTempKind || !row) return
    if (pendingTempKind === 'temp_assign') {
      setPendingTempKind(null)
      onOpenScheduleAssign?.()
      return
    }
    setActionLoading(true)
    try {
      if (pendingTempKind === 'temp_reject_cancel') {
        await tempRejectCancelRemote()
        setPendingTempKind(null)
        onStatusUpdated()
        onBack()
        showAlert({
          title: UJAT_INSTITUTION_TEMP_REJECT_CANCEL_COMPLETE_TITLE,
          content: UJAT_INSTITUTION_TEMP_REJECT_CANCEL_COMPLETE_CONTENT,
        })
        return
      }
      if (pendingTempKind === 'temp_reject') {
        await tempRejectRemote()
        setPendingTempKind(null)
        onStatusUpdated()
        onBack()
        showAlert({
          title: UJAT_INSTITUTION_TEMP_REJECT_ALERT_TITLE,
          content: getUjatInstitutionTempRejectCompleteContent(1),
        })
        return
      }
      if (pendingTempKind === 'temp_assign_cancel') {
        if (!programId) {
          showAlert({ title: '안내', content: '프로그램 정보가 없어 임시 배정을 취소할 수 없습니다.' })
          return
        }
        const results = await releaseUjatTemporarySchedules(String(programId), [
          { id: row.id, name: row.institutionName },
        ])
        const failed = results.find(item => !item.ok)
        if (failed) {
          showAlert({
            title: '안내',
            content: failed.message ?? '임시 배정 취소에 실패했습니다.',
          })
          return
        }
        setPendingTempKind(null)
        onStatusUpdated()
        onBack()
        showAlert({
          title: UJAT_INSTITUTION_TEMP_ASSIGN_CANCEL_COMPLETE_TITLE,
          content: UJAT_INSTITUTION_TEMP_ASSIGN_CANCEL_COMPLETE_CONTENT,
        })
      }
    } catch (error) {
      showAlert({
        title: '안내',
        content: readApiErrorAlertMessage(error, '임시 처리에 실패했습니다.'),
      })
    } finally {
      setActionLoading(false)
    }
  }, [
    onBack,
    onOpenScheduleAssign,
    onStatusUpdated,
    pendingTempKind,
    programId,
    row,
    showAlert,
    tempRejectCancelRemote,
    tempRejectRemote,
  ])

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

  return (
    <div className="ujat-institution-application-detail-page">
      <div className="ujat-institution-application-detail-page__actions">
        <Space size={8} wrap>
          {canWrite ? (
          <>
          <CmsButton
            type="button"
            variant="delete"
            size="large"
            className="cms-button--action"
            width={CMS_ACTION_BUTTON_WIDTH}
            loading={actionLoading}
            onClick={() => setPendingAction('application_reject')}
          >
            신청 반려
          </CmsButton>
          {row.tempAssignmentStatus === 'evaluation_pending' ? (
            <CmsButton
              type="button"
              variant="delete"
              size="large"
              className="cms-button--action"
              width={CMS_ACTION_BUTTON_WIDTH}
              loading={actionLoading}
              onClick={() => setPendingTempKind('temp_reject')}
            >
              임시 반려
            </CmsButton>
          ) : null}
          {row.tempAssignmentStatus === 'temp_assigned' ? (
            <CmsButton
              type="button"
              variant="delete"
              size="large"
              className="cms-button--action"
              width={180}
              loading={actionLoading}
              onClick={() => setPendingTempKind('temp_assign_cancel')}
            >
              임시 배정 취소
            </CmsButton>
          ) : null}
          {row.tempAssignmentStatus === 'temp_rejected' ? (
            <CmsButton
              type="button"
              variant="delete"
              size="large"
              className="cms-button--action"
              width={180}
              loading={actionLoading}
              onClick={() => setPendingTempKind('temp_reject_cancel')}
            >
              임시 반려 취소
            </CmsButton>
          ) : null}
          {row.tempAssignmentStatus === 'evaluation_pending' ||
          workflow.primaryAction === 'final_approve' ||
          workflow.primaryAction === 'open_schedule_assign' ? (
            <CmsButton
              type="button"
              variant="secondary"
              size="large"
              className="cms-button--action"
              width={CMS_ACTION_BUTTON_WIDTH}
              loading={actionLoading}
              disabled={!workflowReady || workflow.primaryDisabled}
              onClick={handlePrimaryAction}
            >
              {workflow.primaryAction === 'open_schedule_assign' ? '임시 배정' : workflow.primaryLabel}
            </CmsButton>
          ) : null}
          </>
          ) : null}
          <PersonalInfoRevealButton disabled={programPrivacyPending}
            labelMode="stickyReveal"
            revealed={personalInfoRevealed}
            cmsVariant="primary"
            cmsSize="large"
            width={180}
            onClick={openPersonalInfoRevealConfirm}
          />
        </Space>
      </div>

      <UjatInstitutionApplicationDetailView
        detail={detail}
        personalInfoRevealed={personalInfoRevealed}
      />
      {confirmModal}
      {pendingAction ? (
        <UjatInstitutionApplicationActionModal
          open
          action={pendingAction}
          variant="single"
          institutionName={row.institutionName}
          selectionCount={1}
          confirmLoading={actionLoading}
          onCancel={() => setPendingAction(null)}
          onConfirm={handleActionConfirm}
        />
      ) : null}
      {pendingTempKind ? (
        <TemporaryActionModal
          open
          kind={pendingTempKind}
          institutionNames={[row.institutionName]}
          loading={actionLoading}
          onCancel={closeTempModal}
          onConfirm={handleTempActionConfirm}
        />
      ) : null}
    </div>
  )
}
