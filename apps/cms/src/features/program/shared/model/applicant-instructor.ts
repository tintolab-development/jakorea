/**
 * 신청 강사 — 타입, 인터페이스 및 승인 상태 패치 도우미.
 * @/features/program/shared/model/applicant-instructor에서 이전 (Phase 2).
 */

import type { Dayjs } from 'dayjs'
import type { InstructorMemberProfile, SchoolTeacherEmploymentStatus } from '@/types/user'

export type ApplicantInstructorLectureFeeBasisType = 'program' | 'special_lecture' | 'other_labor'

export type ApplicantInstructorApprovalStatusKey = 'pending' | 'rejected' | 'approved'

export type ApplicantInstructorApprovalNotifyTiming = 'immediate' | 'on_announcement' | 'manual'

export type ApplicantInstructorApprovalNotifyOptions = {
  notifyTiming: ApplicantInstructorApprovalNotifyTiming
  manualNotifyAt?: Dayjs | null
  /** 반려 시 사유 */
  rejectionReason?: string
}

/** 희망 배정 학교 1~4순위 (상세 모달 희망 배정 학교 섹션) */
export interface ApplicantInstructorPreferredSchool {
  schoolId: string
  schoolName: string
  rank: number
  assignable: boolean
  /** 희망 학년 (예: 5학년) */
  grade?: string
  /** 희망 진행 일자 (예: 2026.04.09 (목) ~ 2026.04.30 (목)) */
  dateRange?: string
}

/** 강사 이력서 - 경력 상세 (강사 추가 모달과 동일 구조) */
export interface ApplicantInstructorCareerDetail {
  companyName?: string
  role?: string
  startDate?: string
  endDate?: string
  isCurrent?: boolean
}

/** 강사 이력서 — JA Korea 활동 경험 */
export interface ApplicantInstructorJaKoreaActivity {
  periodStart?: string
  periodEnd?: string
  title?: string
  note?: string
}

/** 강사 이력서 - 자격 및 면허 */
export interface ApplicantInstructorQualification {
  name?: string
  year?: string
  issuer?: string
}

/** 강사 이력서 - 수상 및 수료 내역 */
export interface ApplicantInstructorAward {
  name?: string
  year?: string
  issuer?: string
}

/** 강사 이력서 - 학력사항 (강사 추가 모달 educations와 연동) */
export interface ApplicantInstructorEducationItem {
  schoolType?: string
  status?: string
  schoolName?: string
  major?: string
  enrollmentYear?: string
  graduationYear?: string
}

