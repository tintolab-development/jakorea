import type { ListSettlementAggregatesPendingItemBucket } from '@/shared/api/generated/settlement/schemas'

/** 리스트 뷰 「지급 대기 정산 항목」 버킷 — Notion 공통_리스트뷰 솔팅 */
export const PAYMENT_ORDER_PENDING_ITEM_BUCKETS = ['none', '1_5', '6_10', '11_plus'] as const

export type PaymentOrderPendingItemBucket = (typeof PAYMENT_ORDER_PENDING_ITEM_BUCKETS)[number]

export type PaymentOrderPendingItemBucketFilter = 'all' | PaymentOrderPendingItemBucket

export const PAYMENT_ORDER_PENDING_ITEM_BUCKET_LABELS: Record<
  PaymentOrderPendingItemBucket,
  string
> = {
  none: '없음',
  '1_5': '1 ~ 5개',
  '6_10': '6 ~ 10개',
  '11_plus': '11개 이상',
}

/** aggregates query `pendingItemBucket` (BE: NONE | 1_5 | 6_10 | 11_PLUS) */
export function mapPendingItemBucketToApi(
  bucket: PaymentOrderPendingItemBucket
): ListSettlementAggregatesPendingItemBucket {
  switch (bucket) {
    case 'none':
      return 'NONE'
    case '1_5':
      return '1_5'
    case '6_10':
      return '6_10'
    case '11_plus':
      return '11_PLUS'
  }
}

export function matchesPendingItemBucket(
  count: number,
  bucket: PaymentOrderPendingItemBucketFilter
): boolean {
  if (bucket === 'all') return true
  if (bucket === 'none') return count === 0
  if (bucket === '1_5') return count >= 1 && count <= 5
  if (bucket === '6_10') return count >= 6 && count <= 10
  return count >= 11
}
