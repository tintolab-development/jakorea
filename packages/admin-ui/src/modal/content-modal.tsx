import type { ReactNode } from 'react'
import type { ModalProps } from 'antd'
import { renderContentModalDescription } from './content-modal-description.js'
import type { AdminModalSize } from './modal-size.js'
import { AdminTealHeaderModal } from './teal-header-modal.js'
import './content-modal.css'

export const CONTENT_MODAL_TABLE_CELL_ACTIONS_CLASS = 'content-modal__table-cell-actions'

const DEFAULT_CLOSE_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <g opacity="0.5">
      <path
        d="M18 6L6 18"
        stroke="#3D3D3D"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 6L18 18"
        stroke="#3D3D3D"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  </svg>
)

export interface AdminContentModalProps {
  open: boolean
  onCancel: () => void
  title: string
  titleContent?: ReactNode
  titlePrefix?: ReactNode
  children: ReactNode
  footer?: React.ReactNode
  size?: Exclude<AdminModalSize, 'full'>
  width?: number
  className?: string
  closeIcon?: ReactNode
  description?: string
  descriptionGap?: 'default' | 'compact'
  titleBodyGap?: 'auto' | 'always' | 'none' | 'list-settings'
  zIndex?: number
  wrapClassName?: string
  rootClassName?: string
  modalStyles?: ModalProps['styles']
  afterOpenChange?: (open: boolean) => void
}

export function AdminContentModal({
  open,
  onCancel,
  title,
  titleContent,
  titlePrefix,
  children,
  footer,
  size = 'default',
  width,
  className,
  closeIcon = DEFAULT_CLOSE_ICON,
  description,
  descriptionGap = 'default',
  titleBodyGap = 'always',
  zIndex,
  wrapClassName,
  rootClassName,
  modalStyles,
  afterOpenChange,
}: AdminContentModalProps) {
  const resolvedClassName = [
    'content-modal',
    description != null && descriptionGap === 'compact' ? 'content-modal--description-gap-compact' : '',
    titleBodyGap === 'always' ? 'content-modal--title-body-gap-always' : '',
    titleBodyGap === 'none' ? 'content-modal--title-body-gap-none' : '',
    titleBodyGap === 'list-settings' ? 'content-modal--title-body-gap-list-settings' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const wrappedFooter =
    footer != null ? <div className="content-modal__footer-actions">{footer}</div> : undefined

  return (
    <AdminTealHeaderModal
      open={open}
      onCancel={onCancel}
      title={title}
      titleContent={titleContent}
      titlePrefix={titlePrefix}
      size={size}
      width={width}
      footer={wrappedFooter}
      className={resolvedClassName}
      closeIcon={closeIcon}
      zIndex={zIndex}
      wrapClassName={wrapClassName}
      rootClassName={rootClassName}
      styles={modalStyles}
      afterOpenChange={afterOpenChange}
    >
      {description != null && description !== '' ? (
        <div className="content-modal__description">
          {renderContentModalDescription(description)}
        </div>
      ) : null}
      {children}
    </AdminTealHeaderModal>
  )
}
