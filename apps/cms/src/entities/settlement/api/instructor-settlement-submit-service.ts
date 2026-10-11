/**
 * 강사/봉사자 정산 제출 API (stub)
 */

import type { UUID } from '@/types'
import type { Settlement, SettlementItem } from '@/types/domain'

export interface SettlementSubmitFormData {
  programId: UUID
  matchingId: UUID
  period: string
  items: SettlementItem[]
  notes?: string
  attachments?: File[]
}

export async function submitSettlement(
  _instructorId: UUID,
  _formData: SettlementSubmitFormData
): Promise<Settlement> {
  await new Promise(resolve => setTimeout(resolve, 500))
  throw new Error('정산 제출 API가 연동되지 않았습니다.')
}

export async function getAvailableSettlements(_instructorId: UUID): Promise<
  Array<{
    matchingId: UUID
    programId: UUID
    programTitle: string
    period: string
    scheduleCount: number
  }>
> {
  await new Promise(resolve => setTimeout(resolve, 300))
  return []
}
