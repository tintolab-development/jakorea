import { formatModalBracketedSubjectName } from '@/features/program/general/lib/modal-message-subject'
import {
  PermissionModal,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import '@/features/program/shared/ui/detail-modal/components/instructor-bulk-approve-modal.css'

/** default: 기존(UJAT 재사용) 문구 / general-volunteer: 일반 봉사자 시안 14-1(9781:53528) */
export type GeneralVolunteerInterview2FailCopyPreset = 'default' | 'general-volunteer'

export type GeneralVolunteerInterview2FailModalProps = {
  open: boolean
  copyPreset?: GeneralVolunteerInterview2FailCopyPreset
  volunteerName: string
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
}

export function buildGeneralVolunteerInterview2FailMessage(volunteerName: string): string {
  const subject = formatModalBracketedSubjectName(volunteerName, '봉사자')
  return `${subject} 봉사자의 면접 심사를 불합격 처리하시겠습니까?\n불합격 시 입력하신 불합격 사유가 봉사자에게 전달되며, 알림이 발송됩니다.`
}

/** 시안 14-1 — 불합격 사유는 API(FAIL) 필수라 입력란은 유지한다 */
export function buildGeneralVolunteerInterview2FailSpecMessage(volunteerName: string): string {
  const subject = formatModalBracketedSubjectName(volunteerName, '회원')
  return `${subject} 님의 면접 결과를 불합격 처리하시겠습니까?\n불합격 시 회원에게 불합격 알림이 발송됩니다.`
}

export function GeneralVolunteerInterview2FailModal({
  open,
  copyPreset = 'default',
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
      title={copyPreset === 'general-volunteer' ? '면접 불합격 안내' : '봉사자 면접 불합격 안내'}
      message={
        copyPreset === 'general-volunteer'
          ? buildGeneralVolunteerInterview2FailSpecMessage(volunteerName)
          : buildGeneralVolunteerInterview2FailMessage(volunteerName)
      }
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
