import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import {
  buildVolunteerDocumentCancelRejectionMessage,
  resolveVolunteerDocumentCancelRejectionNotifyVariant,
  type VolunteerDocumentCancelRejectionConfirmPayload,
  type VolunteerDocumentCancelRejectionNotifyVariant,
} from '@/features/program/general/lib/volunteer-document-cancel-rejection'
import {
  PermissionModal,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton, CMS_ACTION_BUTTON_WIDTH } from '@/shared/ui/cms-button'
import '@/features/program/shared/ui/detail-modal/components/instructor-bulk-approve-modal.css'
import '@/features/program/shared/ui/detail-modal/components/instructor-cancel-reject-modal.css'

const MODAL_WIDTH = 600
const MODAL_Z_INDEX = 2500

export type { VolunteerDocumentCancelRejectionConfirmPayload }

export type GeneralVolunteerDocumentCancelRejectModalProps = {
  open: boolean
  volunteer: GeneralVolunteerApplicantRow | null
  onCancel: () => void
  onConfirm: (payload: VolunteerDocumentCancelRejectionConfirmPayload) => void
  zIndex?: number
}

export function resolveVolunteerDocumentCancelRejectionNotifyVariantFromRow(
  volunteer: GeneralVolunteerApplicantRow | null
): VolunteerDocumentCancelRejectionNotifyVariant {
  if (!volunteer) return 'pendingNotification'
  return resolveVolunteerDocumentCancelRejectionNotifyVariant(volunteer)
}

function VolunteerDocumentCancelRejectPendingNotificationModal({
  open,
  volunteerName,
  onCancel,
  onConfirm,
  zIndex = MODAL_Z_INDEX,
}: {
  open: boolean
  volunteerName: string
  onCancel: () => void
  onConfirm: () => void
  zIndex?: number
}) {
  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="봉사자 1차 반려 취소 안내"
      width={MODAL_WIDTH}
      zIndex={zIndex}
      className="general-volunteer-document-cancel-reject-modal instructor-cancel-reject-modal"
      description={buildVolunteerDocumentCancelRejectionMessage(
        volunteerName,
        'pendingNotification'
      )}
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

function VolunteerDocumentCancelRejectAlreadySentModal({
  open,
  volunteerName,
  onCancel,
  onConfirm,
  zIndex = MODAL_Z_INDEX,
}: {
  open: boolean
  volunteerName: string
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
}) {
  return (
    <PermissionModal
      open={open}
      variant="reject"
      className="general-volunteer-document-cancel-reject-modal instructor-cancel-reject-modal"
      title="봉사자 1차 반려 취소 안내"
      message={buildVolunteerDocumentCancelRejectionMessage(volunteerName, 'alreadySent')}
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

export function GeneralVolunteerDocumentCancelRejectModal({
  open,
  volunteer,
  onCancel,
  onConfirm,
  zIndex = MODAL_Z_INDEX,
}: GeneralVolunteerDocumentCancelRejectModalProps) {
  const variant = resolveVolunteerDocumentCancelRejectionNotifyVariantFromRow(volunteer)
  const volunteerName = volunteer?.name ?? ''

  if (variant === 'pendingNotification') {
    return (
      <VolunteerDocumentCancelRejectPendingNotificationModal
        open={open}
        volunteerName={volunteerName}
        onCancel={onCancel}
        onConfirm={() => onConfirm({ variant: 'pendingNotification' })}
        zIndex={zIndex}
      />
    )
  }

  return (
    <VolunteerDocumentCancelRejectAlreadySentModal
      open={open}
      volunteerName={volunteerName}
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
