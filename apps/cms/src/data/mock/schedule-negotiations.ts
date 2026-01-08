/**
 * 일정 협의 Mock 데이터
 * V3 Phase 8: 일정 협의 관리
 */

import type { ScheduleNegotiation, ScheduleNegotiationProposal } from '@/types/domain'

const getDate = (daysAgo: number): string => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString()
}

// 프로그램/학교 ID 패턴은 기존 mock 규칙을 따릅니다 (prog-xxx, school-xxx)
const programIds = Array.from({ length: 8 }, (_, i) => `prog-${String(i + 1).padStart(3, '0')}`)
const schoolIds = Array.from({ length: 8 }, (_, i) => `school-${String(i + 1).padStart(3, '0')}`)

export const mockScheduleNegotiations: ScheduleNegotiation[] = Array.from({ length: 16 }, (_, idx) => {
  const programId = programIds[idx % programIds.length]
  const schoolId = schoolIds[idx % schoolIds.length]
  const createdAt = getDate(30 - (idx % 15))
  const updatedAt = getDate(2 - (idx % 3))

  // 간단한 제안 2~3개 생성
  const proposals: ScheduleNegotiationProposal[] = Array.from(
    { length: (idx % 2) + 2 },
    (__, pIdx) => {
      const base = new Date()
      base.setDate(base.getDate() + (pIdx + 1) * 7 + (idx % 5))
      const date = base.toISOString()
      const status: ScheduleNegotiationProposal['status'] =
        pIdx === 0 ? 'pending' : pIdx === 1 ? 'accepted' : 'rejected'
      return {
        id: `prop-${idx + 1}-${pIdx + 1}`,
        date,
        startTime: '10:00',
        endTime: '12:00',
        status,
        note: pIdx === 1 ? '학교 일정과 적합' : undefined,
      }
    }
  )

  const status: ScheduleNegotiation['status'] =
    proposals.some(p => p.status === 'accepted') ? 'accepted' : idx % 3 === 0 ? 'revised' : 'proposed'

  return {
    id: `nego-${String(idx + 1).padStart(3, '0')}`,
    programId,
    schoolId,
    proposals,
    status,
    createdAt,
    updatedAt,
  }
})

export const mockScheduleNegotiationsMap = new Map(
  mockScheduleNegotiations.map(n => [n.id, n])
)


