/**
 * 참여자 조회 서비스
 * Phase 4.1: 참여자 조회/다운로드 (프로그램별) (FR-F00)
 */

import type { UUID } from '@/types'
import { programService } from '@/entities/program/api/program-service'
import { applicationService } from '@/entities/application/api/application-service'
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

export async function getParticipants(
  filters?: ParticipantListFilters
): Promise<ParticipantListItem[]> {
  await new Promise(resolve => setTimeout(resolve, 300))

  const participants: ParticipantListItem[] = []

  for (const application of applicationService.getAllSync()) {
    if (application.subjectType !== 'school' && application.subjectType !== 'student') {
      continue
    }

    if (filters?.programId && application.programId !== filters.programId) {
      continue
    }

    if (filters?.status && application.status !== filters.status) {
      continue
    }

    const isSchool = application.subjectType === 'school'
    if (filters?.role) {
      if (filters.role === 'INDIVIDUAL' && isSchool) continue
      if (filters.role === 'SCHOOL' && !isSchool) continue
    }

    const name = application.subjectId
    const email = ''

    if (filters?.keyword) {
      const keyword = filters.keyword.toLowerCase()
      if (!name.toLowerCase().includes(keyword) && !email.toLowerCase().includes(keyword)) {
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
      appliedAt:
        typeof application.submittedAt === 'string'
          ? application.submittedAt
          : application.submittedAt.toISOString(),
    })
  }

  return participants.sort(
    (a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
  )
}
