/**
 * 매칭 Mock 데이터
 * Phase 3.2: 프로그램-강사 매칭 데이터 생성
 */

import type { Matching, MatchingHistory, UUID } from '../../types'
import { mockPrograms } from './programs'
import { mockInstructors } from './instructors'
import { mockSchedules } from './schedules'

// 매칭 생성 함수
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
  const program = mockPrograms[programIndex]
  const round = roundIndex !== null && program.rounds[roundIndex] ? program.rounds[roundIndex] : null
  const instructor = mockInstructors[instructorIndex % mockInstructors.length]
  const schedule = scheduleIndex !== null && mockSchedules[scheduleIndex] ? mockSchedules[scheduleIndex] : undefined

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

  // 매칭 이력 생성
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

// Mock 데이터 생성 (최소 25개)
export const mockMatchings: Matching[] = [
  // 프로그램 0: 다양한 매칭 상태
  createMatching('match-001', 0, 0, 0, 0, 'active', 10),
  createMatching('match-002', 0, 0, 1, 1, 'active', 8),
  createMatching('match-003', 0, 1, 2, 2, 'pending', 5),
  createMatching('match-004', 0, 1, 3, 3, 'completed', 15, undefined, undefined),
  createMatching('match-005', 0, 1, 4, null, 'cancelled', 20, 12, '강사 일정 변경으로 인한 취소'),

  // 프로그램 1: 온라인 프로그램 매칭
  createMatching('match-006', 1, 0, 5, 4, 'active', 7),
  createMatching('match-007', 1, 0, 6, 5, 'active', 5),
  createMatching('match-008', 1, 1, 7, 6, 'pending', 3),

  // 프로그램 2: 다양한 상태
  createMatching('match-009', 2, null, 8, 7, 'active', 12),
  createMatching('match-010', 2, null, 9, 8, 'completed', 18, undefined, undefined),
  createMatching('match-011', 2, null, 10, null, 'cancelled', 25, 20, '프로그램 취소'),

  // 프로그램 3: 혼합 매칭
  createMatching('match-012', 3, 0, 11, 9, 'active', 9),
  createMatching('match-013', 3, 0, 12, 10, 'active', 6),
  createMatching('match-014', 3, 1, 13, 11, 'pending', 4),

  // 프로그램 4-11: 추가 매칭들
  createMatching('match-015', 4, null, 14, 12, 'active', 11),
  createMatching('match-016', 5, 0, 15, 13, 'completed', 16, undefined, undefined),
  createMatching('match-017', 6, null, 16, 14, 'active', 8),
  createMatching('match-018', 7, 0, 17, 15, 'pending', 5),
  createMatching('match-019', 8, null, 18, 16, 'active', 13),
  createMatching('match-020', 9, 0, 19, 17, 'completed', 19, undefined, undefined),
  createMatching('match-021', 10, null, 20, 18, 'active', 10),
  createMatching('match-022', 11, 0, 21, 19, 'pending', 6),

  // 취소된 매칭들
  createMatching('match-023', 4, null, 22, null, 'cancelled', 22, 18, '강사 개인 사정'),
  createMatching('match-024', 5, 0, 23, null, 'cancelled', 24, 21, '일정 변경 불가'),
  createMatching('match-025', 6, null, 24, null, 'cancelled', 26, 23, '프로그램 일정 조율 실패'),
]

// 효율적인 조회를 위한 Map
export const mockMatchingsMap = new Map<UUID, Matching>()
mockMatchings.forEach(matching => {
  mockMatchingsMap.set(matching.id, matching)
})

// 프로그램별 매칭 그룹화
export const mockMatchingsByProgram = new Map<UUID, Matching[]>()
mockMatchings.forEach(matching => {
  const programMatchings = mockMatchingsByProgram.get(matching.programId) || []
  programMatchings.push(matching)
  mockMatchingsByProgram.set(matching.programId, programMatchings)
})

// 강사별 매칭 그룹화
export const mockMatchingsByInstructor = new Map<UUID, Matching[]>()
mockMatchings.forEach(matching => {
  const instructorMatchings = mockMatchingsByInstructor.get(matching.instructorId) || []
  instructorMatchings.push(matching)
  mockMatchingsByInstructor.set(matching.instructorId, instructorMatchings)
})

