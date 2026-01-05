/**
 * 사용자 계정 및 권한 타입 정의
 * MVP_ROADMAP_V4 기반
 */

import type { UUID, DateValue } from './index'

// 사용자 권한 타입
export type UserRole = 'ADMIN' | 'INSTRUCTOR' | 'VOLUNTEER' | 'STUDENT'

// 강사/봉사자 면접 상태
export type InterviewStatus =
  | 'NOT_REQUIRED' // 면접 불필요 (참여이력 있음)
  | 'PENDING' // 면접 필요 (신청 접수)
  | 'SCHEDULED' // 면접 일정 확정
  | 'COMPLETED' // 면접 완료
  | 'APPROVED' // 승인 완료
  | 'REJECTED' // 반려

// 사용자 계정
export interface User {
  id: UUID
  email: string
  password: string // Mock 데이터용 (실제로는 해시된 값)
  name: string
  role: UserRole
  // 강사/봉사자 관련 필드
  instructorId?: UUID // 강사 DB와 연결 (강사/봉사자일 경우)
  interviewStatus?: InterviewStatus // 면접 상태 (강사/봉사자일 경우)
  interviewScheduledAt?: DateValue // 면접 일정 (면접 필요 시)
  interviewCompletedAt?: DateValue // 면접 완료 일자
  participationHistory?: number // 참여이력 개수 (면접 필요 여부 판단)
  // 계정 상태
  isActive: boolean
  lastLoginAt?: DateValue
  createdAt: DateValue
  updatedAt: DateValue
}

// 로그인 요청
export interface LoginRequest {
  email: string
  password: string
}

// 로그인 응답
export interface LoginResponse {
  user: Omit<User, 'password'> // 비밀번호 제외
  token: string // JWT 토큰 (Mock)
  expiresAt: DateValue
}

