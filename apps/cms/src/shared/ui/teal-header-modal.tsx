/**
 * 재사용 가능한 청록 헤더 모달
 * - 헤더: height 50px, padding 8px 30px, 배경 #47A9AD, 제목 + X 닫기
 * - 바디: padding 20px 30px 30px, flex column, gap 30px, 배경 #FFF
 * - X 클릭 또는 백그라운드(마스크) 클릭 시 닫힘
 * - size="large"(width 1400) 시 모달 전체 최대 높이 840px, 바디만 스크롤
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
  /** 헤더 우측에 X 버튼 앞에 노출할 추가 내용 (예: 닫기 버튼) */
  headerExtra?: React.ReactNode
  /** 기본 800, large 시 1400, full 시 100vw×100vh 풀페이지 */
  size?: 'default' | 'large' | 'full'
  /** 커스텀 width (size보다 우선) */
  width?: number
  /** 모달 루트(ant-modal)에 붙는 추가 클래스 */
  className?: string
  /** true 시 헤더(타이틀+닫기) 영역 미렌더 — 풀페이지 모달 등에서 자체 헤더/닫기 사용 시 */
  hideHeader?: boolean
  /** 닫기 버튼 커스텀 아이콘 (미지정 시 CloseOutlined) */
  closeIcon?: React.ReactNode
  /** 다른 모달 위에 겹칠 때 스택 순서 (예: 산출 내역서 위 확인 모달) */
  zIndex?: number
}

const SIZE_WIDTH = { default: 800, large: 1400, full: undefined }

export function TealHeaderModal({
  open,
  onCancel,
  title,
  children,
  footer,
  headerExtra,
  size = 'default',
  width: widthProp,
  className: classNameProp,
  hideHeader = false,
  closeIcon,
  zIndex,
}: TealHeaderModalProps) {
  const width = widthProp ?? SIZE_WIDTH[size]
  const bodyScrollable = size === 'large' || size === 'full'
  const isFull = size === 'full'
  const titleId = useId()
  const className = [
    'teal-header-modal',
    size === 'large' ? 'teal-header-modal--large' : '',
    isFull ? 'teal-header-modal--full' : '',
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
      aria-labelledby={hideHeader ? undefined : titleId}
      destroyOnClose
      maskClosable
      centered={!isFull}
      zIndex={zIndex}
    >
      {!hideHeader && (
        <div className="teal-header-modal__header">
          <h2 id={titleId} className="teal-header-modal__title">
            {title}
          </h2>
          <div className="teal-header-modal__header-actions">
            {headerExtra}
            <button
              type="button"
              className="teal-header-modal__close"
              onClick={onCancel}
              aria-label="닫기"
            >
              {closeIcon ?? <CloseOutlined />}
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
