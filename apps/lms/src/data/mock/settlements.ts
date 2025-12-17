/**
 * 정산 Mock 데이터
 * Phase 4: 프로그램-강사 매칭 기반 정산 데이터 생성
 */

import type { Settlement, SettlementItem, UUID } from '../../types'
import { mockMatchings } from './matchings'
import { mockPrograms } from './programs'

// 정산 항목 생성 함수
function createSettlementItems(
  baseInstructorFee: number,
  hasTransportation: boolean,
  hasAccommodation: boolean
): SettlementItem[] {
  const items: SettlementItem[] = [
    {
      type: 'instructor_fee',
      description: '강사비',
      amount: baseInstructorFee,
    },
  ]

  if (hasTransportation) {
    items.push({
      type: 'transportation',
      description: '교통비',
      amount: Math.floor(Math.random() * 50000) + 10000, // 10,000 ~ 60,000
    })
  }

  if (hasAccommodation) {
    items.push({
      type: 'accommodation',
      description: '숙박비',
      amount: Math.floor(Math.random() * 100000) + 50000, // 50,000 ~ 150,000
    })
  }

  return items
}

// 정산 생성 함수
function createSettlement(
  id: string,
  matchingIndex: number,
  period: string,
  status: Settlement['status'],
  daysAgo: number,
  documentGenerated: boolean
): Settlement {
  const matching = mockMatchings[matchingIndex % mockMatchings.length]
  const program = mockPrograms.find(p => p.id === matching.programId)

  // 기본 강사비 계산 (프로그램 형태에 따라 차등)
  const baseInstructorFee =
    program?.format === 'workshop'
      ? Math.floor(Math.random() * 300000) + 200000 // 200,000 ~ 500,000
      : program?.format === 'seminar'
        ? Math.floor(Math.random() * 200000) + 150000 // 150,000 ~ 350,000
        : program?.format === 'course'
          ? Math.floor(Math.random() * 400000) + 300000 // 300,000 ~ 700,000
          : Math.floor(Math.random() * 250000) + 150000 // 기본값

  const items = createSettlementItems(
    baseInstructorFee,
    Math.random() > 0.5, // 50% 확률로 교통비
    Math.random() > 0.7 // 30% 확률로 숙박비
  )

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)

  const createdAt = new Date()
  createdAt.setDate(createdAt.getDate() - daysAgo)
  createdAt.setHours(Math.floor(Math.random() * 12) + 9, Math.floor(Math.random() * 60), 0, 0)

  const updatedAt = new Date(createdAt)
  if (Math.random() > 0.5) {
    updatedAt.setDate(updatedAt.getDate() + Math.floor(Math.random() * 5))
  }

  const documentGeneratedAt = documentGenerated
    ? (() => {
        const date = new Date(createdAt)
        date.setDate(date.getDate() + Math.floor(Math.random() * 3))
        return date.toISOString()
      })()
    : undefined

  return {
    id,
    programId: matching.programId,
    instructorId: matching.instructorId,
    matchingId: matching.id,
    period,
    items,
    totalAmount,
    status,
    documentGeneratedAt,
    notes: status === 'cancelled' ? '정산 취소됨' : undefined,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  }
}

// Mock 데이터 생성 (최소 20개)
export const mockSettlements: Settlement[] = [
  // 2025년 1월 정산들
  createSettlement('settle-001', 0, '2025-01', 'paid', 15, true),
  createSettlement('settle-002', 1, '2025-01', 'paid', 14, true),
  createSettlement('settle-003', 2, '2025-01', 'approved', 12, true),
  createSettlement('settle-004', 3, '2025-01', 'calculated', 10, false),

  // 2025년 2월 정산들
  createSettlement('settle-005', 4, '2025-02', 'calculated', 8, false),
  createSettlement('settle-006', 5, '2025-02', 'calculated', 7, false),
  createSettlement('settle-007', 6, '2025-02', 'pending', 5, false),

  // 프로그램별 정산들
  createSettlement('settle-008', 7, 'program-prog-001', 'paid', 20, true),
  createSettlement('settle-009', 8, 'program-prog-002', 'approved', 18, true),
  createSettlement('settle-010', 9, 'program-prog-003', 'calculated', 15, false),

  // 다양한 상태의 정산들
  createSettlement('settle-011', 10, '2025-02', 'pending', 4, false),
  createSettlement('settle-012', 11, '2025-02', 'approved', 6, true),
  createSettlement('settle-013', 12, '2025-01', 'paid', 16, true),
  createSettlement('settle-014', 13, '2025-02', 'calculated', 9, false),
  createSettlement('settle-015', 14, '2025-01', 'cancelled', 22, false),

  // 추가 정산들
  createSettlement('settle-016', 15, '2025-03', 'pending', 3, false),
  createSettlement('settle-017', 16, '2025-02', 'approved', 5, true),
  createSettlement('settle-018', 17, 'program-prog-004', 'calculated', 11, false),
  createSettlement('settle-019', 18, '2025-01', 'paid', 17, true),
  createSettlement('settle-020', 19, '2025-03', 'pending', 2, false),
]

// 효율적인 조회를 위한 Map
export const mockSettlementsMap = new Map<UUID, Settlement>()
mockSettlements.forEach(settlement => {
  mockSettlementsMap.set(settlement.id, settlement)
})

// 프로그램별 정산 그룹화
export const mockSettlementsByProgram = new Map<UUID, Settlement[]>()
mockSettlements.forEach(settlement => {
  const programSettlements = mockSettlementsByProgram.get(settlement.programId) || []
  programSettlements.push(settlement)
  mockSettlementsByProgram.set(settlement.programId, programSettlements)
})

// 강사별 정산 그룹화
export const mockSettlementsByInstructor = new Map<UUID, Settlement[]>()
mockSettlements.forEach(settlement => {
  const instructorSettlements = mockSettlementsByInstructor.get(settlement.instructorId) || []
  instructorSettlements.push(settlement)
  mockSettlementsByInstructor.set(settlement.instructorId, instructorSettlements)
})

// 매칭별 정산 그룹화
export const mockSettlementsByMatching = new Map<UUID, Settlement[]>()
mockSettlements.forEach(settlement => {
  const matchingSettlements = mockSettlementsByMatching.get(settlement.matchingId) || []
  matchingSettlements.push(settlement)
  mockSettlementsByMatching.set(settlement.matchingId, matchingSettlements)
})

