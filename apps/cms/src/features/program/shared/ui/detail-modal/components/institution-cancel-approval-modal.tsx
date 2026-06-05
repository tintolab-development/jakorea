import {
  buildInstitutionCancelApprovalMessage,
  resolveInstitutionCancelApprovalNotifyVariant,
  resolveInstitutionCancelApprovalReasonLabel,
  type InstitutionCancelApprovalNotifyVariant,
} from '@/features/program/general/lib/institution-cancel-approval'
import type { ApplicantSchoolRow } from '@/data/mock/applicant-institutions'
import {
  PermissionModal,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import './instructor-bulk-approve-modal.css'

export type InstitutionCancelApprovalModalProps = {
  open: boolean
  institution: ApplicantSchoolRow | null
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
}

export function resolveInstitutionCancelApprovalNotifyVariantFromRow(
  institution: ApplicantSchoolRow | null
): InstitutionCancelApprovalNotifyVariant {
  if (!institution) return 'alreadySent'
  return resolveInstitutionCancelApprovalNotifyVariant(institution)
}

export function InstitutionCancelApprovalModal({
  open,
  institution,
  onCancel,
  onConfirm,
  zIndex,
}: InstitutionCancelApprovalModalProps) {
  const variant = resolveInstitutionCancelApprovalNotifyVariantFromRow(institution)
  const schoolName = institution?.schoolName ?? ''

  return (
    <PermissionModal
      open={open}
      variant="reject"
      className="institution-cancel-approval-modal"
      title="기관 승인 취소 안내"
      message={buildInstitutionCancelApprovalMessage(schoolName, variant)}
      confirmLabel="승인 취소"
      confirmVariant="delete"
      requireReason
      reasonLabel={resolveInstitutionCancelApprovalReasonLabel(variant)}
      reasonPlaceholder="취소 사유를 입력해 주세요."
      reasonRequiredMessage="취소 사유를 입력해 주세요."
      notifyTimingOptions={variant === 'alreadySent' ? 'two' : 'three'}
      notifyBeforeReason
      onCancel={onCancel}
      onConfirm={onConfirm}
      zIndex={zIndex}
    />
  )
}
