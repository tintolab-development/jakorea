/**
 * 면접 관련 API 서비스
 * Phase 4.3: 강사/봉사자 면접 및 승인 프로세스
 */

import type { Interview, InstructorApplicationFormData } from '@/types/interview'
import type { InterviewStatus } from '@/types/user'
import { mockInterviews } from '@/data/mock/interviews'
import type { UUID } from '@/types/index'

function generateUUID(): string {
  return `interview-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`
}

/**
 * 면접 필요 여부 판단
 * 참여이력이 0개이면 면접 필요 (PENDING), 1개 이상이면 면접 불필요 (NOT_REQUIRED)
 */
export function determineInterviewStatus(participationHistory: number): InterviewStatus {
  return participationHistory === 0 ? 'PENDING' : 'NOT_REQUIRED'
}

/**
 * 강사/봉사자 신청 접수
 * @param formData 신청 폼 데이터
 * @param userId 신청한 사용자 ID
 * @returns 생성된 면접 정보
 */
export async function submitInstructorApplication(
  formData: InstructorApplicationFormData,
  userId: UUID
): Promise<Interview> {
  // 면접 필요 여부 판단
  const status = determineInterviewStatus(formData.participationHistory)

  // 면접 정보 생성
  const interview: Interview = {
    id: generateUUID(),
    userId,
    userRole: formData.role,
    status,
    participationHistory: formData.participationHistory,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // 참여이력이 있으면 자동 승인 처리
  if (status === 'NOT_REQUIRED') {
    // 자동 승인: 참여이력이 있으면 즉시 승인
    interview.status = 'APPROVED'
    interview.approvedAt = new Date().toISOString()
    // TODO: 강사 DB 생성 및 권한 활성화
  }

  // Mock 데이터에 추가 (실제로는 API 호출)
  mockInterviews.push(interview)

  return interview
}

/**
 * 면접 일정 생성/수정
 * @param interviewId 면접 ID
 * @param scheduleData 면접 일정 데이터
 * @returns 업데이트된 면접 정보
 */
export async function scheduleInterview(
  interviewId: UUID,
  scheduleData: {
    scheduledAt: string
    location?: string
    interviewerId?: UUID
    notes?: string
  }
): Promise<Interview> {
  const interview = mockInterviews.find(i => i.id === interviewId)
  if (!interview) {
    throw new Error('면접을 찾을 수 없습니다.')
  }

  // 면접 일정 업데이트
  interview.scheduledAt = scheduleData.scheduledAt
  interview.location = scheduleData.location
  interview.interviewerId = scheduleData.interviewerId
  interview.status = 'SCHEDULED'
  interview.updatedAt = new Date().toISOString()

  return interview
}

/**
 * 면접 결과 입력
 * @param interviewId 면접 ID
 * @param resultData 면접 결과 데이터
 * @returns 업데이트된 면접 정보
 */
export async function submitInterviewResult(
  interviewId: UUID,
  resultData: {
    result: 'PASS' | 'FAIL'
    notes?: string
  }
): Promise<Interview> {
  const interview = mockInterviews.find(i => i.id === interviewId)
  if (!interview) {
    throw new Error('면접을 찾을 수 없습니다.')
  }

  // 면접 결과 업데이트
  interview.interviewResult = resultData.result
  interview.interviewNotes = resultData.notes
  interview.status = 'COMPLETED'
  interview.updatedAt = new Date().toISOString()

  return interview
}

/**
 * 면접 승인/반려
 * @param interviewId 면접 ID
 * @param approvalData 승인/반려 데이터
 * @returns 업데이트된 면접 정보
 */
export async function approveOrRejectInterview(
  interviewId: UUID,
  approvalData: {
    approved: boolean
    reason?: string
    approvedBy: UUID
  }
): Promise<Interview> {
  const interview = mockInterviews.find(i => i.id === interviewId)
  if (!interview) {
    throw new Error('면접을 찾을 수 없습니다.')
  }

  if (approvalData.approved) {
    // 승인 처리
    interview.status = 'APPROVED'
    interview.approvedAt = new Date().toISOString()
    interview.approvedBy = approvalData.approvedBy
    // TODO: 강사 DB 생성 및 권한 활성화
  } else {
    // 반려 처리
    interview.status = 'REJECTED'
    interview.rejectedAt = new Date().toISOString()
    interview.rejectedBy = approvalData.approvedBy
    interview.rejectionReason = approvalData.reason
  }

  interview.updatedAt = new Date().toISOString()

  return interview
}

/**
 * 면접 목록 조회
 * @param filters 필터 옵션
 * @returns 면접 목록
 */
export async function getInterviews(filters?: {
  status?: InterviewStatus
  userRole?: 'INSTRUCTOR' | 'VOLUNTEER'
  userId?: UUID
}): Promise<Interview[]> {
  let interviews = [...mockInterviews]

  // 필터링
  if (filters?.status) {
    interviews = interviews.filter(i => i.status === filters.status)
  }
  if (filters?.userRole) {
    interviews = interviews.filter(i => i.userRole === filters.userRole)
  }
  if (filters?.userId) {
    interviews = interviews.filter(i => i.userId === filters.userId)
  }

  return interviews
}

/**
 * 면접 상세 조회
 * @param interviewId 면접 ID
 * @returns 면접 정보
 */
export async function getInterviewById(interviewId: UUID): Promise<Interview | null> {
  return mockInterviews.find(i => i.id === interviewId) || null
}

/**
 * 사용자 ID로 면접 조회
 * @param userId 사용자 ID
 * @returns 면접 정보
 */
export async function getInterviewByUserId(userId: UUID): Promise<Interview | null> {
  return mockInterviews.find(i => i.userId === userId) || null
}

