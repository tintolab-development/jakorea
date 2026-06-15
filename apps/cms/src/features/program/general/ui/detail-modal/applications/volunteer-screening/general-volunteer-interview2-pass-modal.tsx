import { formatModalBracketedSubjectName } from '@/features/program/general/lib/modal-message-subject'
import {
  PermissionModal,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import '@/features/program/shared/ui/detail-modal/components/instructor-bulk-approve-modal.css'

export type GeneralVolunteerInterview2PassModalProps = {
  open: boolean
  volunteerName: string
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
}

export function buildGeneralVolunteerInterview2PassMessage(volunteerName: string): string {
  const subject = formatModalBracketedSubjectName(volunteerName, '봉사자')
  return `${subject} 봉사자의 면접 심사를 합격 처리하시겠습니까?\n합격 시 봉사자에게 승인 알림이 발송됩니다.`
}

export function GeneralVolunteerInterview2PassModal({
  open,
  volunteerName,
  onCancel,
  onConfirm,
  zIndex,
}: GeneralVolunteerInterview2PassModalProps) {
  return (
    <PermissionModal
      open={open}
      variant="approve"
      className="general-volunteer-interview2-pass-modal"
      title="봉사자 면접 합격 안내"
      message={buildGeneralVolunteerInterview2PassMessage(volunteerName)}
      confirmLabel="합격"
      onCancel={onCancel}
      onConfirm={onConfirm}
      zIndex={zIndex}
    />
  )
}
