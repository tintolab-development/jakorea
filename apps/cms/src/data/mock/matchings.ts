/**
 * 매칭 Mock 데이터
 * Phase 3.2: 35개 이상의 다양한 상태를 가진 매칭 데이터
 */

import type { Matching, MatchingHistory, UUID } from '../../types'
import { mockPrograms } from './programs'
import { mockInstructors } from './instructors'
import { mockSchedules } from './schedules'

function createMatching(
  id: string,
  programIndex: number,
  roundIndex: number | null,
  instructorIndex: number,
  scheduleIndex: number | null,
  status: Matching['status'],
  daysAgo: number,
  cancelledDaysAgo?: number,
  cancellationReason?: string
): Matching {
  const program = mockPrograms[programIndex % mockPrograms.length]
  const round =
    roundIndex !== null && program.rounds[roundIndex] ? program.rounds[roundIndex] : null
  const instructor = mockInstructors[instructorIndex % mockInstructors.length]
  const schedule =
    scheduleIndex !== null && mockSchedules[scheduleIndex]
      ? mockSchedules[scheduleIndex]
      : undefined

  const matchedAt = new Date()
  matchedAt.setDate(matchedAt.getDate() - daysAgo)
  matchedAt.setHours(Math.floor(Math.random() * 12) + 9, Math.floor(Math.random() * 60), 0, 0)

  const cancelledAt = cancelledDaysAgo
    ? (() => {
        const date = new Date()
        date.setDate(date.getDate() - cancelledDaysAgo)
        date.setHours(Math.floor(Math.random() * 12) + 9, Math.floor(Math.random() * 60), 0, 0)
        return date.toISOString()
      })()
    : undefined

  const createdAt = new Date(matchedAt)
  createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 3))

  const updatedAt = cancelledAt ? new Date(cancelledAt) : new Date(matchedAt)
  if (Math.random() > 0.5) {
    updatedAt.setDate(updatedAt.getDate() + Math.floor(Math.random() * 5))
  }

  const history: MatchingHistory[] = [
    {
      id: `${id}-history-1`,
      matchingId: id,
      action: 'created',
      changedAt: matchedAt.toISOString(),
    },
  ]

  if (cancelledAt) {
    history.push({
      id: `${id}-history-2`,
      matchingId: id,
      action: 'cancelled',
      previousValue: status,
      newValue: 'cancelled',
      changedAt: cancelledAt,
    })
  }

  return {
    id,
    programId: program.id,
    roundId: round?.id || undefined,
    instructorId: instructor.id,
    scheduleId: schedule?.id || undefined,
    status,
    matchedAt: matchedAt.toISOString(),
    cancelledAt: cancelledAt || undefined,
    cancellationReason: cancellationReason || undefined,
    history,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  }
}

const statuses: Matching['status'][] = ['active', 'inactive', 'pending', 'completed', 'cancelled']
const cancellationReasons = [
  '강사 일정 변경',
  '프로그램 일정 변경',
  '강사 요청',
  '프로그램 취소',
  '기타 사유',
]

export const mockMatchings: Matching[] = Array.from({ length: 35 }, (_, index) => {
  const programIndex = Math.floor(Math.random() * mockPrograms.length)
  const program = mockPrograms[programIndex]
  const hasRound = program.rounds.length > 0 && Math.random() > 0.3
  const roundIndex = hasRound ? Math.floor(Math.random() * program.rounds.length) : null
  const instructorIndex = Math.floor(Math.random() * mockInstructors.length)
  const hasSchedule = Math.random() > 0.3
  const scheduleIndex = hasSchedule ? Math.floor(Math.random() * mockSchedules.length) : null
  const status = statuses[Math.floor(Math.random() * statuses.length)]
  const daysAgo = Math.floor(Math.random() * 30) + 1
  const isCancelled = status === 'cancelled'
  const cancelledDaysAgo = isCancelled ? Math.floor(Math.random() * daysAgo) : undefined
  const cancellationReason = isCancelled
    ? cancellationReasons[Math.floor(Math.random() * cancellationReasons.length)]
    : undefined

  return createMatching(
    `match-${String(index + 1).padStart(3, '0')}`,
    programIndex,
    roundIndex,
    instructorIndex,
    scheduleIndex,
    status,
    daysAgo,
    cancelledDaysAgo,
    cancellationReason
  )
})

export const mockMatchingsMap = new Map<UUID, Matching>()
mockMatchings.forEach(matching => {
  mockMatchingsMap.set(matching.id, matching)
})



