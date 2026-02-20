/**
 * 정산 Mock 데이터
 * Phase 4: 35개 이상의 다양한 상태를 가진 정산 데이터
 * Phase 0.4.1: 현재 정산 시스템에 맞게 업데이트 (자동 산출 로직 반영)
 */

import type { Settlement, SettlementItem, UUID } from '../../types'
import { mockMatchings } from './matchings'
import { mockPrograms } from './programs'
import { TRANSPORT_FEE_POLICY } from '@/shared/constants/settlement-rules'
import { calculateSettlement } from '@/entities/settlement/lib/settlement-calculation'

// instructor1@example.com용 고정 instructorId
const INSTRUCTOR1_ID = 'instructor-1-fixed-id-for-testing'

/**
 * 정산 규칙에 맞게 정산 항목 생성
 * Phase 0.4.1: 자동 산출 로직 사용
 */
function createSettlementItems(
  sessions: number,
  distance: number,
  fuelCost: number,
  tollFee: number,
  hasAccommodation: boolean,
  isBusinessIncome: boolean
): SettlementItem[] {
  const calculationResult = calculateSettlement({
    sessions,
    distance,
    fuelCost,
    tollFee,
    accommodationRequired: hasAccommodation,
    isBusinessIncome,
  })

  const items: SettlementItem[] = [
    {
      type: 'instructor_fee',
      description: `강사비 (${sessions}차시${calculationResult.breakdown.isLongDistance ? ', 장거리' : ''})`,
      amount: calculationResult.instructorFee,
    },
  ]

  if (calculationResult.transportFee > 0) {
    items.push({
      type: 'transportation',
      description: '교통비',
      amount: calculationResult.transportFee,
    })
  }

  if (calculationResult.accommodationFee > 0) {
    items.push({
      type: 'accommodation',
      description: '숙박비',
      amount: calculationResult.accommodationFee,
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

  // Phase 0.4.1: 정산 규칙에 맞게 계산
  // 차시 수 (1~6차시)
  const sessions = Math.floor(Math.random() * 6) + 1
  // 편도 거리 (30~150km, 장거리 케이스 포함)
  const distance = Math.floor(Math.random() * 120) + 30
  // 주유비 (60km 초과 시만 지급)
  const fuelCost = distance > TRANSPORT_FEE_POLICY.minimumDistanceForTransport
    ? Math.floor(Math.random() * 50000) + 10000
    : 0
  // 통행료 (60km 초과 시만 지급)
  const tollFee = distance > TRANSPORT_FEE_POLICY.minimumDistanceForTransport
    ? Math.floor(Math.random() * 30000) + 5000
    : 0
  // 숙박비 필요 여부 (30% 확률)
  const hasAccommodation = Math.random() > 0.7
  // 사업소득자 여부 (50% 확률)
  const isBusinessIncome = Math.random() > 0.5

  const items = createSettlementItems(
    sessions,
    distance,
    fuelCost,
    tollFee,
    hasAccommodation,
    isBusinessIncome
  )

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)

  const calculationResult = calculateSettlement({
    sessions,
    distance,
    fuelCost,
    tollFee,
    accommodationRequired: hasAccommodation,
    isBusinessIncome,
  })

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
    calculationResult,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  }
}

const statuses: Settlement['status'][] = ['pending', 'calculated', 'review', 'approved', 'paid', 'cancelled']

// 2026년 1월 정산 데이터 10개 추가 생성 (강사1용)
function createInstructor1Settlements2026(): Settlement[] {
  const settlements: Settlement[] = []
  const period = '2026-01'

  if (mockPrograms.length === 0) return []
  const baseProgram = mockPrograms[0]

  // instructor1의 실제 매칭 목록 (matchings.ts의 match-test-instructor1-XXX)
  const instructor1Matchings = mockMatchings.filter(m => m.instructorId === INSTRUCTOR1_ID)

  // 각 상태별로 데이터 분배
  const janStatuses: Settlement['status'][] = [
    'pending', 'pending',
    'calculated', 'calculated',
    'review', 'review',
    'approved', 'approved',
    'paid',
    'cancelled'
  ]

  janStatuses.forEach((status, i) => {
    // Phase 0.4.1: 정산 규칙에 맞게 계산
    const sessions = Math.floor(Math.random() * 6) + 1
    const distance = Math.floor(Math.random() * 120) + 30
    const fuelCost = distance > TRANSPORT_FEE_POLICY.minimumDistanceForTransport
      ? Math.floor(Math.random() * 50000) + 10000
      : 0
    const tollFee = distance > TRANSPORT_FEE_POLICY.minimumDistanceForTransport
      ? Math.floor(Math.random() * 30000) + 5000
      : 0
    const hasAccommodation = Math.random() > 0.7
    const isBusinessIncome = Math.random() > 0.5

    const items = createSettlementItems(
      sessions,
      distance,
      fuelCost,
      tollFee,
      hasAccommodation,
      isBusinessIncome
    )
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)
    const calculationResult = calculateSettlement({
      sessions,
      distance,
      fuelCost,
      tollFee,
      accommodationRequired: hasAccommodation,
      isBusinessIncome,
    })

    // 2026년 1월 초 날짜들
    const createdAt = new Date(2026, 0, Math.floor(Math.random() * 7) + 1)
    createdAt.setHours(Math.floor(Math.random() * 12) + 9, Math.floor(Math.random() * 60), 0, 0)
    
    const updatedAt = new Date(createdAt)
    updatedAt.setDate(updatedAt.getDate() + Math.floor(Math.random() * 2))

    const documentGeneratedAt = (status !== 'pending' && status !== 'calculated')
      ? new Date(updatedAt).toISOString()
      : undefined

    settlements.push({
      id: `settle-202601-${String(i + 1).padStart(3, '0')}`,
      programId: baseProgram.id,
      instructorId: INSTRUCTOR1_ID,
      matchingId: instructor1Matchings[i % instructor1Matchings.length]?.id ?? `match-test-instructor1-001`,
      period,
      items,
      totalAmount,
      status,
      documentGeneratedAt,
      notes: status === 'cancelled' ? '정산 서류 미비로 인한 취소' : 
             status === 'review' ? '교통비 영수증 확인 필요' : undefined,
      calculationResult,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      // 상세 이력 추가 (V3 Phase 4 대응)
      approvalHistories: [
        {
          id: `hist-1-${i}`,
          step: 'pending',
          action: 'submitted',
          actionLabel: '정산 신청',
          reviewerName: '강사1',
          createdAt: createdAt.toISOString()
        },
        ...(status !== 'pending' && status !== 'calculated' ? [{
          id: `hist-2-${i}`,
          step: 'review' as const,
          action: (status === 'cancelled' ? 'cancelled' : 'reviewed') as any,
          actionLabel: status === 'cancelled' ? '정산 취소' : '검토 완료',
          reviewerName: '관리자',
          comment: status === 'cancelled' ? '영수증 누락' : '검토 완료되었습니다.',
          createdAt: updatedAt.toISOString()
        }] : [])
      ] as any // Use any temporarily to bypass strict literal check if status mapping is complex
    })
  })

  return settlements
}

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
  
  // instructor1의 실제 매칭 목록 (matchings.ts의 match-test-instructor1-XXX)
  const instructor1Matchings = mockMatchings.filter(m => m.instructorId === INSTRUCTOR1_ID)
  if (instructor1Matchings.length === 0) {
    console.warn('instructor1 matchings not found')
    return []
  }

  const baseMatching = instructor1Matchings[0]
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
    
    // Phase 0.4.1: 정산 규칙에 맞게 계산
    const sessions = Math.floor(Math.random() * 6) + 1
    const distance = Math.floor(Math.random() * 120) + 30
    const fuelCost = distance > TRANSPORT_FEE_POLICY.minimumDistanceForTransport
      ? Math.floor(Math.random() * 50000) + 10000
      : 0
    const tollFee = distance > TRANSPORT_FEE_POLICY.minimumDistanceForTransport
      ? Math.floor(Math.random() * 30000) + 5000
      : 0
    const hasAccommodation = Math.random() > 0.7 // 30% 확률로 숙박비
    const isBusinessIncome = Math.random() > 0.5
    
    const items = createSettlementItems(
      sessions,
      distance,
      fuelCost,
      tollFee,
      hasAccommodation,
      isBusinessIncome
    )
    
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)
    const calculationResult = calculateSettlement({
      sessions,
      distance,
      fuelCost,
      tollFee,
      accommodationRequired: hasAccommodation,
      isBusinessIncome,
    })

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

    const matchingForThisSettlement = instructor1Matchings[i % instructor1Matchings.length]

    instructor1Settlements.push({
      id: `settle-instructor1-${String(i + 1).padStart(3, '0')}`,
      programId: matchingForThisSettlement.programId,
      instructorId: INSTRUCTOR1_ID,
      matchingId: matchingForThisSettlement.id,
      period,
      items,
      totalAmount,
      status,
      documentGeneratedAt,
      notes: status === 'cancelled' ? '정산 취소됨' : undefined,
      calculationResult,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    })
  }
  
  return instructor1Settlements
}

