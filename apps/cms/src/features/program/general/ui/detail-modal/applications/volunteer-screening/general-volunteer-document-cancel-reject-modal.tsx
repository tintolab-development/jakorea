import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'
import {
  buildVolunteerDocumentCancelRejectionMessage,
  buildVolunteerDocumentScreeningCancelRejectionMessage,
  resolveVolunteerDocumentCancelRejectionNotifyVariant,
  type VolunteerDocumentCancelRejectionConfirmPayload,
  type VolunteerDocumentCancelRejectionNotifyVariant,
} from '@/features/program/general/lib/volunteer-document-cancel-rejection'
import {
  PermissionModal,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import '@/features/program/shared/ui/detail-modal/components/instructor-bulk-approve-modal.css'
import '@/features/program/shared/ui/detail-modal/components/instructor-cancel-reject-modal.css'

const MODAL_WIDTH = 600
const MODAL_Z_INDEX = 2500

export type { VolunteerDocumentCancelRejectionConfirmPayload }

/**
 * application: 면접 없음 — 프로그램 참여 반려 취소(강사 신청 프로세스) · 기본값
 * document: 면접 있음 — 1차 서류 반려 취소 시안 04-1(9781:54768)
 */
export type GeneralVolunteerDocumentCancelRejectCopyPreset = 'application' | 'document'

export type GeneralVolunteerDocumentCancelRejectModalProps = {
  open: boolean
  copyPreset?: GeneralVolunteerDocumentCancelRejectCopyPreset
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
  copyPreset,
  volunteerName,
  onCancel,
  onConfirm,
  zIndex = MODAL_Z_INDEX,
}: {
  open: boolean
  copyPreset: GeneralVolunteerDocumentCancelRejectCopyPreset
  volunteerName: string
  onCancel: () => void
  onConfirm: () => void
  zIndex?: number
}) {
  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title={resolveCancelRejectTitle(copyPreset)}
      width={MODAL_WIDTH}
      zIndex={zIndex}
      className="general-volunteer-document-cancel-reject-modal instructor-cancel-reject-modal"
      description={
        copyPreset === 'document'
          ? buildVolunteerDocumentScreeningCancelRejectionMessage(
              volunteerName,
              'pendingNotification'
            )
          : buildVolunteerDocumentCancelRejectionMessage(volunteerName, 'pendingNotification')
      }
      footer={
        <>
          <CmsButton
            variant="secondary"
            size="large"
            type="button"
            onClick={onCancel} >
            취소
          </CmsButton>
          <CmsButton
            variant="delete"
            size="large"
            type="button"
            onClick={onConfirm} >
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
  copyPreset,
  volunteerName,
  onCancel,
  onConfirm,
  zIndex = MODAL_Z_INDEX,
}: {
  open: boolean
  copyPreset: GeneralVolunteerDocumentCancelRejectCopyPreset
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
      title={resolveCancelRejectTitle(copyPreset)}
      message={
        copyPreset === 'document'
          ? buildVolunteerDocumentScreeningCancelRejectionMessage(volunteerName, 'alreadySent')
          : buildVolunteerDocumentCancelRejectionMessage(volunteerName, 'alreadySent')
      }
      confirmLabel="반려 취소"
      confirmVariant="delete"
      requireReason
      reasonLabel="취소 사유"
      reasonPlaceholder="취소 사유를 입력해 주세요."
      reasonRequiredMessage="취소 사유를 입력해 주세요."
      notifyTimingOptions={copyPreset === 'document' ? 'three' : 'two'}
      notifyBeforeReason={copyPreset !== 'document'}
      onCancel={onCancel}
      onConfirm={onConfirm}
      zIndex={zIndex}
    />
  )
}

function resolveCancelRejectTitle(copyPreset: GeneralVolunteerDocumentCancelRejectCopyPreset): string {
  return copyPreset === 'document' ? '1차 서류 반려 취소 안내' : '봉사자 1차 서류 반려 취소 안내'
}

export function GeneralVolunteerDocumentCancelRejectModal({
  open,
  copyPreset = 'application',
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
        copyPreset={copyPreset}
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
      copyPreset={copyPreset}
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
