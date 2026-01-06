/**
 * 강사/봉사자 본인 정산 조회 API (Mock)
 * Phase 5.2.4: 본인 정산 정보
 */

import type { UUID } from '@/types'
import type { Settlement } from '@/types/domain'
import { mockSettlements } from '@/data/mock'
import type { SettlementStatus } from '@/types/domain'

/**
 * 본인 정산 목록 조회 (상태별 필터링 가능)
 */
export async function getMySettlements(
  instructorId: UUID,
  filters?: {
    status?: SettlementStatus
    search?: string
  }
): Promise<Settlement[]> {
  await new Promise(resolve => setTimeout(resolve, 200))

  // 본인 정산만 필터링
  let settlements = mockSettlements.filter(s => s.instructorId === instructorId)

  // 상태 필터링
  if (filters?.status) {
    settlements = settlements.filter(s => s.status === filters.status)
  }

  // 검색 필터링 (프로그램명 등)
  if (filters?.search) {
    const searchTerm = filters.search.toLowerCase()
    // TODO: 프로그램명으로 검색하는 로직 추가 필요
    settlements = settlements.filter(s => s.id.toLowerCase().includes(searchTerm))
  }

  // 최신순 정렬
  return settlements.sort((a, b) => {
    const dateA = typeof a.createdAt === 'string' ? new Date(a.createdAt) : a.createdAt
    const dateB = typeof b.createdAt === 'string' ? new Date(b.createdAt) : b.createdAt
    return dateB.getTime() - dateA.getTime()
  })
}

/**
 * 본인 정산 상세 조회
 */
export async function getMySettlementDetail(
  instructorId: UUID,
  settlementId: UUID
): Promise<Settlement | null> {
  await new Promise(resolve => setTimeout(resolve, 200))

  const settlement = mockSettlements.find(
    s => s.id === settlementId && s.instructorId === instructorId
  )

  return settlement || null
}

