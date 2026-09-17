/**
 * 참여 강사 — 타입 및 상수
 */

import type { InstructorSettlementUiStatus } from '@/shared/constants/instructor-settlement-status'
import type { SchoolTeacherEmploymentStatus, InstructorMemberProfile } from '@/types/user'
import type { ApplicantInstructorLectureFeeBasisType } from '@/features/program/shared/model/applicant-instructor'

/** @deprecated `InstructorSettlementUiStatus` 사용 — 하위 호환용 alias */
export type SettlementStatusKey = InstructorSettlementUiStatus

/** 참여 강사 상세 모달·강사 이력서 탭용 (ApplicantInstructorRow와 동일 구조) */
export interface ParticipatingInstructorCareerDetail {
  companyName?: string
  role?: string
  startDate?: string
  endDate?: string
  isCurrent?: boolean
}

export interface ParticipatingInstructorQualification {
  name?: string
  year?: string
}

export interface ParticipatingInstructorAward {
  name?: string
  year?: string
}

/** 참여 강사 상세·강사 이력서 탭 - 학력사항 (강사 추가 모달 educations와 연동) */
export interface ParticipatingInstructorEducationItem {
  schoolType?: string
  status?: string
  schoolName?: string
  major?: string
  enrollmentYear?: string
  graduationYear?: string
}

export interface ParticipatingInstructorRow {
  id: string
  no: number
  instructorName: string
  schoolName: string
  educationGrade: string
  classCount: number
  studentCount: number
  lectureRound: string
  settlementStatus: InstructorSettlementUiStatus
  teacherName: string
  /** Admin participant.memberId — 1일1교 배정 충돌 키 보조 */
  memberId?: string
  /** 저장된 기존 소속 학교/기관 ID */
  affiliationOrganizationId?: number | null
  /** 참여 강사 상세 모달(기본 정보 탭)용 */
  contact?: string
  email?: string
  address?: string
  nameHanja?: string
  nameEnglish?: string
  birthDate?: string
  age?: number
  gender?: string
  militaryStatus?: string
  bankName?: string
  accountNumber?: string
  accountHolder?: string
  profileImageUrl?: string
  oneLineIntro?: string
  educationLevel?: string
  educationSchoolName?: string
  lectureExperienceYears?: number
  /** 강사 이력서 탭용 */
  careerDetails?: ParticipatingInstructorCareerDetail[]
  qualifications?: ParticipatingInstructorQualification[]
  awards?: ParticipatingInstructorAward[]
  /** 강사 이력서 - 학력사항 */
  educations?: ParticipatingInstructorEducationItem[]
  /** 1. 자기소개 및 지원동기 */
  freeWriting1?: string
  /** 2. 청소년 경제 교육의 중요성... */
  freeWriting2?: string
  /** 3. 청소년과 소통할 때... */
  freeWriting3?: string
  /** 4. 교육 중 예기치 않은 상황... */
  freeWriting4?: string
  /** 프로그램 참여 최초 승인 유무 (false면 강사 신규 배정 안내 모달 노출) */
  initialApproval?: boolean
  /** 거주 지역 (참여 강사 목록 필터·테이블용) */
  region?: string
  /** 배정 기관명 목록 (participants enrich 또는 instructor-assignments 조인) */
  assignedOrganizationNames?: string[]
  /** JA 평가 등급 (참여 강사 목록 필터·테이블용) */
  jaEvaluationGrade?: string
  /** 강의 보고서 제출 여부 (캘린더 카드 태그 등) */
  lectureReportSubmitted?: boolean
  /** CMS에서 강사 등록으로 추가된 경우 등 */
  registeredByAdmin?: boolean
  /** 기본 정보 하단 — 강의비 책정 기준(유형·금액, 셀 내 디바이더로 구분) */
  lectureFeeCategory?: string
  lectureFeeAmount?: string
  /** 강의비 책정 기준 — 유형·지급 기준·표시 문자열 (강사 신청 상세와 동일 구조) */
  lectureFeeBasisType?: ApplicantInstructorLectureFeeBasisType
  lectureFeeMeasure?: string
  lectureFeeBasisDisplay?: string
  /** 사업소득자 여부 표시 문구 */
  businessIncomeEarnerStatus?: string
  /** 참여 강사 상세 — 관리자 코멘트 */
  adminComment?: string
  /** 참여 강사 상세 — 일정 변경&취소 이력 횟수 */
  scheduleChangeCancelCount?: number
  /** 참여 강사 상세 — 소속(학교 등) */
  affiliation?: string
  /** 강사 회원 유형 — 교사 겸직(instructor_dual)일 때만 소속 재직 현황 태그 노출 */
  instructorMemberProfile?: InstructorMemberProfile
  /** 참여 강사 상세 — 소속 재직 현황 배지 (교사 겸직 전용) */
  affiliationEmploymentStatus?: SchoolTeacherEmploymentStatus
  /** 참여 강사 상세 — 강사비 등급 라벨 */
  instructorFeeGradeLabel?: string
  /** 강사가 일정 불가로 선택한 교육일 (YYYY-MM-DD) — 추가 배정 모달 일정 비활성용 */
  unavailableEducationDateKeys?: string[]
  /** 활동 포기 처리 여부 (기관 사유) */
  activityWithdrawn?: boolean
  /** 활동 포기 사유 — 현재 CMS는 `institution`(기관 사유)만 지원 */
  activityWithdrawReason?: ParticipatingInstructorActivityWithdrawReason
  /** 활동 중단일 일정 id */
  activityWithdrawStopScheduleId?: string
  /** 활동 중단일 표시 라벨 */
  activityWithdrawStopScheduleLabel?: string
  /**
   * 실적 집계에 포함할 교육 일정 id 목록.
   * 활동 중단일까지 포함·이후 일정 제외 — API 연동 시 performance aggregation 기준.
   */
  performanceIncludedScheduleIds?: string[]
}

export type ParticipatingInstructorActivityWithdrawReason = 'institution'

export type ParticipatingInstructorEducationScheduleProgress =
  | 'scheduled'
  | 'in_progress'
  | 'completed'

export interface ParticipatingInstructorEducationScheduleRow {
  id: string
  scheduleLabel: string
  progress: ParticipatingInstructorEducationScheduleProgress
}

export interface ParticipatingInstructorActivityWithdrawSavePayload {
  reason: ParticipatingInstructorActivityWithdrawReason
  stopScheduleId?: string
  stopScheduleLabel?: string
  performanceIncludedScheduleIds: string[]
}

/** Mock 시드 제거 — 빈 배열 */
export const MOCK_PARTICIPATING_INSTRUCTORS: ParticipatingInstructorRow[] = []

export function getParticipatingInstructorsForProgram(
  _programId?: string
): ParticipatingInstructorRow[] {
  return []
}

export function getParticipatingInstructorEducationSchedules(
  _instructorId: string
): ParticipatingInstructorEducationScheduleRow[] {
  return []
}

export function patchParticipatingInstructorDetail(
  _id: string,
  _patch: Partial<ParticipatingInstructorRow>
): ParticipatingInstructorRow | null {
  return null
}

export function patchParticipatingInstructorActivityWithdraw(
  _id: string,
  _payload: ParticipatingInstructorActivityWithdrawSavePayload
): ParticipatingInstructorRow | null {
  return null
}

/** 하위 호환 — 빈 옵션 */
export const INSTRUCTOR_SCHOOL_OPTIONS: string[] = []
