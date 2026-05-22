/**
 * 컨텐츠 모달 (공통 레이아웃)
 * - 컨테이너 padding: top 28, bottom 34, horizontal 30
 * - 헤더: 보더 없음, padding 제거, 타이틀 24px Bold
 * - 바디: padding 제거. description prop이 있으면 타이틀–디스크립션 간격 16px(content-modal.css)
 * - 푸터: 상단 디바이더 없음, margin-top 30px, 버튼 래퍼 100% + 우측 정렬
 * 다른 모달에서 이 컴포넌트를 위주로 사용할 수 있도록 공통화함.
 */

import type { ReactNode } from 'react'
import type { ModalProps } from 'antd'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { renderContentModalDescription } from '@/shared/ui/content-modal-description'
import './content-modal.css'

/** 기본 닫기 버튼 X 아이콘 24×24, opacity 0.5 */
const DEFAULT_CLOSE_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <g opacity="0.5">
      <path d="M18 6L6 18" stroke="#3D3D3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 6L18 18" stroke="#3D3D3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
)

export interface ContentModalProps {
  open: boolean
  onCancel: () => void
  title: string
  /** 헤더 타이틀 영역 커스텀 — `TealHeaderModal` `titleContent`에 전달 */
  titleContent?: ReactNode
  /** 헤더 타이틀 앞 접두사 (예: 아이콘) */
  titlePrefix?: ReactNode
  children: ReactNode
  /** 푸터 영역. 전달 시 100% 너비 래퍼 안에서 우측 정렬됨 */
  footer?: React.ReactNode
  /** 기본 800, large 시 1400 */
  size?: 'default' | 'large'
  width?: number
  /** 모달 루트에 붙는 추가 클래스 (공통으로 content-modal 포함) */
  className?: string
  /** 닫기 버튼 아이콘 (미지정 시 기본 X 아이콘) */
  closeIcon?: ReactNode
  /**
   * 헤더 타이틀 바로 아래 설명(plain text).
   * - `\n`: 줄바꿈(추가 행간 없음, line-height 150%만 적용)
   * - `**텍스트**`: 볼드(font-weight 700)
   */
  description?: string
  /** default: 16px, compact: 10px (헤더 하단 ↔ 설명) */
  descriptionGap?: 'default' | 'compact'
  /** 다른 모달 위에 겹칠 때 (예: 이중 모달) */
  zIndex?: number
  /** TealHeaderModal → Modal `wrapClassName` (뷰포트 정렬 등) */
  wrapClassName?: string
  /** TealHeaderModal → Modal `rootClassName` */
  rootClassName?: string
  /** Ant Design Modal `styles` (패널·바디 인라인 — 전역 CSS보다 우선) */
  modalStyles?: ModalProps['styles']
}

export function ContentModal({
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
  zIndex,
  wrapClassName,
  rootClassName,
  modalStyles,
}: ContentModalProps) {
  const resolvedClassName = [
    'content-modal',
    description != null && descriptionGap === 'compact' ? 'content-modal--description-gap-compact' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const wrappedFooter =
    footer != null ? (
      <div className="content-modal__footer-actions">{footer}</div>
    ) : undefined

  return (
    <TealHeaderModal
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
    >
      {description != null && description !== '' ? (
        <div className="content-modal__description">
          {renderContentModalDescription(description)}
        </div>
      ) : null}
      {children}
    </TealHeaderModal>
  )
}
