/**
 * 강사/봉사자 본인 정산 조회 API (stub)
 */

import type { UUID } from '@/types'
import type { Settlement, SettlementStatus } from '@/types/domain'

export async function getMySettlements(
  _instructorId: UUID,
  _filters?: { status?: SettlementStatus; search?: string }
): Promise<Settlement[]> {
  await new Promise(resolve => setTimeout(resolve, 200))
  return []
}

export async function getMySettlementDetail(
  _instructorId: UUID,
  _settlementId: UUID
): Promise<Settlement | null> {
  await new Promise(resolve => setTimeout(resolve, 200))
  return null
}
