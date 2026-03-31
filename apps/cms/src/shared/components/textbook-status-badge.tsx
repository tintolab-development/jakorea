/**
 * 교재 현황 / 결재 현황 배지 컴포넌트
 * 프로그램 진행현황(교재 현황), 신청자 목록(결재 현황) 등에서 재사용
 * 배경색·텍스트색만 다르고 동일 UI (border-radius 6px, 14px 600)
 */

import { Tag } from 'antd'
import type { PaymentOrderAdminLineProcessingStatus } from '@/data/mock/payment-order-admin-list'
import { PAYMENT_ORDER_ADMIN_LINE_STATUS_LABELS } from '@/data/mock/payment-order-admin-list'
import type { TextbookStatusKey } from '@/data/mock/participating-schools'
import { TEXTBOOK_STATUS_LABELS } from '@/data/mock/participating-schools'
import './app-status-badge.css'
import './textbook-status-badge.css'

export type { TextbookStatusKey }

/** 결재 현황 (신청자 목록 탭) — 동일 배지 컴포넌트, 색상만 다름 */
export type ApprovalStatusKey = 'pending' | 'rejected' | 'approved' | 'cancelled'

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatusKey, string> = {
  pending: '승인 대기',
  rejected: '신청 반려',
  approved: '승인 완료',
  cancelled: '승인 취소',
}

export type TextbookStatusBadgeProps =
  | { variant?: 'textbook'; status: TextbookStatusKey; className?: string }
  | { variant: 'approval'; status: ApprovalStatusKey; className?: string }
  | { variant: 'payment-order-line'; status: PaymentOrderAdminLineProcessingStatus; className?: string }

function getLabel(props: TextbookStatusBadgeProps): string {
  if (props.variant === 'approval') return APPROVAL_STATUS_LABELS[props.status]
  if (props.variant === 'payment-order-line')
    return PAYMENT_ORDER_ADMIN_LINE_STATUS_LABELS[props.status]
  return TEXTBOOK_STATUS_LABELS[props.status]
}

export function TextbookStatusBadge(props: TextbookStatusBadgeProps) {
  const variant = props.variant ?? 'textbook'
  const { status, className } = props
  const label = getLabel(props)
  const variantClass =
    variant === 'payment-order-line' ? ' textbook-status-badge--payment-order-line' : ''
  return (
    <Tag
      className={`app-status-badge textbook-status-badge--${status}${variantClass} ${className ?? ''}`.trim()}
      style={{ margin: 0 }}
    >
      {label}
    </Tag>
  )
}
