import { formatModalBracketedSubjectName } from '@/features/program/general/lib/modal-message-subject'
import {
  PermissionModal,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import '@/features/program/shared/ui/detail-modal/components/instructor-bulk-approve-modal.css'

export type GeneralVolunteerDocumentApproveModalProps = {
  open: boolean
  volunteerName: string
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
}

export function buildGeneralVolunteerDocumentApproveMessage(volunteerName: string): string {
  const subject = formatModalBracketedSubjectName(volunteerName, '봉사자')
  return `${subject} 봉사자의 1차 서류 합격을 승인하시겠습니까?\n승인 시 봉사자에게 합격 알림이 발송됩니다.`
}

export function GeneralVolunteerDocumentApproveModal({
  open,
  volunteerName,
  onCancel,
  onConfirm,
  zIndex,
}: GeneralVolunteerDocumentApproveModalProps) {
  return (
    <PermissionModal
      open={open}
      variant="approve"
      className="general-volunteer-document-approve-modal"
      title="봉사자 1차 승인 안내"
      message={buildGeneralVolunteerDocumentApproveMessage(volunteerName)}
      confirmLabel="승인"
      onCancel={onCancel}
      onConfirm={onConfirm}
      zIndex={zIndex}
    />
  )
}
