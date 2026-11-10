import {
  buildInstitutionCancelRejectionMessage,
  resolveInstitutionCancelRejectionModalTitle,
  resolveInstitutionCancelRejectionNotifyVariant,
  type InstitutionCancelRejectionConfirmPayload,
  type InstitutionCancelRejectionCopyVariant,
  type InstitutionCancelRejectionNotifyVariant,
} from '@/features/program/general/lib/institution-cancel-rejection'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import {
  PermissionModal,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
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
  /** 기본 `default`(1사1교 등 기존). `general-organization`: 일반(기관형) 시안 제목·본문·필드 순서 */
  copyVariant?: InstitutionCancelRejectionCopyVariant
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
  copyVariant,
}: {
  open: boolean
  schoolName: string
  onCancel: () => void
  onConfirm: () => void
  zIndex?: number
  copyVariant: InstitutionCancelRejectionCopyVariant
}) {
  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title={resolveInstitutionCancelRejectionModalTitle(copyVariant)}
      width={MODAL_WIDTH}
      zIndex={zIndex}
      className="institution-cancel-reject-modal"
      description={buildInstitutionCancelRejectionMessage(
        schoolName,
        'pendingNotification',
        copyVariant
      )}
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

function InstitutionCancelRejectAlreadySentModal({
  open,
  schoolName,
  onCancel,
  onConfirm,
  zIndex = MODAL_Z_INDEX,
  copyVariant,
}: {
  open: boolean
  schoolName: string
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
  copyVariant: InstitutionCancelRejectionCopyVariant
}) {
  /** 일반(기관형) 시안 04-2: 취소 사유 → 알림 발송 순서, placeholder 마침표 없음 */
  const isGeneralOrganization = copyVariant === 'general-organization'
  return (
    <PermissionModal
      open={open}
      variant="reject"
      className="institution-cancel-reject-modal"
      title={resolveInstitutionCancelRejectionModalTitle(copyVariant)}
      message={buildInstitutionCancelRejectionMessage(schoolName, 'alreadySent', copyVariant)}
      confirmLabel="반려 취소"
      confirmVariant="delete"
      requireReason
      reasonLabel="취소 사유"
      reasonPlaceholder={
        isGeneralOrganization ? '취소 사유를 입력해 주세요' : '취소 사유를 입력해 주세요.'
      }
      reasonRequiredMessage="취소 사유를 입력해 주세요."
      // cancel-rejection API는 IMMEDIATE | SCHEDULED만 받아 「발표일에 맞춰서」는 노출하지 않는다.
      notifyTimingOptions="two"
      notifyBeforeReason={!isGeneralOrganization}
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
  copyVariant = 'default',
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
        copyVariant={copyVariant}
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
      copyVariant={copyVariant}
    />
  )
}
