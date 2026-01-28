/**
 * 참여자 조회 서비스
 * Phase 4.1: 참여자 조회/다운로드 (프로그램별) (FR-F00)
 */

import type { UUID } from '@/types'
import { mockApplications } from '@/data/mock/applications'
import { mockUsers } from '@/data/mock/users'
import { mockSchools } from '@/data/mock/schools'
import { programService } from '@/entities/program/api/program-service'
import type { Application } from '@/types/domain'

export interface ParticipantListFilters {
  programId?: UUID
  role?: 'INDIVIDUAL' | 'SCHOOL'
  status?: Application['status']
  keyword?: string
}

export interface ParticipantListItem {
  id: string
  name: string
  email: string
  role: 'INDIVIDUAL' | 'SCHOOL'
  programId: string
  programName: string
  status: Application['status']
  appliedAt: string
}

/**
 * 참여자 목록 조회
 */
export async function getParticipants(
  filters?: ParticipantListFilters
): Promise<ParticipantListItem[]> {
  // Mock: 실제로는 API 호출
  await new Promise(resolve => setTimeout(resolve, 300))

  // 신청 데이터에서 참여자 정보 추출
  const participants: ParticipantListItem[] = []

  for (const application of mockApplications) {
    // 학교 또는 학생 신청만 참여자로 간주
    if (application.subjectType !== 'school' && application.subjectType !== 'student') {
      continue
    }

    // 프로그램 필터
    if (filters?.programId && application.programId !== filters.programId) {
      continue
    }

    // 상태 필터
    if (filters?.status && application.status !== filters.status) {
      continue
    }

    // 역할 필터
    const isSchool = application.subjectType === 'school'
    if (filters?.role) {
      if (filters.role === 'INDIVIDUAL' && isSchool) continue
      if (filters.role === 'SCHOOL' && !isSchool) continue
    }

    // 참여자 정보 조회
    let name = ''
    let email = ''

    if (isSchool) {
      const school = mockSchools.find(s => s.id === application.subjectId)
      if (school) {
        name = school.name
        email = school.contactEmail || `${school.contactPerson || '담당자'}@${school.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}.school.go.kr`
      }
    } else {
      const user = mockUsers.find(u => u.id === application.subjectId)
      if (user) {
        name = user.name
        email = user.email
      }
    }

    // 검색 필터
    if (filters?.keyword) {
      const keyword = filters.keyword.toLowerCase()
      if (
        !name.toLowerCase().includes(keyword) &&
        !email.toLowerCase().includes(keyword)
      ) {
        continue
      }
    }

    const program = programService.getByIdSync(application.programId)
    if (!program) continue

    participants.push({
      id: application.id,
      name,
      email,
      role: isSchool ? 'SCHOOL' : 'INDIVIDUAL',
      programId: application.programId,
      programName: program.title,
      status: application.status,
      appliedAt: typeof application.submittedAt === 'string' ? application.submittedAt : application.submittedAt.toISOString(),
    })
  }

  // 최신순 정렬
  return participants.sort(
    (a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
  )
}
