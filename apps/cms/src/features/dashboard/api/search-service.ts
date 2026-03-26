/**
 * 검색 서비스 (Mock)
 * Phase 5.2.1: 강사/봉사자 대시보드
 * Phase: 관리자 홈 화면 - 검색 기능 확장
 */

import type { UUID } from '@/types'
import { mockPrograms, mockSchedules, mockMatchings, mockUsers, mockSchools, mockInstructors } from '@/data/mock'
import { getProgramAdminDetailUrlDefault } from '@/features/program/lib/program-admin-detail-url'

export type SearchResultType = 'program' | 'schedule' | 'user' | 'school' | 'instructor' | 'application'

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
        link: getProgramAdminDetailUrlDefault(program.id),
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

/**
 * 관리자용 전체 검색
 */
export async function searchAdminContent(query: string): Promise<SearchResult[]> {
  await new Promise(resolve => setTimeout(resolve, 200))

  if (!query.trim()) {
    return []
  }

  const searchTerm = query.toLowerCase().trim()
  const results: SearchResult[] = []

  // 프로그램 검색
  mockPrograms.forEach(program => {
    if (
      program.title.toLowerCase().includes(searchTerm) ||
      program.description?.toLowerCase().includes(searchTerm)
    ) {
      results.push({
        type: 'program',
        id: program.id,
        title: program.title,
        description: program.description,
        link: getProgramAdminDetailUrlDefault(program.id),
      })
    }
  })

  // 일정 검색
  mockSchedules.forEach(schedule => {
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

  // 회원(사용자) 검색
  mockUsers.forEach(user => {
    if (
      user.name.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm)
    ) {
      results.push({
        type: 'user',
        id: user.id,
        title: user.name,
        description: user.email,
        link: `/users`,
      })
    }
  })

  // 학교 검색
  mockSchools.forEach(school => {
    if (
      school.name.toLowerCase().includes(searchTerm) ||
      school.region?.toLowerCase().includes(searchTerm)
    ) {
      results.push({
        type: 'school',
        id: school.id,
        title: school.name,
        description: school.region,
        link: `/schools/${school.id}`,
      })
    }
  })

  // 강사 검색
  mockInstructors.forEach(instructor => {
    if (instructor.name.toLowerCase().includes(searchTerm)) {
      results.push({
        type: 'instructor',
        id: instructor.id,
        title: instructor.name,
        link: `/instructors/${instructor.id}`,
      })
    }
  })

  // 최대 10개만 반환
  return results.slice(0, 10)
}

