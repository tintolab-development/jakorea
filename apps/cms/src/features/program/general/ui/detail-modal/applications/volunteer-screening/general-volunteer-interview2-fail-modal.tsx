import { formatModalBracketedSubjectName } from '@/features/program/general/lib/modal-message-subject'
import {
  PermissionModal,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import '@/features/program/shared/ui/detail-modal/components/instructor-bulk-approve-modal.css'

export type GeneralVolunteerInterview2FailModalProps = {
  open: boolean
  volunteerName: string
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
}

export function buildGeneralVolunteerInterview2FailMessage(volunteerName: string): string {
  const subject = formatModalBracketedSubjectName(volunteerName, '봉사자')
  return `${subject} 봉사자의 면접 심사를 불합격 처리하시겠습니까?\n불합격 시 입력하신 불합격 사유가 봉사자에게 전달되며, 알림이 발송됩니다.`
}

export function GeneralVolunteerInterview2FailModal({
  open,
  volunteerName,
  onCancel,
  onConfirm,
  zIndex,
}: GeneralVolunteerInterview2FailModalProps) {
  return (
    <PermissionModal
      open={open}
      variant="reject"
      className="general-volunteer-interview2-fail-modal instructor-bulk-reject-modal"
      title="봉사자 면접 불합격 안내"
      message={buildGeneralVolunteerInterview2FailMessage(volunteerName)}
      confirmLabel="불합격"
      confirmVariant="delete"
      requireReason
      reasonLabel="불합격 사유"
      reasonPlaceholder="불합격 사유를 입력해 주세요."
      reasonRequiredMessage="불합격 사유를 입력해 주세요."
      onCancel={onCancel}
      onConfirm={onConfirm}
      zIndex={zIndex}
    />
  )
}
