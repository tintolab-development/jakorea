/**
 * 면접 Mock 데이터
 * Phase 4.3: 강사/수강자 면접 및 승인 프로세스
 */

import type { Interview } from '@/types/interview'

function generateUUID(): string {
  return `interview-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`
}

// Mock 면접 데이터
export const mockInterviews: Interview[] = [
  {
    id: generateUUID(),
    userId: 'user-1',
    userRole: 'INSTRUCTOR',
    status: 'PENDING',
    participationHistory: 0,
    createdAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date('2024-01-15').toISOString(),
  },
  {
    id: generateUUID(),
    userId: 'user-2',
    userRole: 'INSTRUCTOR',
    status: 'SCHEDULED',
    scheduledAt: new Date('2024-01-20T14:00:00').toISOString(),
    location: '서울 본사 회의실',
    participationHistory: 0,
    createdAt: new Date('2024-01-16').toISOString(),
    updatedAt: new Date('2024-01-18').toISOString(),
  },
  {
    id: generateUUID(),
    userId: 'user-3',
    userRole: 'STUDENT',
    status: 'NOT_REQUIRED',
    participationHistory: 3,
    createdAt: new Date('2024-01-17').toISOString(),
    updatedAt: new Date('2024-01-17').toISOString(),
  },
  {
    id: generateUUID(),
    userId: 'user-4',
    userRole: 'INSTRUCTOR',
    status: 'COMPLETED',
    scheduledAt: new Date('2024-01-18T10:00:00').toISOString(),
    interviewResult: 'PASS',
    interviewNotes: '우수한 강의 경험과 전문성을 보유하고 있습니다.',
    participationHistory: 0,
    createdAt: new Date('2024-01-10').toISOString(),
    updatedAt: new Date('2024-01-18').toISOString(),
  },
  {
    id: generateUUID(),
    userId: 'user-5',
    userRole: 'INSTRUCTOR',
    status: 'APPROVED',
    instructorId: generateUUID(),
    approvedAt: new Date('2024-01-19').toISOString(),
    approvedBy: 'admin-1',
    participationHistory: 2,
    createdAt: new Date('2024-01-05').toISOString(),
    updatedAt: new Date('2024-01-19').toISOString(),
  },
  {
    id: generateUUID(),
    userId: 'user-6',
    userRole: 'STUDENT',
    status: 'REJECTED',
    rejectedAt: new Date('2024-01-12').toISOString(),
    rejectedBy: 'admin-1',
    rejectionReason: '면접 결과를 바탕으로 현재는 적합하지 않다고 판단됩니다.',
    participationHistory: 0,
    createdAt: new Date('2024-01-08').toISOString(),
    updatedAt: new Date('2024-01-12').toISOString(),
  },
]

/**
 * 면접 ID로 조회
 */
export function getInterviewById(id: string): Interview | undefined {
  return mockInterviews.find(interview => interview.id === id)
}

/**
 * 사용자 ID로 면접 조회
 */
export function getInterviewByUserId(userId: string): Interview | undefined {
  return mockInterviews.find(interview => interview.userId === userId)
}

/**
 * 상태별 면접 목록 조회
 */
export function getInterviewsByStatus(status: Interview['status']): Interview[] {
  return mockInterviews.filter(interview => interview.status === status)
}

/**
 * 면접 필요 대상자 목록 (PENDING, SCHEDULED)
 */
export function getPendingInterviews(): Interview[] {
  return mockInterviews.filter(
    interview => interview.status === 'PENDING' || interview.status === 'SCHEDULED'
  )
}
