import { useMemo, useState } from 'react'
import { Space } from 'antd'
import { AppButton } from '@/shared/ui/app-button'
import {
  getUjatInstitutionApplicationDetail,
  getUjatInstitutionApplicationMockRows,
  patchUjatInstitutionApplicationRows,
} from '@/data/mock/ujat-institution-application-mock'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import type { UjatInstitutionTempAssignmentStatus } from './ujat-institution-application-types'
import { UjatInstitutionApplicationDetailView } from './ujat-institution-application-detail-view'
import {
  UjatInstitutionApplicationActionModal,
  type UjatInstitutionApplicationBulkModalAction,
} from './ujat-institution-application-action-modal'

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
  const row = useMemo(
    () => getUjatInstitutionApplicationMockRows().find(r => r.id === institutionId) ?? null,
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

  const patchStatus = (status: UjatInstitutionTempAssignmentStatus) => {
    if (!row) return
    patchUjatInstitutionApplicationRows([row.id], status)
    onStatusUpdated()
    onBack()
  }

  const handleActionConfirm = () => {
    if (!pendingAction) return
    const statusMap = {
      application_reject: 'application_rejected',
      temp_reject: 'temp_rejected',
      temp_assign: 'temp_assigned',
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
          <AppButton
            variant="danger"
            size="filter"
            onClick={() => setPendingAction('application_reject')}
          >
            신청 반려
          </AppButton>
          <AppButton
            variant="danger"
            size="filter"
            style={TEMP_REJECT_BUTTON_STYLE}
            onClick={() => setPendingAction('temp_reject')}
          >
            임시 반려
          </AppButton>
          <AppButton variant="cancel" size="filter" onClick={() => setPendingAction('temp_assign')}>
            임시 배정
          </AppButton>
          <PersonalInfoRevealButton
            ui="app"
            labelMode="stickyReveal"
            revealed={personalInfoRevealed}
            variant="primary"
            size="filter-wide"
            modalTeal
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
