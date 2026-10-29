import { useId, type ReactNode } from 'react'
import { Modal, type ModalProps } from 'antd'
import { ModalCloseIcon } from '../icons/modal-close-icon.js'
import { ADMIN_MODAL_SIZE_WIDTH, type AdminModalSize } from './modal-size.js'
import './teal-header-modal.css'

export type { AdminModalSize as ModalSize }

export interface AdminTealHeaderModalProps {
  open: boolean
  onCancel: () => void
  title: string
  titleContent?: ReactNode
  titlePrefix?: ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  headerExtra?: React.ReactNode
  size?: AdminModalSize
  width?: number
  className?: string
  hideHeader?: boolean
  closeIcon?: React.ReactNode
  zIndex?: number
  wrapClassName?: string
  rootClassName?: string
  styles?: ModalProps['styles']
}

export function AdminTealHeaderModal({
  open,
  onCancel,
  title,
  titleContent,
  titlePrefix,
  children,
  footer,
  headerExtra,
  size = 'default',
  width: widthProp,
  className: classNameProp,
  hideHeader = false,
  closeIcon,
  zIndex,
  wrapClassName,
  rootClassName,
  styles,
}: AdminTealHeaderModalProps) {
  const width = widthProp ?? ADMIN_MODAL_SIZE_WIDTH[size]
  const isFull = size === 'full'
  const bodyScrollable = !isFull
  const titleId = useId()
  const className = [
    'teal-header-modal',
    `teal-header-modal--${size}`,
    !isFull ? 'teal-header-modal--bounded' : '',
    hideHeader ? 'teal-header-modal--hide-header' : '',
    classNameProp ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      closable={false}
      footer={null}
      width={isFull ? '100%' : width}
      className={className}
      wrapClassName={wrapClassName}
      rootClassName={rootClassName}
      styles={styles}
      aria-labelledby={hideHeader ? undefined : titleId}
      destroyOnHidden
      maskClosable
      centered={false}
      zIndex={zIndex}
      getContainer={() => document.body}
    >
      {!hideHeader && (
        <div className="teal-header-modal__header">
          <h2 id={titleId} className="teal-header-modal__title">
            {titlePrefix != null ? (
              <span className="teal-header-modal__title-prefix">{titlePrefix}</span>
            ) : null}
            <span className="teal-header-modal__title-text">{titleContent ?? title}</span>
          </h2>
          <div className="teal-header-modal__header-actions">
            {headerExtra}
            <button
              type="button"
              className="teal-header-modal__close"
              onClick={onCancel}
              aria-label="닫기"
            >
              {closeIcon ?? <ModalCloseIcon tone="white" />}
            </button>
          </div>
        </div>
      )}

      <div
        className={`teal-header-modal__body ${bodyScrollable ? 'teal-header-modal__body--scrollable' : ''}`}
      >
        {children}
      </div>

      {footer != null ? <div className="teal-header-modal__footer">{footer}</div> : null}
    </Modal>
  )
}
