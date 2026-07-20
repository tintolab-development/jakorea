import type { ReactNode } from 'react'
import { CMS_ALERT_MODAL_Z_INDEX } from '@/shared/constants/modal-z-index'
import { ContentModal } from './content-modal'
import { CmsButton, type CmsButtonVariant } from './cms-button'
import './content-modal.css'
import './cms-modal.css'

const DEFAULT_WIDTH = 600
const DEFAULT_BUTTON_WIDTH = 120

export interface CmsModalButton {
  label: string
  onClick: () => void
  variant?: CmsButtonVariant
  width?: number | string
  loading?: boolean
  disabled?: boolean
}

export interface CmsModalProps {
  open: boolean
  onClose: () => void
  title: string
  /** `\n` 포함 시 줄바꿈되어 표시됩니다. `children`이 있으면 무시됩니다. */
  content?: string
  /** `content` 대신 커스텀 본문이 필요할 때 */
  children?: ReactNode
  /** 모달 너비(px). 기본 600 */
  width?: number
  zIndex?: number
  /** 1개(확인) 또는 2개(취소·확인/삭제) — 좌→우 순서 */
  buttons: readonly [CmsModalButton] | readonly [CmsModalButton, CmsModalButton]
}

function resolveButtonVariant(
  button: CmsModalButton,
  index: number,
  total: number
): CmsButtonVariant {
  if (button.variant) return button.variant
  if (total === 1) return 'primary'
  return index === 0 ? 'secondary' : 'primary'
}

function renderFooter(buttons: readonly CmsModalButton[]) {
  return (
    <>
      {buttons.map((button, index) => (
        <CmsButton
          key={`${button.label}-${index}`}
          variant={resolveButtonVariant(button, index, buttons.length)}
          size="medium"
          width={button.width ?? DEFAULT_BUTTON_WIDTH}
          type="button"
          onClick={button.onClick}
          loading={button.loading}
          disabled={button.disabled}
        >
          {button.label}
        </CmsButton>
      ))}
    </>
  )
}

/**
 * 공통 안내·확인 모달.
 * `AlertModal`과 동일한 ContentModal 셸이며, footer에 버튼 1~2개를 prop으로 구성합니다.
 */
export function CmsModal({
  open,
  onClose,
  title,
  content,
  children,
  width = DEFAULT_WIDTH,
  zIndex = CMS_ALERT_MODAL_Z_INDEX,
  buttons,
}: CmsModalProps) {
  const body =
    children ??
    (content != null ? <p className="cms-modal__content">{content}</p> : null)

  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title={title}
      width={width}
      zIndex={zIndex}
      wrapClassName="cms-modal-wrap"
      className="cms-modal"
      footer={renderFooter(buttons)}
    >
      {body}
    </ContentModal>
  )
}
