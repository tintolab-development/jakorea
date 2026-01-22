/**
 * 면접 관련 타입 정의
 * Phase 4.3: 강사/봉사자 면접 및 승인 프로세스
 */

import type { UUID, DateValue } from './index'
import type { InterviewStatus, UserRole } from './user'

/**
 * 면접 정보
 */
export interface Interview {
  id: UUID
  userId: UUID // 신청한 사용자 ID
  userRole: UserRole // 'INSTRUCTOR' | 'STUDENT'
  instructorId?: UUID // 강사 DB와 연결 (승인 후)
  // 면접 일정
  scheduledAt?: DateValue // 면접 일정
  location?: string // 면접 장소
  interviewerId?: UUID // 면접관 ID (관리자)
  // 면접 결과
  status: InterviewStatus
  interviewNotes?: string // 면접 노트
  interviewResult?: 'PASS' | 'FAIL' // 면접 결과
  // 승인 정보
  approvedAt?: DateValue // 승인 일자
  approvedBy?: UUID // 승인한 관리자 ID
  rejectedAt?: DateValue // 반려 일자
  rejectedBy?: UUID // 반려한 관리자 ID
  rejectionReason?: string // 반려 사유
  // 참여이력
  participationHistory: number // 참여이력 개수
  // 타임스탬프
  createdAt: DateValue
  updatedAt: DateValue
}

/**
 * 강사/수강자 신청 폼 데이터
 */
export interface InstructorApplicationFormData {
  // 기본 정보
  name: string
  email: string
  phone: string
  region: string // 지역
  specialty: string[] // 전문분야
  // 참여이력
  participationHistory: number // 참여이력 개수
  // 추가 정보
  experience?: string // 이력
  availableTime?: string // 가능시간
  // 신청 타입
  // Phase 0.1.1: INDIVIDUAL, SCHOOL 추가
  role: 'INSTRUCTOR' | 'INDIVIDUAL' | 'SCHOOL' | 'STUDENT'
}

/**
 * 면접 일정 생성/수정 데이터
 */
export interface InterviewScheduleData {
  scheduledAt: DateValue
  location?: string
  interviewerId?: UUID
  notes?: string
}

/**
 * 면접 결과 입력 데이터
 */
export interface InterviewResultData {
  result: 'PASS' | 'FAIL'
  notes?: string
}

/**
 * 승인/반려 데이터
 */
export interface ApprovalData {
  approved: boolean
  reason?: string // 반려 사유
}



