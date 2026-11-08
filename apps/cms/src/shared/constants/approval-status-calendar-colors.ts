/**
 * 캘린더 우측 리스트 승인 상태 Tag 색상 (Figma Status / Tag / 승인 현황 14804:19711)
 * 글자·테두리 동일 톤, 배경 흰색은 `StatusOutlineTag` 셸이 담당한다.
 */

import type { ApprovalStatusKey } from '@/shared/components/approval-status-badge'

/** CSS 변수 + fallback (theme-provider :root 와 동기) */
export const CALENDAR_APPROVAL_STATUS_TEXT_COLOR: Record<ApprovalStatusKey, string> = {
  pending: 'var(--color-orange, #F07917)',
  approved: 'var(--color-green, #1E8C29)',
  rejected: 'var(--color-red, #C32F4A)',
  cancelled: 'var(--color-orange, #F07917)',
}
