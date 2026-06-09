/**
 * 교재 현황 / 결재 현황 배지 컴포넌트
 * textbook variant: EditableStatusBadge (100×32)
 * approval·payment-order-line: AppStatusBadge (기존 스펙 유지)
 */

import { Tag } from 'antd'
import type { CSSProperties } from 'react'
import type { PaymentOrderAdminLineProcessingStatus } from '@/data/mock/payment-order-admin-list'
import { PAYMENT_ORDER_ADMIN_LINE_STATUS_LABELS } from '@/data/mock/payment-order-admin-list'
import type { TextbookStatusKey } from '@/data/mock/participating-schools'
import { TEXTBOOK_STATUS_LABELS } from '@/data/mock/participating-schools'
import {
  PAYMENT_ORDER_STATUS_DETAIL_BG,
  PAYMENT_ORDER_STATUS_DETAIL_BORDER,
  PAYMENT_ORDER_STATUS_DETAIL_TEXT_COLOR,
  PAYMENT_ORDER_STATUS_LIST_BG,
  PAYMENT_ORDER_STATUS_LIST_BORDER,
  PAYMENT_ORDER_STATUS_LIST_TEXT_COLOR,
} from '@/shared/constants/payment-order-status-list-colors'
import { getTextbookStatusBadgeTone } from '@/shared/constants/editable-status-badge-tones'
import { EditableStatusBadge } from './editable-status-badge'
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

type TextbookBadgeChrome = { className?: string; style?: CSSProperties }

export type TextbookStatusBadgeProps =
  | ({ variant?: 'textbook'; status: TextbookStatusKey } & TextbookBadgeChrome)
  | ({ variant: 'approval'; status: ApprovalStatusKey } & TextbookBadgeChrome)
  | ({ variant: 'payment-order-line'; status: PaymentOrderAdminLineProcessingStatus } & TextbookBadgeChrome)
  | ({
      variant: 'payment-order-line-detail'
      status: PaymentOrderAdminLineProcessingStatus
    } & TextbookBadgeChrome)

function getLabel(props: TextbookStatusBadgeProps): string {
  if (props.variant === 'approval') return APPROVAL_STATUS_LABELS[props.status]
  if (props.variant === 'payment-order-line' || props.variant === 'payment-order-line-detail') {
    return PAYMENT_ORDER_ADMIN_LINE_STATUS_LABELS[props.status as PaymentOrderAdminLineProcessingStatus]
  }
  return TEXTBOOK_STATUS_LABELS[props.status]
}

export function TextbookStatusBadge(props: TextbookStatusBadgeProps) {
  const variant = props.variant ?? 'textbook'
  const { status, className, style: userStyle } = props
  const label = getLabel(props)

  if (variant === 'textbook') {
    return (
      <EditableStatusBadge
        label={label}
        tone={getTextbookStatusBadgeTone(status as TextbookStatusKey)}
        className={className}
      />
    )
  }

  const isPaymentOrderLineVariant =
    variant === 'payment-order-line' || variant === 'payment-order-line-detail'
  const variantClass = isPaymentOrderLineVariant ? ' textbook-status-badge--payment-order-line' : ''
  const isDetailTone = variant === 'payment-order-line-detail'

  let tagStyle: CSSProperties = { margin: 0 }
  if (isPaymentOrderLineVariant) {
    const lineStatus = status as PaymentOrderAdminLineProcessingStatus
    const textMap = isDetailTone
      ? PAYMENT_ORDER_STATUS_DETAIL_TEXT_COLOR
      : PAYMENT_ORDER_STATUS_LIST_TEXT_COLOR
    const bgMap = isDetailTone ? PAYMENT_ORDER_STATUS_DETAIL_BG : PAYMENT_ORDER_STATUS_LIST_BG
    const borderMap = isDetailTone
      ? PAYMENT_ORDER_STATUS_DETAIL_BORDER
      : PAYMENT_ORDER_STATUS_LIST_BORDER
    tagStyle = {
      margin: 0,
      color: textMap[lineStatus],
      background: bgMap[lineStatus],
      border: `1px solid ${borderMap[lineStatus]}`,
      borderRadius: 4,
    }
  }

  return (
    <Tag
      className={`app-status-badge textbook-status-badge--${status}${variantClass} ${className ?? ''}`.trim()}
      style={{ ...tagStyle, ...userStyle }}
    >
      {label}
    </Tag>
  )
}
