import { PermissionModal, type PermissionModalPayload } from '@/shared/components/permission-modal'
import '@/features/program/shared/ui/detail-modal/components/instructor-bulk-approve-modal.css'

export type GeneralVolunteerDocumentBulkApproveModalProps = {
  open: boolean
  /** 첫 번째 선택자 이름 — `[이름] 님 외 N명` */
  subjectName?: string
  selectionCount: number
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
}

/** 시안 04-1(9756:68576) */
export function buildGeneralVolunteerDocumentBulkApproveMessage(
  selectionCount: number,
  subjectName = ''
): string {
  const name = subjectName.trim() || '회원'
  const rest = Math.max(0, selectionCount - 1)
  return `**[${name}] 님 외 ${rest}명**의 1차 서류를 승인하시겠습니까?\n승인 시 회원에게 승인 알림이 발송됩니다.`
}

export function GeneralVolunteerDocumentBulkApproveModal({
  open,
  subjectName = '',
  selectionCount,
  onCancel,
  onConfirm,
  zIndex,
}: GeneralVolunteerDocumentBulkApproveModalProps) {
  return (
    <PermissionModal
      open={open}
      variant="approve"
      className="general-volunteer-document-bulk-approve-modal"
      title="1차 서류 일괄 승인 안내"
      message={buildGeneralVolunteerDocumentBulkApproveMessage(selectionCount, subjectName)}
      confirmLabel="승인"
      onCancel={onCancel}
      onConfirm={onConfirm}
      zIndex={zIndex}
    />
  )
}
