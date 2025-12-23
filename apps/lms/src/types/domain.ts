/**
 * 도메인 엔티티 타입 정의
 * project-system-prompt.md 기반
 */

import type { UUID, Status, DateValue } from './index'

// 스폰서
export interface Sponsor {
  id: UUID
  name: string
  description?: string
  contactInfo?: string
  securityMemo?: string // 보안/정책 메모
  createdAt: DateValue
  updatedAt: DateValue
}

// 프로그램 유형
export type ProgramType = 'online' | 'offline' | 'hybrid'

// 프로그램 진행 형태
export type ProgramFormat = 'workshop' | 'seminar' | 'course' | 'lecture' | 'other'

// 프로그램
export interface Program {
  id: UUID
  sponsorId: UUID
  title: string
  type: ProgramType
  format: ProgramFormat
  description?: string
  rounds: ProgramRound[] // 회차 정보
  startDate: DateValue
  endDate: DateValue
  status: Status
  settlementRuleId?: UUID // 정산 규칙 참조
  createdAt: DateValue
  updatedAt: DateValue
}

// 프로그램 회차
export interface ProgramRound {
  id: UUID
  programId: UUID
  roundNumber: number
  startDate: DateValue
  endDate: DateValue
  capacity?: number // 정원
  status: Status
}

// 학교
export interface School {
  id: UUID
  name: string
  region: string // 지역
  address?: string
  contactPerson: string // 담당자
  contactPhone?: string
  contactEmail?: string
  createdAt: DateValue
  updatedAt: DateValue
}

// 강사
export interface Instructor {
  id: UUID
  name: string
  contactPhone?: string
  contactEmail?: string
  region: string // 지역
  specialty: string[] // 전문분야
  availableTime?: string // 가능시간 (TODO: 정책 결정 필요)
  experience?: string // 이력
  rating?: number // 평가 (0-5)
  bankAccount?: string // 정산 계좌 (민감정보, 마스킹 필요)
  createdAt: DateValue
  updatedAt: DateValue
}

// 신청 주체 타입
export type ApplicationSubjectType = 'school' | 'student' | 'instructor'

// 신청 상태
export type ApplicationStatus =
  | 'submitted' // 접수
  | 'reviewing' // 검토
  | 'approved' // 확정
  | 'rejected' // 거절
  | 'cancelled' // 취소

// 신청
export interface Application {
  id: UUID
  programId: UUID
  roundId?: UUID // 회차별 신청 시
  subjectType: ApplicationSubjectType
  subjectId: UUID // 학교/학생/강사 ID
  status: ApplicationStatus
  notes?: string
  submittedAt: DateValue
  reviewedAt?: DateValue
  createdAt: DateValue
  updatedAt: DateValue
}

// 일정
export interface Schedule {
  id: UUID
  programId: UUID
  roundId?: UUID
  title: string
  date: DateValue
  startTime: string // HH:mm 형식
  endTime: string // HH:mm 형식
  location?: string // 오프라인 장소
  onlineLink?: string // 온라인 링크
  instructorId?: UUID // 강사 (매칭 후)
  createdAt: DateValue
  updatedAt: DateValue
}

// 매칭
export interface Matching {
  id: UUID
  programId: UUID
  roundId?: UUID
  instructorId: UUID
  scheduleId?: UUID
  status: Status
  matchedAt: DateValue
  cancelledAt?: DateValue
  cancellationReason?: string
  // 감사 로그를 위한 변경 이력 (향후 확장)
  history?: MatchingHistory[]
  createdAt: DateValue
  updatedAt: DateValue
}

// 매칭 이력 (감사 로그)
export interface MatchingHistory {
  id: UUID
  matchingId: UUID
  action: 'created' | 'updated' | 'cancelled'
  previousValue?: string
  newValue?: string
  changedBy?: UUID // 변경한 사용자 (향후 인증 시스템 연동)
  changedAt: DateValue
}

// 정산 항목 타입
export type SettlementItemType = 'instructor_fee' | 'transportation' | 'accommodation' | 'other'

// 정산 항목
export interface SettlementItem {
  type: SettlementItemType
  description: string
  amount: number
}

// 정산 상태
export type SettlementStatus = 'pending' | 'calculated' | 'approved' | 'paid' | 'cancelled'

// 정산
export interface Settlement {
  id: UUID
  programId: UUID
  instructorId: UUID
  matchingId: UUID
  period: string // 월별 또는 프로그램별 (예: "2025-01" 또는 "program-{id}")
  items: SettlementItem[]
  totalAmount: number
  status: SettlementStatus
  documentGeneratedAt?: DateValue
  notes?: string
  createdAt: DateValue
  updatedAt: DateValue
}






