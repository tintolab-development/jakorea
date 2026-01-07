/**
 * 정산 Mock 데이터
 * Phase 4: 35개 이상의 다양한 상태를 가진 정산 데이터
 */

import type { Settlement, SettlementItem, UUID } from '../../types'
import { mockMatchings } from './matchings'
import { mockPrograms } from './programs'

// instructor1@example.com용 고정 instructorId
const INSTRUCTOR1_ID = 'instructor-1-fixed-id-for-testing'

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
      amount: Math.floor(Math.random() * 50000) + 10000,
    })
  }

  if (hasAccommodation) {
    items.push({
      type: 'accommodation',
      description: '숙박비',
      amount: 80000, // 8만원 고정
    })
  }

  return items
}

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

  const baseInstructorFee =
    program?.format === 'workshop'
      ? Math.floor(Math.random() * 300000) + 200000
      : program?.format === 'seminar'
        ? Math.floor(Math.random() * 200000) + 150000
        : program?.format === 'course'
          ? Math.floor(Math.random() * 400000) + 300000
          : Math.floor(Math.random() * 250000) + 150000

  const items = createSettlementItems(baseInstructorFee, Math.random() > 0.5, Math.random() > 0.7)

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

const statuses: Settlement['status'][] = ['pending', 'calculated', 'approved', 'paid', 'cancelled']

// instructor1@example.com용 정산 데이터 10개 생성
function createInstructor1Settlements(): Settlement[] {
  const instructor1Settlements: Settlement[] = []
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  
  // 다양한 월에 걸쳐 정산 데이터 생성 (최근 3개월)
  const months = [
    currentMonth > 2 ? currentMonth - 2 : currentMonth + 10,
    currentMonth > 1 ? currentMonth - 1 : currentMonth + 11,
    currentMonth,
  ]
  
  // instructor1용 매칭 찾기 또는 생성 (첫 번째 매칭 사용)
  if (mockMatchings.length === 0 || mockPrograms.length === 0) {
    console.warn('mockMatchings or mockPrograms is empty, cannot create instructor1 settlements')
    return []
  }
  
  const baseMatching = mockMatchings[0]
  if (!baseMatching) {
    console.warn('baseMatching is undefined')
    return []
  }
  
  const baseProgram = mockPrograms.find(p => p.id === baseMatching.programId) || mockPrograms[0]
  if (!baseProgram) {
    console.warn('baseProgram is undefined')
    return []
  }
  
  for (let i = 0; i < 10; i++) {
    const monthIndex = i % 3
    const month = months[monthIndex]
    const year = month > currentMonth ? currentYear - 1 : currentYear
    const period = `${year}-${String(month).padStart(2, '0')}`
    
    // 다양한 상태 분배
    const statusIndex = i % statuses.length
    const status = statuses[statusIndex]
    
    const daysAgo = Math.floor(Math.random() * 90) + 1
    const documentGenerated = status !== 'pending' && Math.random() > 0.3
    
    // 강사비 계산
    const baseInstructorFee =
      baseProgram?.format === 'workshop'
        ? Math.floor(Math.random() * 300000) + 200000
        : baseProgram?.format === 'seminar'
          ? Math.floor(Math.random() * 200000) + 150000
          : baseProgram?.format === 'course'
            ? Math.floor(Math.random() * 400000) + 300000
            : Math.floor(Math.random() * 250000) + 150000
    
    const items = createSettlementItems(
      baseInstructorFee,
      Math.random() > 0.4, // 60% 확률로 교통비
      Math.random() > 0.7  // 30% 확률로 숙박비
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
    
    // 테스트용 매칭 ID는 사용하지 않고, 다른 매칭 ID 사용 (실제 매칭과 연결되지 않도록)
    // 이렇게 하면 match-test-instructor1-001 매칭은 정산 제출 가능한 상태로 유지됨
    const testMatchingId = `match-instructor1-${String(i + 1).padStart(3, '0')}`
    
    instructor1Settlements.push({
      id: `settle-instructor1-${String(i + 1).padStart(3, '0')}`,
      programId: baseProgram.id,
      instructorId: INSTRUCTOR1_ID, // instructor1의 고정 ID
      matchingId: testMatchingId, // 테스트 매칭과 다른 ID 사용
      period,
      items,
      totalAmount,
      status,
      documentGeneratedAt,
      notes: status === 'cancelled' ? '정산 취소됨' : undefined,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    })
  }
  
  return instructor1Settlements
}

export const mockSettlements: Settlement[] = [
  ...createInstructor1Settlements(), // instructor1@example.com용 정산 데이터 10개를 먼저 추가
  ...Array.from({ length: 35 }, (_, index) => {
    const matchingIndex = Math.floor(Math.random() * mockMatchings.length)
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const year = now.getFullYear()
    const period = `${year}-${month}`
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const daysAgo = Math.floor(Math.random() * 30) + 1
    const documentGenerated = status !== 'pending' && Math.random() > 0.3

    return createSettlement(
      `settle-${String(index + 1).padStart(3, '0')}`,
      matchingIndex,
      period,
      status,
      daysAgo,
      documentGenerated
    )
  }),
]

export const mockSettlementsMap = new Map<UUID, Settlement>()
mockSettlements.forEach(settlement => {
  mockSettlementsMap.set(settlement.id, settlement)
})




