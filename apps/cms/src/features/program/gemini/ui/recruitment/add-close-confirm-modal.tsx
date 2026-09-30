import { ConfirmModal } from '@/shared/ui/confirm-modal'

const CLOSE_CONFIRM_TITLE = '작성 취소 안내'
const CLOSE_CONFIRM_CONTENT =
  '임시 저장하지 않은 내용은 작성을 취소 시 저장되지 않습니다.\n내용을 유지하려면 작성 화면으로 돌아가 [임시 저장]을 눌러 주세요.'

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
      confirmText="저장 안 함"
      cancelText="돌아가기"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}