/**
 * 여러 강사에게 정산 데이터 생성
 * Phase 0.4.1: 현재 정산 시스템에 맞게 다양한 강사에게 정산 데이터 생성
 */
function createSettlementsForMultipleInstructors(): Settlement[] {
  const settlements: Settlement[] = []
  
  // 매칭에서 고유한 강사 ID 추출
  const uniqueInstructorIds = Array.from(
    new Set(mockMatchings.map(m => m.instructorId).filter(Boolean))
  )
  
  // 각 강사당 2~5개의 정산 데이터 생성
  uniqueInstructorIds.forEach((instructorId, instructorIndex) => {
    const settlementCount = Math.floor(Math.random() * 4) + 2 // 2~5개
    
    // 해당 강사의 매칭 찾기
    const instructorMatchings = mockMatchings.filter(m => m.instructorId === instructorId)
    if (instructorMatchings.length === 0) return
    
    for (let i = 0; i < settlementCount; i++) {
      const matching = instructorMatchings[i % instructorMatchings.length]
      const now = new Date()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const year = now.getFullYear()
      const period = `${year}-${month}`
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      const daysAgo = Math.floor(Math.random() * 90) + 1
      const documentGenerated = status !== 'pending' && Math.random() > 0.3
      
      // Phase 0.4.1: 정산 규칙에 맞게 계산
      const sessions = Math.floor(Math.random() * 6) + 1
      const distance = Math.floor(Math.random() * 120) + 30
      const fuelCost = distance > TRANSPORT_FEE_POLICY.minimumDistanceForTransport
        ? Math.floor(Math.random() * 50000) + 10000
        : 0
      const tollFee = distance > TRANSPORT_FEE_POLICY.minimumDistanceForTransport
        ? Math.floor(Math.random() * 30000) + 5000
        : 0
      const hasAccommodation = Math.random() > 0.7
      const isBusinessIncome = Math.random() > 0.5
      
      const items = createSettlementItems(
        sessions,
        distance,
        fuelCost,
        tollFee,
        hasAccommodation,
        isBusinessIncome
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
      
      settlements.push({
        id: `settle-instructor-${instructorIndex}-${String(i + 1).padStart(3, '0')}`,
        programId: matching.programId,
        instructorId: instructorId,
        matchingId: matching.id,
        period,
        items,
        totalAmount,
        status,
        documentGeneratedAt,
        notes: status === 'cancelled' ? '정산 취소됨' : 
               status === 'review' ? '교통비 영수증 확인 필요' : undefined,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      })
    }
  })
  
  return settlements
}

export const mockSettlements: Settlement[] = [
  ...createInstructor1Settlements2026(), // 2026년 1월 데이터 10개 추가 (강사1용)
  ...createInstructor1Settlements(), // instructor1@example.com용 기존 정산 데이터 10개
  ...createSettlementsForMultipleInstructors(), // 여러 강사에게 정산 데이터 생성
  ...Array.from({ length: 20 }, (_, index) => {
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




