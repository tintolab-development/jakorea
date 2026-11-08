/**
 * 편집 가능 상태 배지 — 공통 `StatusTag` 별칭(재직·권한·교재배송·서류평가 등).
 * 크기·색은 `status-tag.css` 정본. className·style로 덮어쓰지 않는다.
 */

import type { EditableStatusBadgeTone } from '@/shared/constants/editable-status-badge-tones'
import { StatusTag } from './status-tag'

export interface EditableStatusBadgeProps {
  label: string
  tone: EditableStatusBadgeTone
  /** true: 라벨 텍스트만 opacity 0.4 (배경·테두리 유지) */
  mutedLabel?: boolean
}

export function EditableStatusBadge({ label, tone, mutedLabel = false }: EditableStatusBadgeProps) {
  return <StatusTag label={label} tone={tone} mutedLabel={mutedLabel} />
}
