import { CMS_ALERT_MODAL_Z_INDEX } from '@/shared/constants/modal-z-index'
import { ContentModal } from './content-modal'
import { CmsButton } from './cms-button'
import './alert-modal.css'

const DEFAULT_WIDTH = 600

export interface AlertModalProps {
  open: boolean
  onClose: () => void
  title: string
  /** `\n` 포함 시 줄바꿈되어 표시됩니다. */
  content: string
  /** 모달 너비(px). 기본 600 */
  width?: number
  /** 기본값 확인 */
  confirmLabel?: string
  zIndex?: number
  /** 확인 버튼 클릭 시 (닫기 전 호출) */
  onConfirm?: () => void
}

/**
 * 단일 확인 버튼 안내 모달 (선택 안내·토스트 대체 문구 등).
 * 레이아웃·타이포는 디자인 스펙과 `ContentModal` 헤더 스타일을 따릅니다.
 */
export function AlertModal({
  open,
  onClose,
  title,
  content,
  width = DEFAULT_WIDTH,
  confirmLabel = '확인',
  zIndex = CMS_ALERT_MODAL_Z_INDEX,
  onConfirm,
}: AlertModalProps) {
  const handleConfirm = () => {
    onConfirm?.()
    onClose()
  }

  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title={title}
      width={width}
      zIndex={zIndex}
      className="alert-modal"
      footer={
        <CmsButton variant="secondary" size="medium" type="button" onClick={handleConfirm}>
          {confirmLabel}
        </CmsButton>
      }
    >
      <p className="alert-modal__content">{content}</p>
    </ContentModal>
  )
}