export interface ApplicantInstructorRow {
  id: string
  /** BE 강사 회원 ID — 신청 PK와 구분 */
  instructorMemberId?: number
  /** DB로 연결된 기존 소속 학교/기관 ID. 소속 없음은 null */
  affiliationOrganizationId?: number | null
  /** 프로그램 ID — 일반 기관 QA case 격리 */
  programId?: string
  no: number
  instructorName: string
  lectureExperienceYears: number
  educationLevel: string
  educationSchoolName: string
  contact: string
  email: string
  address: string
  appliedAt?: string
  affiliation?: string
  approvalStatus: ApplicantInstructorApprovalStatusKey
  /** 신청 학교(필터용) */
  schoolName: string
  /** 일정 변경&취소 이력 횟수. 1 이상일 때만 강사 상세 모달 강사명 옆 배지 표시 */
  scheduleChangeCancelCount?: number
  /** JA 평가 등급 (A|B|C) */
  evaluationGrade?: string
  /** 강사비 등급 (예: 3급 강사비) — JA 평가 등급과 별도 */
  instructorFeeGradeLabel?: string
  /** 강사 회원 유형 — 교사 겸직(instructor_dual)일 때만 소속 재직 현황 태그 노출 */
  instructorMemberProfile?: InstructorMemberProfile
  /** 소속 재직 여부 — affiliationEmploymentStatus 미지정 시 general 상세 배지 fallback */
  affiliationIsCurrentlyEmployed?: boolean
  /** 소속 재직 현황 — general 상세 소속 td 내 변경 가능 배지 (교사 겸직 전용) */
  affiliationEmploymentStatus?: SchoolTeacherEmploymentStatus
  /** JA 강의 경력 (신규|1년 미만|1~3년|3년 이상 등) */
  teachingExperience?: string
  /** 한줄소개 (강사 상세 모달 기본 정보 탭) */
  oneLineIntro?: string
  /** 성명 한자 */
  nameHanja?: string
  /** 성명 영문 */
  nameEnglish?: string
  /** 생년월일 (예: 1990.09.15) */
  birthDate?: string
  /** 만 나이 (표시용) */
  age?: number
  /** 성별 (예: 남성/여성) */
  gender?: string
  /** 병역사항 (예: 군필/미필/면제) */
  militaryStatus?: string
  /** 정산 계좌: 은행명 */
  bankName?: string
  /** 정산 계좌: 계좌번호 */
  accountNumber?: string
  /** 정산 계좌: 예금주 */
  accountHolder?: string
  /** 프로필 사진 URL (없으면 플레이스홀더) */
  profileImageUrl?: string
  /** 희망 배정 학교 1~4순위 (일부 assignable: false로 배정 불가) */
  preferredSchools?: ApplicantInstructorPreferredSchool[]
  /** 개인 프로그램 — 강의 배정 가능 일정 (assignable: false면 배정 불가) */
  preferredScheduleSlots?: Array<{
    slotKey: string
    assignable: boolean
  }>
  /** 승인 완료 시 배정된 학교 ID (결재 내역 배정 학교 표시용) */
  assignedSchoolId?: string
  /** 승인 완료 시 배정된 학교명 */
  assignedSchoolName?: string
  /** 승인 시 배정된 강의 일정 (기관 프로그램 강의 배정 모달) */
  assignedLectures?: Array<{
    slotKey: string
    dateKey: string
    schoolId: string
    schoolName: string
    sessionLabel: string
    timeRange: string
  }>
  /** 승인 반려 시 반려 사유 (결재 내역 반려 사유 표시용) */
  rejectionReason?: string
  /** Admin API — 기관까지 편도 거리(km). mock 해시 대신 우선 */
  distanceKm?: number
  /** Admin API — 장거리 여부. threshold 하드코딩보다 우선 */
  longDistanceYn?: boolean
  /** 강사 이력서 - 경력 상세 (강사 이력서 탭) */
  careerDetails?: ApplicantInstructorCareerDetail[]
  /** 강사 이력서 — JA Korea 활동 경험 */
  jaKoreaActivities?: ApplicantInstructorJaKoreaActivity[]
  /** 강사 이력서 - 자격 및 면허 */
  qualifications?: ApplicantInstructorQualification[]
  /** 강사 이력서 - 수상 및 수료 내역 */
  awards?: ApplicantInstructorAward[]
  /** 강사 이력서 - 학력사항 (강사 추가 모달 educations와 연동) */
  educations?: ApplicantInstructorEducationItem[]
  /** 경력 구분 — CMS `profile.career.level` */
  instructorCareerLevel?: 'new' | 'experienced'
  /** 1. 자기소개 및 지원동기 */
  freeWriting1?: string
  /** 2. 청소년 경제 교육의 중요성... */
  freeWriting2?: string
  /** 3. 청소년과 소통할 때... */
  freeWriting3?: string
  /** 4. 교육 중 예기치 않은 상황... */
  freeWriting4?: string
  /** 승인 완료 시 기본 정보 상단 노출 관리자 코멘트 */
  managerComment?: string
  /** BE availableActions — 헤더 CTA 노출 게이트 */
  availableActions?: string[]
  /** 승인 완료 시 기본 정보 하단: 강의비 책정 기준 (예: 특강 강사비 | 915,000원) */
  lectureFeeBasisDisplay?: string
  /** 강의비 책정 기준 — 유형 */
  lectureFeeBasisType?: ApplicantInstructorLectureFeeBasisType
  /** 강의비 책정 기준 — 단위 (예: 출강 1회당) */
  lectureFeeMeasure?: string
  /** 강의비 책정 기준 — 금액(숫자만) */
  lectureFeeAmount?: string
  /** 사업소득자 여부 (예: 해당 없음) — general 상세에서 승인 전에도 표시 */
  businessIncomeEarnerStatus?: string
  /** 승인 완료 시 알림 발송 일시 (프로그램 승인 현황 옆 표시) */
  approvalNotificationSentAt?: string
  /** 승인 시 선택한 알림 발송 방식 (승인 취소 모달 분기용) */
  approvalNotifyTiming?: ApplicantInstructorApprovalNotifyTiming
  /** 반려 시 선택한 알림 발송 방식 (반려 취소 모달 분기용) */
  rejectionNotifyTiming?: ApplicantInstructorApprovalNotifyTiming
  /** 회원 관리 강사 상세 기본 정보: 정산 현황 셀 (프로그램 신청 강사 플로우에서는 미사용) */
  settlementStatusLabel?: string
}

export interface ApplicantInstructorDetailSavePayload {
  managerComment?: string
  lectureFeeBasisType?: ApplicantInstructorLectureFeeBasisType
  lectureFeeMeasure?: string
  lectureFeeAmount?: string
  lectureFeeBasisDisplay?: string
  instructorFeeGradeLabel?: string
  businessIncomeEarnerStatus?: string
}

