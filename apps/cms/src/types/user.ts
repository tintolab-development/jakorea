/**
 * 사용자 계정 및 권한 타입 정의
 * Phase 0.1.1: 역할/권한 체계 재정의
 * requirements.md §2 역할 및 권한 기준
 */

import type { UUID, DateValue } from './index'

// ===== 역할 정의 =====

// 프론트 사용자 역할 (§2.1)
export type UserRole = 'INDIVIDUAL' | 'SCHOOL' | 'INSTRUCTOR' | 'ADMIN'

/** 강사(INSTRUCTOR) 회원 상세 UI 분기 — API와 필드명 맞출 것 */
export type InstructorMemberProfile = 'school_teacher' | 'instructor_dual' | 'instructor_only'

// 관리자 권한 레벨 (§2.2)
export type AdminLevel = 'MASTER' | 'ADMIN' | 'GENERAL'

// 프로그램 단위 역할 (§백오피스 권한 구조)
export type ProgramRole = 'OWNER' | 'PARTNER' | 'ASSISTANT'


// 강사/봉사자 면접 상태
export type InterviewStatus =
  | 'NOT_REQUIRED' // 면접 불필요 (참여이력 있음)
  | 'PENDING' // 면접 필요 (신청 접수)
  | 'SCHEDULED' // 면접 일정 확정
  | 'COMPLETED' // 면접 완료
  | 'APPROVED' // 승인 완료
  | 'REJECTED' // 반려

/** 소속 교사 목록 행 (학교 상세 mock/API) */
export type SchoolTeacherEmploymentStatus = 'ACTIVE' | 'ON_LEAVE' | 'WITHDRAWN' | 'TRANSFERRED'

export interface SchoolAffiliatedTeacherRow {
  id: UUID
  name: string
  assignedGrade: string
  phone: string
  email: string
  employmentStatus: SchoolTeacherEmploymentStatus
  joinedAt: DateValue
  /** 연결된 CMS 회원 id — 있으면 행 클릭 시 해당 회원 상세로 이동 */
  linkedUserId?: UUID
}

// ===== 사용자 인터페이스 =====

export interface User {
  id: UUID
  email: string
  password: string // Mock 데이터용 (실제로는 해시된 값)
  name: string
  /** 프로필 이미지 URL 또는 data URL */
  profileImageUrl?: string
  phone?: string
  role: UserRole

  // 관리자 전용 (§2.2)
  adminLevel?: AdminLevel
  // 프로그램별 역할 (관리자용, §백오피스 권한 구조)
  programRoles?: Record<string, ProgramRole>

  // 개인(참여자) 전용 (§2.1)
  // - 프로그램 신청(개인)
  // - 신청내역/진행상황 확인
  // - 일정 확인, 과제 제출
  // - 수료증/활동 확인서 발급

  // 학교 전용 (§2.1)
  schoolInfo?: {
    schoolName: string
    address: string
    position?: string // 담당자 직책
    /** CMS mock/상세 — 소속 교사 목록 */
    affiliatedTeachers?: SchoolAffiliatedTeacherRow[]
    // 학생명단 업로드
    // 학교단위 수료증 다운로드
    // 강사 대기실, 급식 가능 여부 등
  }

  /** 강사 — 소속 학교(학교 회원) user id (mock/CMS 연동) */
  affiliatedSchoolUserId?: UUID

  /** 소속 학교 기관명 (상세 타이틀 등 — API 또는 mock) */
  affiliatedSchoolName?: string

  /** 강사 상세: 일반 교사 / 강사 겸 교사 / 순수 강사 UI */
  instructorMemberProfile?: InstructorMemberProfile

  // 강사 전용 (§2.1)
  instructorInfo?: {
    bankName: string
    accountNumber: string
    accountHolder: string
    isBusinessIncome: boolean // 사업소득자 여부 (3.3% vs 8.8%)
    // 강의 신청, 매칭/일정 확인
    // 강의보고서 제출
    // 강사비/교통비 산출내역 확인
  }

  // 강사 면접 관련 (기존 유지)
  instructorId?: UUID // 강사 DB와 연결
  interviewStatus?: InterviewStatus
  interviewScheduledAt?: DateValue
  interviewCompletedAt?: DateValue
  participationHistory?: number

  // 계정 상태
  isActive: boolean
  lastLoginAt?: DateValue
  createdAt: DateValue
  updatedAt: DateValue

  // 추가 프로필 정보
  bio?: string
  detailAddress?: string
  zipCode?: string

  // 회원 상세 모달 표시용 (선택)
  nameEn?: string
  birthDate?: DateValue
  gender?: string
  affiliation?: string
  socialAccounts?: string[]

  /**
   * 회원 목록 테이블 전용 지표 (API가 내려주면 표시, 없으면 '-' 또는 기존 필드로 추론)
   */
  listMetrics?: UserListRowMetrics
}

/** 목록 화면 열별 부가 데이터 */
export interface UserListRowMetrics {
  /** 학교(기관): 프로그램 신청 횟수 */
  institutionProgramApplicationCount?: number
  /** 학교(기관): 프로그램 수강 횟수 */
  institutionProgramAttendanceCount?: number
  /** 학교(기관): 등록된 교사 수 */
  institutionRegisteredTeacherCount?: number
  /** 강사: 유형 라벨 */
  instructorTypeLabel?: string
  /** 강사: JA 평가 등급 */
  jaEvaluationGrade?: string
  /** 강사: 정산 현황 라벨 */
  settlementStatusLabel?: string
  /** 관리자: 담당 프로그램 수 (없으면 programRoles 키 개수 사용) */
  managedProgramCount?: number
  /** 관리자 목록: 권한 유형 태그 (없으면 programRoles로 추론) */
  adminPermissionVariant?: 'manager' | 'partner' | 'viewer'
  /** 일반 교사 상세: 재직 현황 라벨 */
  employmentStatusLabel?: string
  /** 일반 교사 상세: 담당 학년 등 */
  instructorAssignedGrade?: string
  /** 강사 상세: 최종 학력 한 줄 */
  highestEducationLabel?: string
  /** 강사 상세: 소속·경력 요약(우선 표시, 없으면 학교·유형·연수·등급으로 조합) */
  instructorCareerSummaryLabel?: string
  /** 강사 상세: 경력 연수 표기(예: "3년") — 조합 시 사용 */
  instructorCareerYearsLabel?: string
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



