/**
 * 재사용 가능한 청록 헤더 모달
 * - 헤더: height 50px, padding 8px 30px, 배경 #47A9AD, 제목 + X 닫기
 * - 바디: padding 20px 30px 30px, flex column, gap 30px, 배경 #FFF
 * - X 클릭 또는 백그라운드(마스크) 클릭 시 닫힘
 * - 일반 모달은 전체 최대 높이 880px, 헤더·푸터 고정·바디만 스크롤
 */

import { useId, type ReactNode } from 'react'
import { Modal, type ModalProps } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import './teal-header-modal.css'

export interface TealHeaderModalProps {
  open: boolean
  onCancel: () => void
  title: string
  /** 타이틀 영역 커스텀(지정 시 `title` 문자열 대신 표시, 접근성 보조용으로 `title`은 유지 권장) */
  titleContent?: ReactNode
  /** 타이틀 문자열 앞에 노출 (예: 항목 아이콘) */
  titlePrefix?: ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  /** 헤더 우측에 X 버튼 앞에 노출할 추가 내용 (예: 닫기 버튼) */
  headerExtra?: React.ReactNode
  /** compact 600 / default 800 / medium 1000 / wide 1200 / large 1400 / full */
  size?: ModalSize
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
  /** `.ant-modal-wrap` — 뷰포트 중앙 등 레이아웃 전용 클래스 (Ant Design Modal) */
  wrapClassName?: string
  /** 최상위 `.ant-modal-root` — 포털 루트 구분용 */
  rootClassName?: string
  /** Ant Design Modal `styles` — content/body 등 인라인으로 전역 CSS보다 우선 적용 */
  styles?: ModalProps['styles']
}

export type ModalSize = 'compact' | 'default' | 'medium' | 'wide' | 'large' | 'full'

const SIZE_WIDTH: Record<ModalSize, number | undefined> = {
  compact: 600,
  default: 800,
  medium: 1000,
  wide: 1200,
  large: 1400,
  full: undefined,
}

export function TealHeaderModal({
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
}: TealHeaderModalProps) {
  const width = widthProp ?? SIZE_WIDTH[size]
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
      /** Ant `centered`는 wrap에 `::before` 정렬을 쓰는데, 아래 CSS가 같은 wrap을 flex로 잡아 두 방식이 충돌해 화면 중앙이 어긋날 수 있음 — flex 래퍼만 사용 */
      centered={false}
      zIndex={zIndex}
      /** 항상 body에 포털 — 레이아웃/앱 래퍼(transform 등) 기준으로 fixed 가 잡히며 ‘메인 영역만 중앙’처럼 보이는 현상 방지 */
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
