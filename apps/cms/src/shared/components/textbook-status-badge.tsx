/**
 * 교재 현황 / 결재 현황 / 지급조서 처리 현황(라인) 태그 — 공통 `StatusTag`.
 * 라벨·색 매핑은 `@/shared/lib/status-tag-specs` 정본. 크기·색을 화면에서 덮어쓰지 않는다.
 */

import type { PaymentOrderAdminLineProcessingStatus } from '@/features/settlement-management/model/payment-order-admin-list'
import type { TextbookStatusKey } from '@/features/program/general/model/participating-schools'
import {
  APPROVAL_STATUS_LABELS,
  getApprovalStatusTag,
  getPaymentOrderLineStatusTag,
  getTextbookStatusTag,
  type ApprovalStatusKey,
} from '@/shared/lib/status-tag-specs'
import { StatusTag } from './status-tag'

export type { TextbookStatusKey, ApprovalStatusKey }
export { APPROVAL_STATUS_LABELS }

export type TextbookStatusBadgeProps =
  | { variant?: 'textbook'; status: TextbookStatusKey }
  | { variant: 'approval'; status: ApprovalStatusKey }
  | { variant: 'payment-order-line'; status: PaymentOrderAdminLineProcessingStatus }

export function TextbookStatusBadge(props: TextbookStatusBadgeProps) {
  if (props.variant === 'approval') return <StatusTag {...getApprovalStatusTag(props.status)} />
  if (props.variant === 'payment-order-line') {
    return <StatusTag {...getPaymentOrderLineStatusTag(props.status)} />
  }
  return <StatusTag {...getTextbookStatusTag(props.status)} />
}
