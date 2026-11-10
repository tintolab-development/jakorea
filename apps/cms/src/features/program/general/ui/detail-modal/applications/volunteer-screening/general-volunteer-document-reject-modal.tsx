import { formatModalBracketedSubjectName } from '@/features/program/general/lib/modal-message-subject'
import {
  PermissionModal,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import '@/features/program/shared/ui/detail-modal/components/instructor-bulk-approve-modal.css'

export type GeneralVolunteerDocumentRejectModalProps = {
  open: boolean
  volunteerName: string
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
}

export function buildGeneralVolunteerDocumentRejectMessage(volunteerName: string): string {
  const subject = formatModalBracketedSubjectName(volunteerName, '회원')
  // 시안 03-1(9756:67058). 반려 사유는 API(FAIL) 필수라 입력란은 유지한다.
  return `${subject} 님의 1차 서류를 반려하시겠습니까?\n반려 시 회원에게 반려 알림이 발송됩니다.`
}

export function GeneralVolunteerDocumentRejectModal({
  open,
  volunteerName,
  onCancel,
  onConfirm,
  zIndex,
}: GeneralVolunteerDocumentRejectModalProps) {
  return (
    <PermissionModal
      open={open}
      variant="reject"
      className="general-volunteer-document-reject-modal"
      title="1차 서류 반려 안내"
      message={buildGeneralVolunteerDocumentRejectMessage(volunteerName)}
      confirmLabel="반려"
      confirmVariant="delete"
      requireReason
      reasonLabel="반려 사유"
      reasonPlaceholder="반려 사유를 입력해 주세요."
      reasonRequiredMessage="반려 사유를 입력해 주세요."
      onCancel={onCancel}
      onConfirm={onConfirm}
      zIndex={zIndex}
    />
  )
}
