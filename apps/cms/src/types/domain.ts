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

// 프로그램 카테고리 (학교 프로그램 vs 개인 프로그램)
export type ProgramCategory = 'school' | 'individual'

// 신청 경로 타입
export type ApplicationPathType = 'google_form' | 'internal' // 구글폼 / 자동화 프로그램 내 신청

// 신청 경로
export interface ApplicationPath {
  id: UUID
  programId: UUID
  pathType: ApplicationPathType
  googleFormUrl?: string // 구글폼 링크 (pathType이 'google_form'일 때)
  guideMessage?: string // 신청 경로별 안내 문구
  isActive: boolean // 활성화 여부
  createdAt: DateValue
  updatedAt: DateValue
}

// 프로그램
export interface Program {
  id: UUID
  sponsorId: UUID
  title: string
  type: ProgramType
  format: ProgramFormat
  category: ProgramCategory // 학교 프로그램 vs 개인 프로그램
  description?: string
  rounds: ProgramRound[] // 회차 정보
  startDate: DateValue
  endDate: DateValue
  status: Status
  settlementRuleId?: UUID // 정산 규칙 참조
  applicationPathId?: UUID // 신청 경로 참조 (V3 Phase 7)
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
  availableTime?: string // 가능시간
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
  approvalHistories?: Array<{
    id: string
    step: 'pending' | 'review' | 'approval' | 'payment'
    action: 'submitted' | 'reviewed' | 'approved' | 'rejected' | 'paid' | 'cancelled'
    actionLabel: string
    reviewerName?: string
    comment?: string
    createdAt: DateValue
  }> // 승인 이력 (V3 Phase 4)
  createdAt: DateValue
  updatedAt: DateValue
}

// To-do 타입
export type TodoType = 'REPORT' | 'COMPLETE' | 'REVIEW' | 'SUBMIT' | 'OTHER'

// To-do
export interface Todo {
  id: UUID
  userId?: UUID // 사용자 ID (향후 인증 시스템 연동)
  type: TodoType
  label: string // To-do 제목
  description?: string // 작업 설명
  expectedResult?: string // 완료 후 결과 안내
  targetUrl: string // 실행할 URL
  priority: number // 우선순위 (낮을수록 높음)
  completed: boolean
  completedAt?: DateValue
  createdAt: DateValue
  updatedAt: DateValue
}

// 보고서 타입
export type ReportType = 'lecture' | 'volunteer' | 'program'

// 보고서 필드 타입
export type ReportFieldType = 'text' | 'textarea' | 'number' | 'date' | 'select'

// 보고서 필드
export interface ReportField {
  id: string
  label: string
  type: ReportFieldType
  required: boolean
  placeholder?: string
  options?: Array<{ value: string; label: string }> // select 타입일 경우
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

// 보고서
export interface Report {
  id: UUID
  type: ReportType
  activityId?: UUID // 강의/봉사 활동 ID
  programId?: UUID // 프로그램 ID (프로그램 보고서일 경우)
  fields: Record<string, string | number | DateValue> // 필드 ID를 키로 하는 값
  submittedAt: DateValue
  createdAt: DateValue
  updatedAt: DateValue
}

// 강의 상태
export type LectureStatus = 'LECT_01' | 'LECT_02' | 'LECT_03' // 예정, 진행, 완료

// 봉사 상태
export type VolunteerStatus = 'VOL_01' | 'VOL_02' | 'VOL_03' // 예정, 진행, 완료

// 다음 필수 행동 타입
export type NextRequiredActionType = 'NONE' | 'COMPLETE' | 'REPORT'

// 다음 필수 행동
export interface NextRequiredAction {
  type: NextRequiredActionType
  targetUrl?: string
}

// 강의 활동
export interface LectureActivity {
  id: UUID
  scheduleId: UUID
  programId: UUID
  instructorId: UUID
  status: LectureStatus
  roleDescription: string // 역할 및 수행 안내
  nextRequiredAction: NextRequiredAction
  createdAt: DateValue
  updatedAt: DateValue
}

// 봉사 활동
export interface VolunteerActivity {
  id: UUID
  scheduleId: UUID
  programId: UUID
  volunteerId: UUID
  status: VolunteerStatus
  roleDescription: string // 봉사 역할 및 수행 안내
  volunteerHoursInfo?: {
    hours: number // 인정 봉사시간
  }
  nextRequiredAction: NextRequiredAction
  createdAt: DateValue
  updatedAt: DateValue
}

// 사용자 주요 상태
export type PrimaryStatus =
  | 'APPLY_01' // 승인 대기
  | 'APPLY_02' // 반려
  | 'APPLY_03' // 승인 완료
  | 'SCH_01' // 일정 예정
  | 'SCH_02' // 일정 진행
  | 'SCH_03' // 일정 종료
  | 'LECT_03' // 강의 완료
  | 'VOL_03' // 봉사 완료
  | 'NONE' // 상태 없음

// 이력 최종 상태
export type FinalStatus = 'COMPLETED' | 'CONFIRMED' | 'CANCELLED'

// 참여 역할
export type ParticipationRole = 'INSTRUCTOR' | 'VOLUNTEER' | 'PARTICIPANT'

// 정산 상태
export type PaymentStatus = 'PAY_01' | 'PAY_02' | 'PAY_03' | 'PAY_04' // 대기, 산출, 승인, 지급 완료

// 증빙 문서
export interface Certificate {
  id: UUID
  title: string
  downloadUrl: string
  issuedAt: DateValue
}

// 사용자 이력
export interface UserHistory {
  id: UUID
  programId: UUID
  role: ParticipationRole
  completedAt: DateValue
  finalStatus: FinalStatus
  // 강사인 경우
  paymentStatus?: PaymentStatus
  paymentAmount?: number
  // 봉사자인 경우
  volunteerHours?: number
  // 공통
  certificates?: Certificate[]
  createdAt: DateValue
  updatedAt: DateValue
}

// 마이페이지 데이터
export interface MyPageData {
  primaryStatus: PrimaryStatus
  reasonPublic?: string // 반려 사유 등
  todos: Todo[] // 최대 2개
  upcomingSchedules?: Schedule[] // 승인 완료된 일정
  historySummary?: UserHistory[] // 최대 3개
}




