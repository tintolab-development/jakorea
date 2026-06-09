/**
 * 교재 배송 상태 배지 — 배송 전 / 배송 중 / 배송 완료
 * 프로그램 기관 상세·기타 화면에서 공통 사용
 */

import './delivery-status-badge.css'
import { EditableStatusBadge } from './editable-status-badge'
import { getTextbookDeliveryStatusBadgeTone } from '@/shared/constants/editable-status-badge-tones'

export type TextbookDeliveryStatus = 'before_shipping' | 'shipping' | 'delivered'

export const TEXTBOOK_DELIVERY_STATUS_LABEL: Record<TextbookDeliveryStatus, string> = {
  before_shipping: '배송 전',
  shipping: '배송 중',
  delivered: '배송 완료',
}

export function DeliveryStatusBadge({ status }: { status: TextbookDeliveryStatus }) {
  return (
    <EditableStatusBadge
      label={TEXTBOOK_DELIVERY_STATUS_LABEL[status]}
      tone={getTextbookDeliveryStatusBadgeTone(status)}
    />
  )
}
