/**
 * 정산 Mock 데이터
 * Phase 4: 35개 이상의 다양한 상태를 가진 정산 데이터
 */

import type { Settlement, SettlementItem, UUID } from '../../types'
import { mockMatchings } from './matchings'
import { mockPrograms } from './programs'

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
      amount: Math.floor(Math.random() * 100000) + 50000,
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

export const mockSettlements: Settlement[] = Array.from({ length: 35 }, (_, index) => {
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
})

export const mockSettlementsMap = new Map<UUID, Settlement>()
mockSettlements.forEach(settlement => {
  mockSettlementsMap.set(settlement.id, settlement)
})


