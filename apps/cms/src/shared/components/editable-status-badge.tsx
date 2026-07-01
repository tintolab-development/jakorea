/**
 * 편집 가능 상태 배지 — 재직·권한·교재배송·서류평가 공통
 */

import {
  getEditableStatusBadgeClassName,
  type EditableStatusBadgeTone,
} from '@/shared/constants/editable-status-badge-tones'
import type { CSSProperties } from 'react'
import './editable-status-badge.css'

export interface EditableStatusBadgeProps {
  label: string
  tone: EditableStatusBadgeTone
  className?: string
  style?: CSSProperties
}

export function EditableStatusBadge({ label, tone, className, style }: EditableStatusBadgeProps) {
  return (
    <span className={getEditableStatusBadgeClassName(tone, className)} style={style}>
      {label}
    </span>
  )
}
