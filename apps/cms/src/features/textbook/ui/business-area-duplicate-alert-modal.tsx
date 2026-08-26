import { ContentModal, CmsButton } from '@/shared/ui'

const Z = 1100
const WIDTH = 600

export type BusinessAreaDuplicateAlertModalProps = {
  open: boolean
  onClose: () => void
  zIndex?: number
}

/** Notion: 동일한 사업 분야명이 존재하는 경우 중복 안내 팝업 */
export function BusinessAreaDuplicateAlertModal({
  open,
  onClose,
  zIndex = Z,
}: BusinessAreaDuplicateAlertModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="사업 분야 중복 안내"
      width={WIDTH}
      zIndex={zIndex}
      className="business-area-delete-blocked-modal"
      description={'동일한 사업 분야명이 이미 등록되어 있습니다.\n다른 명칭으로 입력해 주세요.'}
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
