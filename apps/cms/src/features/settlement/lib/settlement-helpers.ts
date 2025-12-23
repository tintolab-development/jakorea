/**
 * 정산 관련 비즈니스 로직 헬퍼 함수
 * Phase 2.3: 비즈니스 로직 분리
 */

import type { SettlementItem } from '@/types/domain'

/**
 * 정산 항목 총액 계산
 * @param items 정산 항목 배열
 * @returns 총액
 */
export function calculateSettlementTotal(items: SettlementItem[]): number {
  return items.reduce((sum, item) => sum + (item.amount || 0), 0)
}



