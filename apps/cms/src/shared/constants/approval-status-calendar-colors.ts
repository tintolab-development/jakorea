/**
 * 캘린더 우측 리스트 승인 상태 태그 색상
 * Figma outline 배지 — border·text 동일 톤, background 흰색
 */

import type { ApprovalStatusKey } from '@/shared/components/approval-status-badge'

export type CalendarApprovalStatusColor = {
  text: string
  border: string
  background: string
}

/** CSS 변수 + fallback (theme-provider :root 와 동기) */
export const CALENDAR_APPROVAL_STATUS_TEXT_COLOR: Record<ApprovalStatusKey, string> = {
  pending: 'var(--color-orange, #F07917)',
  approved: 'var(--color-green, #1E8C29)',
  rejected: 'var(--color-red, #C32F4A)',
  cancelled: 'var(--color-orange, #F07917)',
}

export const CALENDAR_APPROVAL_STATUS_BORDER_COLOR: Record<ApprovalStatusKey, string> = {
  pending: 'var(--color-orange, #F07917)',
  approved: 'var(--color-green, #1E8C29)',
  rejected: 'var(--color-red, #C32F4A)',
  cancelled: 'var(--color-orange, #F07917)',
}

export const CALENDAR_APPROVAL_STATUS_BG: Record<ApprovalStatusKey, string> = {
  pending: 'var(--main-WT, #FFF)',
  approved: 'var(--main-WT, #FFF)',
  rejected: 'var(--main-WT, #FFF)',
  cancelled: 'var(--main-WT, #FFF)',
}

export const CALENDAR_APPROVAL_STATUS_COLORS: Record<
  ApprovalStatusKey,
  CalendarApprovalStatusColor
> = {
  pending: {
    text: CALENDAR_APPROVAL_STATUS_TEXT_COLOR.pending,
    border: CALENDAR_APPROVAL_STATUS_BORDER_COLOR.pending,
    background: CALENDAR_APPROVAL_STATUS_BG.pending,
  },
  approved: {
    text: CALENDAR_APPROVAL_STATUS_TEXT_COLOR.approved,
    border: CALENDAR_APPROVAL_STATUS_BORDER_COLOR.approved,
    background: CALENDAR_APPROVAL_STATUS_BG.approved,
  },
  rejected: {
    text: CALENDAR_APPROVAL_STATUS_TEXT_COLOR.rejected,
    border: CALENDAR_APPROVAL_STATUS_BORDER_COLOR.rejected,
    background: CALENDAR_APPROVAL_STATUS_BG.rejected,
  },
  cancelled: {
    text: CALENDAR_APPROVAL_STATUS_TEXT_COLOR.cancelled,
    border: CALENDAR_APPROVAL_STATUS_BORDER_COLOR.cancelled,
    background: CALENDAR_APPROVAL_STATUS_BG.cancelled,
  },
}
