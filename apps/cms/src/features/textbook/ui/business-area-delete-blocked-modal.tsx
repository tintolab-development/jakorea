import { ContentModal, CmsButton } from '@/shared/ui'

const Z = 1100
const WIDTH = 600

export type BusinessAreaDeleteBlockedModalProps = {
  open: boolean
  onClose: () => void
  zIndex?: number
}

export function BusinessAreaDeleteBlockedModal({
  open,
  onClose,
  zIndex = Z,
}: BusinessAreaDeleteBlockedModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="사업 분야 삭제 불가"
      width={WIDTH}
      zIndex={zIndex}
      className="business-area-delete-blocked-modal"
      description={
        '현재 해당 사업 분야를 사용하는 교재가 있습니다.\n사업 분야를 삭제하려면 등록된 교재를 삭제하거나 다른 사업 분야로 변경해 주세요.'
      }
      footer={
        <CmsButton variant="primary" size="large" type="button" onClick={onClose}>
          확인
        </CmsButton>
      }
    >
      {null}
    </ContentModal>
  )
}
