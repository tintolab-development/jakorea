/**
 * 검색 서비스 (Mock)
 * Phase 5.2.1: 강사/봉사자 대시보드
 */

import type { UUID } from '@/types'
import { mockPrograms, mockSchedules, mockMatchings } from '@/data/mock'

export type SearchResultType = 'program' | 'schedule'

export interface SearchResult {
  type: SearchResultType
  id: string
  title: string
  description?: string
  link: string
}

/**
 * 강사/봉사자용 검색
 */
export async function searchInstructorContent(
  instructorId: UUID,
  query: string
): Promise<SearchResult[]> {
  await new Promise(resolve => setTimeout(resolve, 200))

  if (!query.trim()) {
    return []
  }

  const searchTerm = query.toLowerCase().trim()
  const results: SearchResult[] = []

  // 본인 매칭 조회
  const myMatchings = mockMatchings.filter(m => m.instructorId === instructorId)
  const myProgramIds = new Set(myMatchings.map(m => m.programId))

  // 프로그램 검색
  const matchingPrograms = mockPrograms.filter(p => myProgramIds.has(p.id))
  matchingPrograms.forEach(program => {
    if (
      program.title.toLowerCase().includes(searchTerm) ||
      program.description?.toLowerCase().includes(searchTerm)
    ) {
      results.push({
        type: 'program',
        id: program.id,
        title: program.title,
        description: program.description,
        link: `/programs/${program.id}`,
      })
    }
  })

  // 일정 검색
  const mySchedules = mockSchedules.filter(s => s.instructorId === instructorId)
  mySchedules.forEach(schedule => {
    if (
      schedule.title.toLowerCase().includes(searchTerm) ||
      schedule.location?.toLowerCase().includes(searchTerm)
    ) {
      results.push({
        type: 'schedule',
        id: schedule.id,
        title: schedule.title,
        description: `${schedule.date} ${schedule.startTime}-${schedule.endTime}`,
        link: `/schedules/${schedule.id}`,
      })
    }
  })

  // 최대 10개만 반환
  return results.slice(0, 10)
}

