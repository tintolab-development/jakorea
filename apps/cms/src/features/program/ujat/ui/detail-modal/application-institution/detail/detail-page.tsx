import { useCallback, useMemo, useState } from 'react'
import { Space } from 'antd'
import { useCmsAlert } from '@/shared/ui'
import { CmsButton, CMS_ACTION_BUTTON_WIDTH } from '@/shared/ui'
import {
  getUjatInstitutionApplicationDetail,
  getUjatInstitutionApplicationMockRows,
  getUjatInstitutionApplicationRowById,
  patchUjatInstitutionApplicationRows,
} from '@/data/mock/ujat-institution-application-mock'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import type { UjatInstitutionTempAssignmentStatus } from '../list/types'
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
import { rejectUjatOrganizationApplicationsIfRemote } from '@/features/program/ujat/api/temporary-rejections'
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
  const row = useMemo(
    () => getUjatInstitutionApplicationRowById(institutionId),
    [institutionId]
  )

  const detail = useMemo(() => (row ? getUjatInstitutionApplicationDetail(row) : null), [row])

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

  const patchStatus = useCallback(
    (status: UjatInstitutionTempAssignmentStatus) => {
      if (!row) return
      patchUjatInstitutionApplicationRows([row.id], status)
      onStatusUpdated()
      onBack()
    },
    [row, onStatusUpdated, onBack]
  )

  const handleTempAssign = useCallback(() => {
    if (!row) return
    const rowsAfterAssign = getUjatInstitutionApplicationMockRows().map(item =>
      item.id === row.id ? { ...item, tempAssignmentStatus: 'temp_assigned' as const } : item
    )
    patchUjatInstitutionApplicationRows([row.id], 'temp_assigned')
    onStatusUpdated()
    onBack()

    const capacityCheck = checkUjatRegionClassCapacityExceeded({
      regionKey: row.regionKey,
      rowsAfterAssign,
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
  }, [row, onStatusUpdated, onBack, showAlert])

  const handleActionConfirm = (payload: PermissionModalPayload) => {
    if (!pendingAction || !row) return
    const statusMap = {
      application_reject: 'application_rejected',
      temp_reject: 'temp_rejected',
    } as const
    void (async () => {
      try {
        if (pendingAction === 'temp_reject') {
          await rejectUjatOrganizationApplicationsIfRemote({
            programId,
            applicationIds: [row.id],
            reason: payload.reason ?? 'CMS UJAT 신청기관 임시 반려',
          })
        }
        patchStatus(statusMap[pendingAction])
        setPendingAction(null)
      } catch (error) {
        showAlert({
          title: '안내',
          content:
            error instanceof Error ? error.message : '신청기관 임시 반려에 실패했습니다.',
        })
      }
    })()
  }

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
            className="cms-button--action"
            width={CMS_ACTION_BUTTON_WIDTH}
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
