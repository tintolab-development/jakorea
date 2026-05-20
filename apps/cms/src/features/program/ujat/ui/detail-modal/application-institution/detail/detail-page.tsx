import { useCallback, useMemo, useState } from 'react'
import { Space } from 'antd'
import { useCmsAlert } from '@/shared/ui'
import { CmsButton } from '@/shared/ui'
import {
  getUjatInstitutionApplicationDetail,
  getUjatInstitutionApplicationRowById,
  patchUjatInstitutionApplicationRows,
} from '@/data/mock/ujat-institution-application-mock'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import type { UjatInstitutionTempAssignmentStatus } from '../list/types'
import { UjatInstitutionApplicationDetailView } from './detail-view'
import {
  UjatInstitutionApplicationActionModal,
  type UjatInstitutionApplicationBulkModalAction,
} from '../list/action-modal'
import {
  getUjatInstitutionTempAssignCompleteContent,
  UJAT_INSTITUTION_TEMP_ASSIGN_ALERT_TITLE,
} from '../list/temp-assign-complete'

const TEMP_REJECT_BUTTON_STYLE = {
  borderColor: '#e07a96',
  color: '#e07a96',
} as const

export function UjatInstitutionApplicationDetailPage({
  institutionId,
  onBack,
  onStatusUpdated,
}: {
  institutionId: string
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
    useState<UjatInstitutionApplicationBulkModalAction | null>(null)

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
    patchUjatInstitutionApplicationRows([row.id], 'temp_assigned')
    onStatusUpdated()
    onBack()
    showAlert({
      title: UJAT_INSTITUTION_TEMP_ASSIGN_ALERT_TITLE,
      content: getUjatInstitutionTempAssignCompleteContent(1),
    })
  }, [row, onStatusUpdated, onBack, showAlert])

  const handleActionConfirm = () => {
    if (!pendingAction) return
    const statusMap = {
      application_reject: 'application_rejected',
      temp_reject: 'temp_rejected',
    } as const
    patchStatus(statusMap[pendingAction])
    setPendingAction(null)
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
            width={160}
            onClick={() => setPendingAction('application_reject')}
          >
            신청 반려
          </CmsButton>
          <CmsButton
            type="button"
            variant="delete"
            size="large"
            width={160}
            style={TEMP_REJECT_BUTTON_STYLE}
            onClick={() => setPendingAction('temp_reject')}
          >
            임시 반려
          </CmsButton>
          <CmsButton type="button" variant="secondary" size="large" width={160} onClick={handleTempAssign}>
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
