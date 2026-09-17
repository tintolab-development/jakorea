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
  type UjatInstitutionApplicationRejectModalAction,
} from '../list/action-modal'
import {
  getUjatInstitutionTempAssignCompleteContent,
  UJAT_INSTITUTION_TEMP_ASSIGN_ALERT_TITLE,
} from '../list/temp-assign-complete'
import {
  checkUjatRegionClassCapacityExceeded,
  getUjatRegionClassCapacityExceededAlertContent,
} from '@/features/program/ujat/lib/ujat-region-capacity-institution-assign'
import type { PermissionModalPayload } from '@/shared/components/permission-modal'

const TEMP_REJECT_BUTTON_STYLE = {
  borderColor: '#e07a96',
  color: '#e07a96',
} as const

export function UjatInstitutionApplicationDetailPage({
  institutionId,
  programId,
  onBack,
  onStatusUpdated,
}: {
  institutionId: string
  programId?: string | null
  onBack: () => void
  onStatusUpdated: () => void
}) {
  const { showAlert } = useCmsAlert()
  const {
    row,
    detail,
    loading,
    approveRemote,
    rejectRemote,
    tempRejectRemote,
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

  const [pendingAction, setPendingAction] =
    useState<UjatInstitutionApplicationRejectModalAction | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const handleTempAssign = useCallback(() => {
    if (!row) return
    void (async () => {
      setActionLoading(true)
      try {
        await approveRemote()
        onStatusUpdated()
        onBack()
        const capacityCheck = checkUjatRegionClassCapacityExceeded({
          regionKey: row.regionKey,
          rowsAfterAssign: [{ ...row, tempAssignmentStatus: 'temp_assigned' }],
        })
        const completeContent = getUjatInstitutionTempAssignCompleteContent(1)
        const content =
          capacityCheck.exceeded && capacityCheck.maxClassCount != null
            ? `${completeContent}\n\n${getUjatRegionClassCapacityExceededAlertContent({
                regionLabel: capacityCheck.regionLabel,
                maxClassCount: capacityCheck.maxClassCount,
                totalAfterAssign: capacityCheck.totalAfterAssign,
              })}`
            : completeContent
        showAlert({
          title: UJAT_INSTITUTION_TEMP_ASSIGN_ALERT_TITLE,
          content,
        })
      } catch (error) {
        showAlert({
          title: '안내',
          content: error instanceof Error ? error.message : '임시 배정(승인)에 실패했습니다.',
        })
      } finally {
        setActionLoading(false)
      }
    })()
  }, [approveRemote, onBack, onStatusUpdated, row, showAlert])

  const handleActionConfirm = (payload: PermissionModalPayload) => {
    if (!pendingAction || !row) return
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
          content:
            error instanceof Error ? error.message : '신청기관 반려 처리에 실패했습니다.',
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
            width={CMS_ACTION_BUTTON_WIDTH}
            loading={actionLoading}
            onClick={handleTempAssign}
          >
            임시 배정
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
