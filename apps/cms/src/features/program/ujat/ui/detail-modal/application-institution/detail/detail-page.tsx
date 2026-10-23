import { useCallback, useState } from 'react'
import { Space, Spin } from 'antd'
import { useCmsAlert } from '@/shared/ui'
import { CmsButton, CMS_ACTION_BUTTON_WIDTH } from '@/shared/ui'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import { useUjatInstitutionApplicationDetail } from '@/features/program/ujat/api/use-institution-application-detail'
import { UjatInstitutionApplicationDetailView } from './detail-view'
import {
  UjatInstitutionApplicationActionModal,
  type UjatInstitutionApplicationModalAction,
} from '../list/action-modal'
import type { PermissionModalPayload } from '@/shared/components/permission-modal'
import { readApiErrorAlertMessage } from '@/shared/lib/extract-api-error-message'

const TEMP_REJECT_BUTTON_STYLE = {
  borderColor: '#e07a96',
  color: '#e07a96',
} as const

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
  const {
    row,
    detail,
    loading,
    approveRemote,
    rejectRemote,
    tempRejectRemote,
    workflow,
    workflowReady,
  } = useUjatInstitutionApplicationDetail({ institutionId, programId })

  const {
    personalInfoRevealed,
    openPersonalInfoRevealConfirm,
    confirmModal,
  } = usePersonalInfoReveal({
    resolveAccessItem: () => row?.institutionName ?? 'UJAT 신청 기관',
    resetDeps: [row?.id],
    controlMode: 'headerStickyNoop',
  })

  const [pendingAction, setPendingAction] = useState<UjatInstitutionApplicationModalAction | null>(
    null
  )
  const [actionLoading, setActionLoading] = useState(false)

  const handlePrimaryAction = useCallback(() => {
    if (!workflowReady || workflow.primaryDisabled) return
    if (workflow.primaryAction === 'open_schedule_assign') {
      onOpenScheduleAssign?.()
      return
    }
    if (workflow.primaryAction === 'final_approve') {
      setPendingAction('application_approve')
    }
  }, [onOpenScheduleAssign, workflow.primaryAction, workflow.primaryDisabled, workflowReady])

  const handleFinalApprove = useCallback(() => {
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
        await approveRemote()
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
  }, [approveRemote, onBack, onStatusUpdated, showAlert, workflow.canFinalApprove])

  const handleActionConfirm = (payload: PermissionModalPayload) => {
    if (!pendingAction || !row) return
    if (pendingAction === 'application_approve') {
      handleFinalApprove()
      return
    }
    void (async () => {
      setActionLoading(true)
      try {
        if (pendingAction === 'temp_reject') {
          await tempRejectRemote(payload.reason ?? 'CMS UJAT 신청기관 임시 반려')
        } else {
          await rejectRemote(payload.reason ?? 'CMS UJAT 신청기관 신청 반려')
        }
        setPendingAction(null)
        onStatusUpdated()
        onBack()
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
      <div
        className="ujat-institution-application-detail-page__actions"
        style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}
      >
        <Space size={8} wrap>
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
          <CmsButton
            type="button"
            variant="delete"
            size="large"
            className="cms-button--action"
            width={CMS_ACTION_BUTTON_WIDTH}
            style={TEMP_REJECT_BUTTON_STYLE}
            loading={actionLoading}
            onClick={() => setPendingAction('temp_reject')}
          >
            임시 반려
          </CmsButton>
          <CmsButton
            type="button"
            variant="secondary"
            size="large"
            className="cms-button--action"
            width={180}
            loading={actionLoading}
            disabled={!workflowReady || workflow.primaryDisabled}
            onClick={handlePrimaryAction}
          >
            {workflow.primaryLabel}
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

      <UjatInstitutionApplicationDetailView
        detail={detail}
        personalInfoRevealed={personalInfoRevealed}
        workflowDisplayLabel={workflow.displayLabel}
      />
      {confirmModal}
      {pendingAction ? (
        <UjatInstitutionApplicationActionModal
          open
          action={pendingAction}
          variant="single"
          institutionName={row.institutionName}
          selectionCount={1}
          onCancel={() => setPendingAction(null)}
          onConfirm={handleActionConfirm}
        />
      ) : null}
    </div>
  )
}
