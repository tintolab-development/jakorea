/**
 * 재사용 가능한 청록 헤더 모달
 * - 헤더: height 50px, padding 8px 30px, 배경 #47A9AD, 제목 + X 닫기
 * - 바디: padding 20px 30px 30px, flex column, gap 30px, 배경 #FFF
 * - X 클릭 또는 백그라운드(마스크) 클릭 시 닫힘
 * - size="large"(width 1400) 시 바디 최대 높이 840px, 초과 시 스크롤
 */

import { useId } from 'react'
import { Modal } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import './teal-header-modal.css'

export interface TealHeaderModalProps {
  open: boolean
  onCancel: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  /** 기본 800, large 시 1400 */
  size?: 'default' | 'large'
  /** 커스텀 width (size보다 우선) */
  width?: number
}

const SIZE_WIDTH = { default: 800, large: 1400 }

export function TealHeaderModal({
  open,
  onCancel,
  title,
  children,
  footer,
  size = 'default',
  width: widthProp,
}: TealHeaderModalProps) {
  const width = widthProp ?? SIZE_WIDTH[size]
  const bodyScrollable = size === 'large'
  const titleId = useId()

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      closable={false}
      footer={null}
      width={width}
      className="teal-header-modal"
      aria-labelledby={titleId}
      destroyOnClose
      maskClosable
      centered
    >
      <div className="teal-header-modal__header">
        <h2 id={titleId} className="teal-header-modal__title">
          {title}
        </h2>
        <button
          type="button"
          className="teal-header-modal__close"
          onClick={onCancel}
          aria-label="닫기"
        >
          <CloseOutlined />
        </button>
      </div>

      <div
        className={`teal-header-modal__body ${bodyScrollable ? 'teal-header-modal__body--scrollable' : ''}`}
      >
        {children}
      </div>

      {footer != null ? <div className="teal-header-modal__footer">{footer}</div> : null}
    </Modal>
  )
}
