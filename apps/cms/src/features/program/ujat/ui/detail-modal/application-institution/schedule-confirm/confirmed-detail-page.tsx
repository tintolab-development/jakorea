import { useCallback, useMemo, useState } from 'react'
import { Space } from 'antd'
import { CmsButton, useCmsAlert } from '@/shared/ui'
import {
  getUjatInstitutionApplicationRowById,
  getUjatInstitutionScheduleConfirmStatus,
  patchUjatInstitutionScheduleConfirmStatus,
} from '@/data/mock/ujat-institution-application-mock'
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
  getUjatInstitutionScheduleConfirmAssignedInstructorCount,
  UJAT_INSTITUTION_SCHEDULE_CONFIRM_APPROVE_ALERT_TITLE,
} from './institution-approve-complete'

const APPROVE_BUTTON_STYLE = {
  borderColor: 'var(--color-primary, #00a9a5)',
  color: 'var(--color-primary, #00a9a5)',
} as const

export function UjatInstitutionScheduleConfirmConfirmedDetailPage({
  institutionId,
  onBack,
  onStatusUpdated,
}: {
  institutionId: string
  onBack: () => void
  onStatusUpdated: () => void
}) {
  const { showAlert } = useCmsAlert()
  const [pendingReject, setPendingReject] = useState(false)
  const [pendingApprove, setPendingApprove] = useState(false)
  const [statusRefreshTick, setStatusRefreshTick] = useState(0)

  const row = useMemo(
    () => getUjatInstitutionApplicationRowById(institutionId),
    [institutionId]
  )

  const detail = useMemo(
    () => buildUjatScheduleConfirmConfirmedDetail(institutionId),
    [institutionId, statusRefreshTick]
  )

  const scheduleConfirmStatus = useMemo(
    () => getUjatInstitutionScheduleConfirmStatus(institutionId),
    [institutionId, statusRefreshTick]
  )

  const showGuidanceNotes = shouldShowScheduleConfirmGuidanceNotes(scheduleConfirmStatus)

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
    if (!row) return
    patchUjatInstitutionScheduleConfirmStatus([row.id], 'approval_completed')
    setStatusRefreshTick(t => t + 1)
    onStatusUpdated()
    setPendingApprove(false)
    const assignedCount = getUjatInstitutionScheduleConfirmAssignedInstructorCount(row.id)
    showAlert({
      title: UJAT_INSTITUTION_SCHEDULE_CONFIRM_APPROVE_ALERT_TITLE,
      content: getUjatInstitutionScheduleConfirmApproveCompleteContent(
        row.institutionName,
        assignedCount
      ),
    })
  }, [row, onStatusUpdated, showAlert])

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
            width={140}
            style={APPROVE_BUTTON_STYLE}
            onClick={() => setPendingApprove(true)}
          >
            신청 승인
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
    </div>
  )
}
