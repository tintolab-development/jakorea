/**
 * 테이블 순서(DnD) 핸들 — 아이콘·버튼 스타일 공통
 */

import type { CSSProperties, ButtonHTMLAttributes } from 'react'
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import { SortOrderDragIcon } from './sort-order-drag-icon'

export type SortOrderDragHandleProps = {
  setActivatorNodeRef?: (element: HTMLElement | null) => void
  listeners?: SyntheticListenerMap
  disabled?: boolean
  /** 기본 "순서 변경" */
  'aria-label'?: string
  className?: string
  style?: CSSProperties
} & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'type' | 'children' | 'ref' | 'disabled' | 'aria-label' | 'className' | 'style'
>

const BASE_STYLE: CSSProperties = {
  border: 'none',
  background: 'transparent',
  padding: 0,
  // 블록 flex + 가로 auto 여백 — inline-flex는 셀의 글자 기준선에 앉아 행 중앙보다 3px 위로 뜬다(52 행: 13/19).
  // 블록이면 td vertical-align:middle 로 정확히 가운데(16/16)
  margin: '0 auto',
  width: 'fit-content',
  lineHeight: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--main-BK, #3d3d3d)',
}

export function SortOrderDragHandle({
  setActivatorNodeRef,
  listeners,
  disabled = false,
  'aria-label': ariaLabel = '순서 변경',
  className,
  style,
  onClick,
  ...rest
}: SortOrderDragHandleProps) {
  return (
    <button
      type="button"
      ref={setActivatorNodeRef}
      aria-label={ariaLabel}
      disabled={disabled}
      className={['sort-order-drag-handle', className].filter(Boolean).join(' ')}
      style={{
        ...BASE_STYLE,
        cursor: disabled ? 'default' : 'move',
        opacity: disabled ? 0.45 : 1,
        ...style,
      }}
      onClick={event => {
        event.stopPropagation()
        onClick?.(event)
      }}
      {...(disabled ? {} : listeners)}
      {...rest}
    >
      <SortOrderDragIcon />
    </button>
  )
}
