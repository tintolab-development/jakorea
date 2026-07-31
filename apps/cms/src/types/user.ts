/**
 * 사용자 계정 및 권한 타입 정의
 * Phase 0.1.1: 역할/권한 체계 재정의
 * requirements.md §2 역할 및 권한 기준
 */

import type { UUID, DateValue } from './index'

export interface TermsAgreementRow {
  termsType?: string
  termsVersion?: string
  required?: boolean
  agreed?: boolean
  agreedAt?: string
  actorType?: string
  sourceFlow?: string
}

export interface UserGuardianInfo {
  guardianName?: string
  relation?: string
  phone?: string
  consentStatus?: string
  consentedAt?: string
}

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
  /** remote: `PATCH …/affiliated-teachers/{teacherMemberId}/employment-status` 용 */
  teacherMemberId?: number
}

/** 학교 상세 소속 교사 행 → 교사 상세 drill-down */
export interface AffiliatedTeacherLinkTarget {
  userId: string
  teacherMemberId?: number
  name?: string
  assignedGrade?: string
}

// ===== 사용자 인터페이스 =====

export interface User {
  id: UUID
  /** 백엔드 회원 숫자 ID — remote API 연동 시 목록·상세에서 채움 */
  memberId?: number
  /** admin-accounts API numeric id — 관리자 회원 상세·권한 유형 변경 */
  adminAccountId?: number
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
  /** 1365 자원봉사 포털 ID — 회원 관리 등록 시 저장 */
  id1365?: string
  // - 프로그램 신청(개인)
  // - 신청내역/진행상황 확인
  // - 일정 확인, 과제 제출
  // - 수료증/활동 확인서 발급

  // 학교 전용 (§2.1)
  schoolInfo?: {
    schoolName: string
    address: string
    /** 상세 주소 — 표시 시 address 뒤에만 이어 붙임 */
    addressDetail?: string
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

  /** CMS 회원 상세 — 관리자 공유 메모(빈 값이면 UI에서 안내 문구 표시) */
  adminComment?: string

  /** 회원 권한 승인 페이지에서 관리되는 권한 승인 현황 */
  permissionApprovalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED'
  /** 권한 승인/반려 처리 일시 (권한 승인 현황 기본 노출 기준) */
  permissionApprovalHandledAt?: DateValue
  /** 권한 승인 현황에서 알림 재발송 버튼을 마지막으로 누른 일시 */
  permissionNotificationResentAt?: DateValue

  /**
   * CMS: 관리자 「회원 등록」으로 생성된 이력이 있는지.
   * 직접 등록으로 취급하려면 `identitySelfSignupCompletedAfterAdminRegistration === true`여야 한다.
   * 상세 UI·편집 가능 범위는 `admin-provisioned-member-policy`의
   * `shouldShowCmsMemberInfoEditButton` / `isSelfRegisteredMemberForCmsBasicInfo`,
   * 관리자 회원(`role === 'ADMIN'`)은 `canEditAdminMemberInfo`·`canAccessAdminCommentInAdminDetail`을 따른다.
   */
  registeredByAdmin?: boolean

  /**
   * 관리자 등록 후 본인 직접 가입(추가 절차)을 완료한 경우. true이면 CMS에서 **직접 등록**과 동일하게 취급한다.
   * 기본정보 일괄 수정은 불가(읽기 전용)·관리자 코멘트(및 관리자 회원의 권한 유형)는 CMS 관리자 전원 예외, 강사(INSTRUCTOR)는 강사비 등급도 예외.
   */
  identitySelfSignupCompletedAfterAdminRegistration?: boolean

  // 추가 프로필 정보
  bio?: string
  detailAddress?: string
  /** 자택 주소 상세 — API `homeAddressDetail` / 개인 `addressDetail` */
  detailAddressDetail?: string
  zipCode?: string

  // 회원 상세 모달 표시용 (선택)
  nameEn?: string
  birthDate?: DateValue
  gender?: string
  affiliation?: string
  /** 개인 회원 — API `enrollmentStatus` (`ENROLLED` | `NOT_ENROLLED`) */
  schoolEnrollmentStatus?: 'ENROLLED' | 'NOT_ENROLLED'
  socialAccounts?: string[]
  /** 플랫폼 가입 시 서버가 판정한 만 14세 미만 여부 */
  under14?: boolean
  guardianConsentRequired?: boolean
  /** 만 14세 미만 플랫폼 가입자의 법정대리인 인증 정보 */
  guardianInfo?: UserGuardianInfo

  /** 약관·동의 이력 — `/me` API 연동 시 채움 */
  termsAgreements?: TermsAgreementRow[]

  /** 강사 instructor-profile — 경력 텍스트 (remote) */
  instructorCareerText?: string
  /** 강사 instructor-profile — 자기소개 (remote) */
  instructorSelfIntroduction?: string
  /** 강사 instructor-profile — 승인 상태 (remote) */
  instructorApprovalStatus?: string
  /** 강사 상세 `certifications[]` — 자격·면허 (remote) */
  instructorCertifications?: InstructorCertificationItem[]

  /**
   * 회원 목록 테이블 전용 지표 (API가 내려주면 표시, 없으면 '-' 또는 기존 필드로 추론)
   */
  listMetrics?: UserListRowMetrics
}

/** 강사 상세·이력서 — 자격증/면허 한 건 */
export interface InstructorCertificationItem {
  id?: number
  name: string
  issuer?: string
  certificateNumber?: string
  issuedDate?: string
  expiresDate?: string
}

/** 목록 화면 열별 부가 데이터 */
export interface UserListRowMetrics {
  /** 학교(기관): 프로그램 신청 횟수 */
  institutionProgramApplicationCount?: number
  /** 학교(기관): 프로그램 수강 횟수 */
  institutionProgramAttendanceCount?: number
  /** 학교(기관): 등록된 교사 수 */
  institutionRegisteredTeacherCount?: number
  /**
   * @deprecated 강사비 등급이 저장되던 구 필드. 신규 코드는 `instructorFeeGradeLabel`을 사용한다.
   */
  instructorTypeLabel?: string
  /** 강사: 강사비 등급 */
  instructorFeeGradeLabel?: string
  /**
   * 회원·권한 UI 전용 강사 신청/소속 구분 (예: JA 강사단, 특강 강사, 제미나이 강사단).
   * 정산의 강사비 등급과 별도 — 없으면 클라이언트가 소속·경력 문구로 추론 가능.
   */
  permissionApplicationTypeLabel?: string
  /** 강사: JA 평가 등급 */
  jaEvaluationGrade?: string
  /** 강사: 정산 현황 라벨 */
  settlementStatusLabel?: string
  /** 관리자: 담당 프로그램 수 — 전체(진행 종료 포함) */
  managedProgramCount?: number
  /** 관리자: 담당 프로그램 중 진행 중인 건수 (`managedProgramCount`와 함께 상세·목록에 표기) */
  managedProgramInProgressCount?: number
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



