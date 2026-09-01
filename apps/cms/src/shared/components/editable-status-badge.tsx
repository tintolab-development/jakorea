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
  /** true: 라벨 텍스트만 opacity 0.4 (배경·테두리 유지) */
  mutedLabel?: boolean
}

export function EditableStatusBadge({
  label,
  tone,
  className,
  style,
  mutedLabel = false,
}: EditableStatusBadgeProps) {
  return (
    <span className={getEditableStatusBadgeClassName(tone, className)} style={style}>
      {mutedLabel ? (
        <span className="editable-status-badge__label editable-status-badge__label--muted">
          {label}
        </span>
      ) : (
        label
      )}
    </span>
  )
}
