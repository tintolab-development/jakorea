/**
 * 신청 Mock 데이터
 * Phase 2.2: 50개 이상의 다양한 상태를 가진 신청 데이터
 */

import type { Application, UUID } from '../../types'
import type { ApplicationProgressStatus } from '../../types/application-progress'
import { APPLICATION_PROGRESS_ORDER } from '../../types/application-progress'
import { mockPrograms } from './programs'
import { mockSchools } from './schools'
import { mockInstructors } from './instructors'
import {
  mockUsers,
  MOCK_SCHOOL_SEOUL_USER_ID,
  MOCK_SCHOOL_BUSAN_USER_ID,
  MOCK_SCHOOL_DAEGU_USER_ID,
  MOCK_SCHOOL_INCHEON_USER_ID,
} from './users'
import { getApplicationPathByProgramId } from './application-paths'
import { programLectureHistoryDemoApplications } from './program-lecture-history-demo'

const mockIndividualUsers = mockUsers.filter(u => u.role === 'INDIVIDUAL')
const mockSchoolUsers = mockUsers.filter(u => u.role === 'SCHOOL')

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
    // volunteer 타입은 INDIVIDUAL 사용자로 매핑
    subjectId = (mockIndividualUsers[subjectIndex % mockIndividualUsers.length]?.id ||
      mockUsers[subjectIndex % mockUsers.length].id) as UUID
  } else if (subjectType === 'student') {
    // student 타입은 INDIVIDUAL 또는 SCHOOL 사용자로 매핑
    subjectId = (mockIndividualUsers[subjectIndex % mockIndividualUsers.length]?.id ||
      mockSchoolUsers[subjectIndex % mockSchoolUsers.length]?.id ||
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
        mockSchoolUsers.length
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

// 회원 상세 > 프로그램 수강 이력 탭용: 특정 회원(목록 상 첫 사용자)에게 수강 이력 2~3건 추가
const memberEnrollmentUser = mockUsers[0] // 목록 첫 번째 회원(관리자 김관리) — 수강 이력 노출용
const memberEnrollmentApplications: Application[] = memberEnrollmentUser
  ? (() => {
      const program = mockPrograms[0]
      const round = program.rounds?.[0] ?? null
      const baseTime = new Date()
      baseTime.setDate(baseTime.getDate() - 14)
      return [
        {
          id: 'app-member-enrollment-1',
          programId: program.id,
          roundId: round?.id,
          applicationPathId: getApplicationPathByProgramId(program.id)?.id,
          subjectType: 'student' as const,
          subjectId: memberEnrollmentUser.id as UUID,
          status: 'approved' as const,
          progressStatus: 'REPORT_SUBMITTED' as ApplicationProgressStatus,
          submittedAt: new Date(baseTime.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          reviewedAt: new Date(baseTime.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(baseTime.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: baseTime.toISOString(),
        },
        {
          id: 'app-member-enrollment-2',
          programId: program.id,
          roundId: round?.id,
          applicationPathId: getApplicationPathByProgramId(program.id)?.id,
          subjectType: 'student' as const,
          subjectId: memberEnrollmentUser.id as UUID,
          status: 'approved' as const,
          progressStatus: 'IN_PROGRESS' as ApplicationProgressStatus,
          submittedAt: new Date(baseTime.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          reviewedAt: new Date(baseTime.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(baseTime.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(baseTime.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'app-member-enrollment-3',
          programId: mockPrograms[1]?.id ?? program.id,
          applicationPathId: getApplicationPathByProgramId(mockPrograms[1]?.id ?? program.id)?.id,
          subjectType: 'student' as const,
          subjectId: memberEnrollmentUser.id as UUID,
          status: 'submitted' as const,
          submittedAt: new Date(baseTime.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(baseTime.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(baseTime.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]
    })()
  : []

// 학교 상세 모달용: 고정 학교 ID별 프로그램 신청 이력 (1~4행은 회원 mock User.id와 동일)
const fixedSchoolIds = [
  MOCK_SCHOOL_SEOUL_USER_ID,
  MOCK_SCHOOL_BUSAN_USER_ID,
  MOCK_SCHOOL_DAEGU_USER_ID,
  MOCK_SCHOOL_INCHEON_USER_ID,
  'school-fixed-05',
  'school-fixed-06',
  'school-fixed-07',
  'school-fixed-08',
  'school-fixed-09',
  'school-fixed-10',
  'school-fixed-11',
  'school-fixed-12',
]
const schoolApprovalStatuses: Application['status'][] = ['approved', 'approved', 'submitted', 'reviewing', 'approved']
const schoolDetailApplications: Application[] = fixedSchoolIds.flatMap((schoolId, sIdx) => {
  const count = 3 + (sIdx % 4) // 3~6건
  return Array.from({ length: count }, (_, i) => {
    const progIdx = (sIdx * 3 + i) % mockPrograms.length
    const program = mockPrograms[progIdx]
    const round = program.rounds.length > 0 ? program.rounds[0] : null
    const daysAgo = 10 + sIdx * 5 + i * 7
    const status = schoolApprovalStatuses[(sIdx + i) % schoolApprovalStatuses.length]
    const submittedAt = new Date()
    submittedAt.setDate(submittedAt.getDate() - daysAgo)
    const reviewedAt = status !== 'submitted'
      ? new Date(submittedAt.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString()
      : undefined
    return {
      id: `app-school-detail-${sIdx}-${i}`,
      programId: program.id,
      roundId: round?.id,
      applicationPathId: getApplicationPathByProgramId(program.id)?.id,
      subjectType: 'school' as const,
      subjectId: schoolId as UUID,
      status,
      submittedAt: submittedAt.toISOString(),
      reviewedAt,
      createdAt: submittedAt.toISOString(),
      updatedAt: (reviewedAt ?? submittedAt).toString(),
    }
  })
})

// Phase 0.2.4: 승인된 신청에 progressStatus 부여 (타임라인용)
const rawApplications: Application[] = [
  ...baseApplications,
  ...participantApplications,
  ...memberEnrollmentApplications,
  ...schoolDetailApplications,
  ...programLectureHistoryDemoApplications,
]
export const mockApplications: Application[] = rawApplications.map((app, index) => {
  if (app.status !== 'approved') return app
  // 이미 progressStatus가 있으면 유지 (회원 수강 이력용 등)
  if (app.progressStatus) return app
  const progressIndex = index % APPLICATION_PROGRESS_ORDER.length
  const progressStatus = APPLICATION_PROGRESS_ORDER[progressIndex] as ApplicationProgressStatus
  return { ...app, progressStatus }
})

export const mockApplicationsMap = new Map<UUID, Application>()
mockApplications.forEach(app => {
  mockApplicationsMap.set(app.id, app)
})




