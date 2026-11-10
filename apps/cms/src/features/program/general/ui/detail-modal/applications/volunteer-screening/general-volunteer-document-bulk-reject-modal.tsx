import {
  PermissionModal,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import '@/features/program/shared/ui/detail-modal/components/instructor-bulk-approve-modal.css'

export type GeneralVolunteerDocumentBulkRejectModalProps = {
  open: boolean
  /** 첫 번째 선택자 이름 — `[이름] 님 외 N명` */
  subjectName?: string
  selectionCount: number
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
}

/** 시안 03-1(9756:67380). 반려 사유는 API(FAIL) 필수라 입력란은 유지한다. */
export function buildGeneralVolunteerDocumentBulkRejectMessage(
  selectionCount: number,
  subjectName = ''
): string {
  const name = subjectName.trim() || '회원'
  const rest = Math.max(0, selectionCount - 1)
  return `**[${name}] 님 외 ${rest}명**의 1차 서류를 반려하시겠습니까?\n반려 시 회원에게 반려 알림이 발송됩니다.`
}

export function GeneralVolunteerDocumentBulkRejectModal({
  open,
  subjectName = '',
  selectionCount,
  onCancel,
  onConfirm,
  zIndex,
}: GeneralVolunteerDocumentBulkRejectModalProps) {
  return (
    <PermissionModal
      open={open}
      variant="reject"
      className="general-volunteer-document-bulk-reject-modal instructor-bulk-reject-modal"
      title="1차 서류 일괄 반려 안내"
      message={buildGeneralVolunteerDocumentBulkRejectMessage(selectionCount, subjectName)}
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
