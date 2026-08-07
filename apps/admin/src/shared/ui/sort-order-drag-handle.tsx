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
  margin: 0,
  lineHeight: 1,
  display: 'inline-flex',
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