export function formatApprovalNotificationSentAt(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${y}.${m}.${day} ${hh}:${mm}:${ss}`
}

export function resolveApplicantInstructorApprovalNotificationSentAt(
  options?: ApplicantInstructorApprovalNotifyOptions
): string | undefined {
  if (!options || options.notifyTiming === 'immediate') {
    return formatApprovalNotificationSentAt()
  }
  if (options.notifyTiming === 'on_announcement') {
    return undefined
  }
  if (options.notifyTiming === 'manual' && options.manualNotifyAt) {
    return formatApprovalNotificationSentAt(options.manualNotifyAt.toDate())
  }
  return undefined
}

export function patchApplicantInstructorForApprovalStatus(
  row: ApplicantInstructorRow,
  approvalStatus: ApplicantInstructorApprovalStatusKey,
  notifyOptions?: ApplicantInstructorApprovalNotifyOptions
): ApplicantInstructorRow {
  if (approvalStatus === 'approved') {
    return {
      ...row,
      approvalStatus,
      lectureFeeBasisType: row.lectureFeeBasisType ?? 'special_lecture',
      lectureFeeMeasure: row.lectureFeeMeasure ?? '출강 1회당',
      lectureFeeAmount: row.lectureFeeAmount ?? '915000',
      lectureFeeBasisDisplay: row.lectureFeeBasisDisplay ?? '특강 강사비 | 출강 1회당 | 915,000원',
      businessIncomeEarnerStatus: row.businessIncomeEarnerStatus ?? '해당 없음',
      approvalNotifyTiming: notifyOptions?.notifyTiming,
      approvalNotificationSentAt: resolveApplicantInstructorApprovalNotificationSentAt(notifyOptions),
    }
  }
  if (approvalStatus === 'rejected') {
    return {
      ...row,
      approvalStatus,
      rejectionReason: notifyOptions?.rejectionReason ?? row.rejectionReason,
      lectureFeeBasisDisplay: undefined,
      lectureFeeBasisType: undefined,
      lectureFeeMeasure: undefined,
      lectureFeeAmount: undefined,
      businessIncomeEarnerStatus: row.businessIncomeEarnerStatus ?? '해당 없음',
      approvalNotifyTiming: undefined,
      rejectionNotifyTiming: notifyOptions?.notifyTiming,
      approvalNotificationSentAt: resolveApplicantInstructorApprovalNotificationSentAt(notifyOptions),
    }
  }

  return {
    ...row,
    approvalStatus,
    rejectionReason: undefined,
    lectureFeeBasisDisplay: undefined,
    lectureFeeBasisType: undefined,
    lectureFeeMeasure: undefined,
    lectureFeeAmount: undefined,
    businessIncomeEarnerStatus: row.businessIncomeEarnerStatus ?? '해당 없음',
    approvalNotifyTiming: undefined,
    rejectionNotifyTiming: undefined,
    approvalNotificationSentAt: undefined,
  }
}

/** 승인 취소 — 승인 대기 복원 + 배정·승인 알림 예약 정보 제거 */
export function patchApplicantInstructorForCancelApproval(
  row: ApplicantInstructorRow,
  notifyOptions: ApplicantInstructorApprovalNotifyOptions
): ApplicantInstructorRow {
  const pending = patchApplicantInstructorForApprovalStatus(row, 'pending')
  return {
    ...pending,
    assignedLectures: undefined,
    assignedSchoolId: undefined,
    assignedSchoolName: undefined,
    approvalNotificationSentAt:
      resolveApplicantInstructorApprovalNotificationSentAt(notifyOptions),
  }
}

export function patchApplicantInstructorForCancelRejection(
  row: ApplicantInstructorRow,
  notifyOptions?: ApplicantInstructorApprovalNotifyOptions
): ApplicantInstructorRow {
  const pending = patchApplicantInstructorForApprovalStatus(row, 'pending')
  if (!notifyOptions) {
    return pending
  }
  return {
    ...pending,
    approvalNotificationSentAt: resolveApplicantInstructorApprovalNotificationSentAt(notifyOptions),
  }
}

export function patchApplicantInstructorForNotificationResend(
  row: ApplicantInstructorRow,
  notifyOptions: ApplicantInstructorApprovalNotifyOptions
): ApplicantInstructorRow {
  return {
    ...row,
    approvalNotificationSentAt: resolveApplicantInstructorApprovalNotificationSentAt(notifyOptions),
  }
}

/** Mock 시드 제거 */
export const MOCK_APPLICANT_INSTRUCTORS: ApplicantInstructorRow[] = []

export function getApplicantInstructorsByProgramId(_programId?: string): ApplicantInstructorRow[] {
  return []
}

export function updateApplicantInstructorApprovalStatus(
  _instructorId: string,
  _approvalStatus: ApplicantInstructorApprovalStatusKey,
  _notifyOptions?: ApplicantInstructorApprovalNotifyOptions
): void {}

export function updateApplicantInstructorCancelApproval(
  _instructorId: string,
  _notifyOptions: ApplicantInstructorApprovalNotifyOptions
): void {}

export function updateApplicantInstructorCancelRejection(
  _instructorId: string,
  _notifyOptions?: ApplicantInstructorApprovalNotifyOptions
): void {}

export function updateApplicantInstructorNotificationResend(
  _instructorId: string,
  _notifyOptions: ApplicantInstructorApprovalNotifyOptions
): void {}

export function patchApplicantInstructorDetail(
  _instructorId: string,
  _payload: ApplicantInstructorDetailSavePayload
): ApplicantInstructorRow | null {
  return null
}
