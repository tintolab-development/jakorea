/**
 * 신청 Mock 데이터
 * Phase 2.2: 50개 이상의 다양한 상태를 가진 신청 데이터
 */

import type { Application, UUID } from '../../types'
import { mockPrograms } from './programs'
import { mockSchools } from './schools'
import { mockInstructors } from './instructors'
import { mockUsers } from './users'
import { getApplicationPathByProgramId } from './application-paths'

// Phase 0.1.1: INDIVIDUAL, SCHOOL 추가
const mockIndividualUsers = mockUsers.filter(u => u.role === 'INDIVIDUAL')
const mockSchoolUsers = mockUsers.filter(u => u.role === 'SCHOOL')
// 하위 호환성
const mockStudentUsers = mockUsers.filter(u => u.role === 'STUDENT')
const mockVolunteerUsers = mockUsers.filter(u => u.role === 'VOLUNTEER')

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
  const round =
    roundIndex !== null && program.rounds[roundIndex] ? program.rounds[roundIndex] : null

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
  } else if (subjectType === 'volunteer') {
    // Phase 0.1.1: mockIndividualUsers 우선 사용
    subjectId = (mockIndividualUsers[subjectIndex % mockIndividualUsers.length]?.id ||
      mockVolunteerUsers[subjectIndex % mockVolunteerUsers.length]?.id ||
      mockUsers[subjectIndex % mockUsers.length].id) as UUID
  } else if (subjectType === 'student') {
    // Phase 0.1.1: mockIndividualUsers, mockSchoolUsers 우선 사용
    subjectId = (mockIndividualUsers[subjectIndex % mockIndividualUsers.length]?.id ||
      mockSchoolUsers[subjectIndex % mockSchoolUsers.length]?.id ||
      mockStudentUsers[subjectIndex % mockStudentUsers.length]?.id ||
      mockUsers[subjectIndex % mockUsers.length].id) as UUID
  } else {
    subjectId = mockSchools[subjectIndex % mockSchools.length].id
  }

  return {
    id,
    programId: program.id,
    roundId: round?.id,
    applicationPathId: getApplicationPathByProgramId(program.id)?.id,
    subjectType,
    subjectId,
    status,
    notes:
      Math.random() > 0.7
        ? `신청 메모: ${subjectType === 'school' ? '학교' : subjectType === 'instructor' ? '강사' : subjectType === 'volunteer' ? '봉사자' : '학생'} 신청 관련 추가 정보`
        : undefined,
    submittedAt: submittedAt.toISOString(),
    reviewedAt,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  }
}

const statuses: Application['status'][] = [
  'submitted',
  'reviewing',
  'approved',
  'rejected',
  'cancelled',
]
const subjectTypes: Application['subjectType'][] = ['school', 'student', 'instructor', 'volunteer']

// 기본 50개 Application 생성
const baseApplications: Application[] = Array.from({ length: 50 }, (_, index) => {
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

// Phase 4.1: 참여자 조회를 위한 추가 school/student 타입 Application (30개 추가)
const participantApplications: Application[] = Array.from({ length: 30 }, (_, index) => {
  const programIndex = Math.floor(Math.random() * mockPrograms.length)
  const program = mockPrograms[programIndex]
  const hasRound = program.rounds.length > 0 && Math.random() > 0.3
  const roundIndex = hasRound ? Math.floor(Math.random() * program.rounds.length) : null
  // school과 student 타입만 생성 (참여자 조회용)
  const subjectType = Math.random() > 0.5 ? 'school' : 'student'
  // Phase 0.1.1: mockIndividualUsers, mockSchoolUsers 포함
  const subjectIndex = Math.floor(
    Math.random() *
      Math.max(
        mockSchools.length,
        mockIndividualUsers.length,
        mockSchoolUsers.length,
        mockStudentUsers.length
      )
  )
  const status = statuses[Math.floor(Math.random() * statuses.length)]
  const daysAgo = Math.floor(Math.random() * 60) + 1
  const reviewedDaysAgo = status !== 'submitted' ? Math.floor(Math.random() * daysAgo) : undefined

  return createApplication(
    `app-participant-${String(index + 1).padStart(3, '0')}`,
    programIndex,
    roundIndex,
    subjectType,
    subjectIndex,
    status,
    daysAgo,
    reviewedDaysAgo
  )
})

export const mockApplications: Application[] = [...baseApplications, ...participantApplications]

export const mockApplicationsMap = new Map<UUID, Application>()
mockApplications.forEach(app => {
  mockApplicationsMap.set(app.id, app)
})




