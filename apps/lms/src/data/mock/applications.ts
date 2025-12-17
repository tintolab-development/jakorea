/**
 * 신청 Mock 데이터
 * Phase 2.2: 다양한 신청 케이스 생성
 */

import type { Application, UUID } from '../../types'
import { mockPrograms } from './programs'
import { mockSchools } from './schools'
import { mockInstructors } from './instructors'

// 신청 생성 함수
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
  const program = mockPrograms[programIndex]
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

  // 주체 ID 결정 (subjectType에 따라)
  let subjectId: UUID
  if (subjectType === 'school') {
    subjectId = mockSchools[subjectIndex % mockSchools.length].id
  } else if (subjectType === 'instructor') {
    subjectId = mockInstructors[subjectIndex % mockInstructors.length].id
  } else {
    // student는 임시로 학교 ID 사용 (실제로는 별도 student 데이터 필요)
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

// Mock 데이터 생성 (최소 35개)
export const mockApplications: Application[] = [
  // 프로그램 0: 학교 신청들 (다양한 상태)
  createApplication('app-001', 0, 0, 'school', 0, 'submitted', 2),
  createApplication('app-002', 0, 0, 'school', 1, 'reviewing', 5, 3),
  createApplication('app-003', 0, 0, 'school', 2, 'approved', 10, 8),
  createApplication('app-004', 0, 1, 'school', 3, 'approved', 12, 10),
  createApplication('app-005', 0, 1, 'school', 4, 'rejected', 15, 12),

  // 프로그램 1: 학교 + 학생 신청
  createApplication('app-006', 1, 0, 'school', 5, 'approved', 8, 6),
  createApplication('app-007', 1, 0, 'student', 0, 'submitted', 3),
  createApplication('app-008', 1, 0, 'student', 1, 'reviewing', 6, 4),
  createApplication('app-009', 1, 1, 'school', 6, 'approved', 9, 7),
  createApplication('app-010', 1, 1, 'student', 2, 'rejected', 13, 11),

  // 프로그램 2: 강사 신청
  createApplication('app-011', 2, null, 'instructor', 0, 'submitted', 1),
  createApplication('app-012', 2, null, 'instructor', 1, 'reviewing', 4, 2),
  createApplication('app-013', 2, null, 'instructor', 2, 'approved', 7, 5),
  createApplication('app-014', 2, 0, 'instructor', 3, 'approved', 11, 9),
  createApplication('app-015', 2, 0, 'instructor', 4, 'cancelled', 14, 13),

  // 프로그램 3: 다양한 신청
  createApplication('app-016', 3, 0, 'school', 7, 'approved', 6, 4),
  createApplication('app-017', 3, 0, 'student', 3, 'reviewing', 4, 2),
  createApplication('app-018', 3, 1, 'school', 8, 'submitted', 2),
  createApplication('app-019', 3, 1, 'instructor', 5, 'approved', 9, 7),
  createApplication('app-020', 3, 1, 'student', 4, 'rejected', 12, 10),

  // 프로그램 4: 혼합 신청
  createApplication('app-021', 4, null, 'school', 9, 'approved', 5, 3),
  createApplication('app-022', 4, null, 'instructor', 6, 'reviewing', 3, 1),
  createApplication('app-023', 4, 0, 'school', 10, 'submitted', 1),
  createApplication('app-024', 4, 0, 'student', 5, 'approved', 8, 6),
  createApplication('app-025', 4, 0, 'instructor', 7, 'cancelled', 11, 9),

  // 프로그램 5-11: 추가 신청들
  createApplication('app-026', 5, 0, 'school', 11, 'approved', 7, 5),
  createApplication('app-027', 5, 0, 'school', 12, 'reviewing', 4, 2),
  createApplication('app-028', 6, null, 'instructor', 8, 'approved', 10, 8),
  createApplication('app-029', 6, null, 'instructor', 9, 'submitted', 2),
  createApplication('app-030', 7, 0, 'school', 13, 'approved', 9, 7),

  createApplication('app-031', 7, 1, 'student', 6, 'reviewing', 5, 3),
  createApplication('app-032', 8, null, 'school', 14, 'approved', 8, 6),
  createApplication('app-033', 9, 0, 'instructor', 10, 'submitted', 3),
  createApplication('app-034', 10, null, 'school', 15, 'reviewing', 6, 4),
  createApplication('app-035', 11, 0, 'student', 7, 'approved', 11, 9),
]

// 효율적인 조회를 위한 Map
export const mockApplicationsMap = new Map<UUID, Application>()
mockApplications.forEach(app => {
  mockApplicationsMap.set(app.id, app)
})

