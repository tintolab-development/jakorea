/**
 * 신청 Mock 데이터
 * Phase 2.2: 50개 이상의 다양한 상태를 가진 신청 데이터
 */

import type { Application, UUID } from '../../types'
import { mockPrograms } from './programs'
import { mockSchools } from './schools'
import { mockInstructors } from './instructors'

function createApplication(
  id: string,
  programIndex: number,
  roundIndex: number | null,
  subjectType: Application['subjectType'],
  subjectIndex: number,
  status: Application['status'],
  daysAgo: number,
  reviewedDaysAgo?: number
): Application {
  const program = mockPrograms[programIndex % mockPrograms.length]
  const round = roundIndex !== null && program.rounds[roundIndex] ? program.rounds[roundIndex] : null

  const submittedAt = new Date()
  submittedAt.setDate(submittedAt.getDate() - daysAgo)
  submittedAt.setHours(Math.floor(Math.random() * 12) + 9, Math.floor(Math.random() * 60), 0, 0)

  const reviewedAt = reviewedDaysAgo
    ? (() => {
        const date = new Date()
        date.setDate(date.getDate() - reviewedDaysAgo)
        date.setHours(Math.floor(Math.random() * 12) + 9, Math.floor(Math.random() * 60), 0, 0)
        return date.toISOString()
      })()
    : undefined

  const createdAt = new Date(submittedAt)
  createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 3))

  const updatedAt = reviewedAt ? new Date(reviewedAt) : new Date(submittedAt)
  if (Math.random() > 0.5) {
    updatedAt.setDate(updatedAt.getDate() + Math.floor(Math.random() * 5))
  }

  let subjectId: UUID
  if (subjectType === 'school') {
    subjectId = mockSchools[subjectIndex % mockSchools.length].id
  } else if (subjectType === 'instructor') {
    subjectId = mockInstructors[subjectIndex % mockInstructors.length].id
  } else {
    subjectId = mockSchools[subjectIndex % mockSchools.length].id
  }

  return {
    id,
    programId: program.id,
    roundId: round?.id,
    subjectType,
    subjectId,
    status,
    notes:
      Math.random() > 0.7
        ? `신청 메모: ${subjectType === 'school' ? '학교' : subjectType === 'instructor' ? '강사' : '학생'} 신청 관련 추가 정보`
        : undefined,
    submittedAt: submittedAt.toISOString(),
    reviewedAt,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  }
}

const statuses: Application['status'][] = ['submitted', 'reviewing', 'approved', 'rejected', 'cancelled']
const subjectTypes: Application['subjectType'][] = ['school', 'student', 'instructor']

export const mockApplications: Application[] = Array.from({ length: 50 }, (_, index) => {
  const programIndex = Math.floor(Math.random() * mockPrograms.length)
  const program = mockPrograms[programIndex]
  const hasRound = program.rounds.length > 0 && Math.random() > 0.3
  const roundIndex = hasRound ? Math.floor(Math.random() * program.rounds.length) : null
  const subjectType = subjectTypes[Math.floor(Math.random() * subjectTypes.length)]
  const subjectIndex = Math.floor(Math.random() * 30)
  const status = statuses[Math.floor(Math.random() * statuses.length)]
  const daysAgo = Math.floor(Math.random() * 30) + 1
  const reviewedDaysAgo = status !== 'submitted' ? Math.floor(Math.random() * daysAgo) : undefined

  return createApplication(
    `app-${String(index + 1).padStart(3, '0')}`,
    programIndex,
    roundIndex,
    subjectType,
    subjectIndex,
    status,
    daysAgo,
    reviewedDaysAgo
  )
})

export const mockApplicationsMap = new Map<UUID, Application>()
mockApplications.forEach(app => {
  mockApplicationsMap.set(app.id, app)
})

