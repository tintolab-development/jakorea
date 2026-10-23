import { ConfirmModal } from '@/shared/ui/confirm-modal'

const LEAVE_CONFIRM_TITLE = '작성 취소 안내'
const LEAVE_CONFIRM_CONTENT = [
  '작성을 취소하면 임시 저장하지 않은 내용은 저장되지 않습니다.',
  '내용을 유지하려면 작성 화면으로 돌아가 [임시 저장]을 눌러 주세요.',
].join('\n')

export type RegistrationWizardLeaveConfirmModalProps = {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function RegistrationWizardLeaveConfirmModal({
  open,
  onConfirm,
  onCancel,
}: RegistrationWizardLeaveConfirmModalProps) {
  return (
    <ConfirmModal
      open={open}
      title={LEAVE_CONFIRM_TITLE}
      content={LEAVE_CONFIRM_CONTENT}
      confirmText="저장 안 함"
      cancelText="돌아가기"
      danger
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}
