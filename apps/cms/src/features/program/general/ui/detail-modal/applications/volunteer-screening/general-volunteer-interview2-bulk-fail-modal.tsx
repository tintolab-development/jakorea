import {
  PermissionModal,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import type { GeneralVolunteerInterview2FailCopyPreset } from './general-volunteer-interview2-fail-modal'
import '@/features/program/shared/ui/detail-modal/components/instructor-bulk-approve-modal.css'

export type GeneralVolunteerInterview2BulkFailModalProps = {
  open: boolean
  /** default: 기존(UJAT 재사용) / general-volunteer: 일반 봉사자 시안 11-1(3491:99234) */
  copyPreset?: GeneralVolunteerInterview2FailCopyPreset
  /** general-volunteer 전용 — 첫 번째 선택자 이름 */
  subjectName?: string
  selectionCount: number
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
}

export function buildGeneralVolunteerInterview2BulkFailMessage(selectionCount: number): string {
  return `선택한 **${selectionCount}명**의 모든 봉사자의 면접 심사를 일괄 불합격 처리하시겠습니까?\n불합격 시 입력하신 불합격 사유가 각 봉사자에게 개별로 전달되며, 알림이 발송됩니다.`
}

/** 시안 11-1 — 불합격 사유는 API(FAIL) 필수라 입력란은 유지한다 */
export function buildGeneralVolunteerInterview2BulkFailSpecMessage(
  selectionCount: number,
  subjectName: string
): string {
  const name = subjectName.trim() || '회원'
  const rest = Math.max(0, selectionCount - 1)
  return `**[${name}] 님 외 ${rest}명**의 면접 결과를 불합격 처리하시겠습니까?\n불합격 시 회원에게 불합격 알림이 발송됩니다.`
}

export function GeneralVolunteerInterview2BulkFailModal({
  open,
  copyPreset = 'default',
  subjectName = '',
  selectionCount,
  onCancel,
  onConfirm,
  zIndex,
}: GeneralVolunteerInterview2BulkFailModalProps) {
  return (
    <PermissionModal
      open={open}
      variant="reject"
      className="general-volunteer-interview2-bulk-fail-modal instructor-bulk-reject-modal"
      title={copyPreset === 'general-volunteer' ? '면접 일괄 불합격 안내' : '봉사자 일괄 불합격 안내'}
      message={
        copyPreset === 'general-volunteer'
          ? buildGeneralVolunteerInterview2BulkFailSpecMessage(selectionCount, subjectName)
          : buildGeneralVolunteerInterview2BulkFailMessage(selectionCount)
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
