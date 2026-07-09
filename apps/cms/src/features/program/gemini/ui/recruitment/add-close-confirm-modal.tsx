import { ConfirmModal } from '@/shared/ui/confirm-modal'

const CLOSE_CONFIRM_TITLE = '작성 취소 안내'
const CLOSE_CONFIRM_CONTENT =
  '닫기 시 작성된 내용은 저장되지 않습니다. 내용을 유지하려면 임시저장 버튼을 눌러주세요.'

export function GeminiRecruitmentAddCloseConfirmModal({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <ConfirmModal
      open={open}
      title={CLOSE_CONFIRM_TITLE}
      content={CLOSE_CONFIRM_CONTENT}
      confirmText="닫기"
      cancelText="취소"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}
