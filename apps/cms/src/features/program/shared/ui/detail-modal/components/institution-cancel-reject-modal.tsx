import {
  buildInstitutionCancelRejectionMessage,
  resolveInstitutionCancelRejectionNotifyVariant,
  type InstitutionCancelRejectionConfirmPayload,
  type InstitutionCancelRejectionNotifyVariant,
} from '@/features/program/general/lib/institution-cancel-rejection'
import type { ApplicantSchoolRow } from '@/data/mock/applicant-institutions'
import {
  PermissionModal,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton, CMS_ACTION_BUTTON_WIDTH } from '@/shared/ui/cms-button'
import './instructor-bulk-approve-modal.css'
import './instructor-cancel-reject-modal.css'

const MODAL_WIDTH = 600
const MODAL_Z_INDEX = 2500

export type { InstitutionCancelRejectionConfirmPayload }

export type InstitutionCancelRejectModalProps = {
  open: boolean
  institution: ApplicantSchoolRow | null
  onCancel: () => void
  onConfirm: (payload: InstitutionCancelRejectionConfirmPayload) => void
  zIndex?: number
}

export function resolveInstitutionCancelRejectionNotifyVariantFromRow(
  institution: ApplicantSchoolRow | null
): InstitutionCancelRejectionNotifyVariant {
  if (!institution) return 'pendingNotification'
  return resolveInstitutionCancelRejectionNotifyVariant(institution)
}

function InstitutionCancelRejectPendingNotificationModal({
  open,
  schoolName,
  onCancel,
  onConfirm,
  zIndex = MODAL_Z_INDEX,
}: {
  open: boolean
  schoolName: string
  onCancel: () => void
  onConfirm: () => void
  zIndex?: number
}) {
  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="기관 반려 취소 안내"
      width={MODAL_WIDTH}
      zIndex={zIndex}
      className="institution-cancel-reject-modal"
      description={buildInstitutionCancelRejectionMessage(schoolName, 'pendingNotification')}
      footer={
        <>
          <CmsButton
            variant="secondary"
            size="large"
            className="cms-button--action"
            width={CMS_ACTION_BUTTON_WIDTH}
            type="button"
            onClick={onCancel}
          >
            취소
          </CmsButton>
          <CmsButton
            variant="delete"
            size="large"
            className="cms-button--action"
            width={CMS_ACTION_BUTTON_WIDTH}
            type="button"
            onClick={onConfirm}
          >
            반려 취소
          </CmsButton>
        </>
      }
    >
      {null}
    </ContentModal>
  )
}

function InstitutionCancelRejectAlreadySentModal({
  open,
  schoolName,
  onCancel,
  onConfirm,
  zIndex = MODAL_Z_INDEX,
}: {
  open: boolean
  schoolName: string
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
}) {
  return (
    <PermissionModal
      open={open}
      variant="reject"
      className="institution-cancel-reject-modal"
      title="기관 반려 취소 안내"
      message={buildInstitutionCancelRejectionMessage(schoolName, 'alreadySent')}
      confirmLabel="반려 취소"
      confirmVariant="delete"
      requireReason
      reasonLabel="취소 사유"
      reasonPlaceholder="취소 사유를 입력해 주세요."
      reasonRequiredMessage="취소 사유를 입력해 주세요."
      notifyTimingOptions="two"
      notifyBeforeReason
      onCancel={onCancel}
      onConfirm={onConfirm}
      zIndex={zIndex}
    />
  )
}

export function InstitutionCancelRejectModal({
  open,
  institution,
  onCancel,
  onConfirm,
  zIndex = MODAL_Z_INDEX,
}: InstitutionCancelRejectModalProps) {
  const variant = resolveInstitutionCancelRejectionNotifyVariantFromRow(institution)
  const schoolName = institution?.schoolName ?? ''

  if (variant === 'pendingNotification') {
    return (
      <InstitutionCancelRejectPendingNotificationModal
        open={open}
        schoolName={schoolName}
        onCancel={onCancel}
        onConfirm={() => onConfirm({ variant: 'pendingNotification' })}
        zIndex={zIndex}
      />
    )
  }

  return (
    <InstitutionCancelRejectAlreadySentModal
      open={open}
      schoolName={schoolName}
      onCancel={onCancel}
      onConfirm={payload => {
        onConfirm({
          variant: 'alreadySent',
          reason: payload.reason,
          notifyTiming: payload.notifyTiming,
          manualNotifyAt: payload.manualNotifyAt,
        })
      }}
      zIndex={zIndex}
    />
  )
}
