import type { RecruitmentStatus } from '@jakorea/domain/recruitment/recruitment-status'
import type { EducationForm, ProgramDetailCase } from '@/features/program'

export type EducationApplicationTab = 'all' | 'applied' | 'in_progress' | 'completed'

/** 교육현황 목록 — 진행 상태 (정렬·탭·톤 SSOT 키) */
export type EducationDisplayStatus =
  | 'waiting_result'
  | 'document_passed'
  | 'in_progress'
  | 'completed'
  | 'withdrawn'
  | 'rejected'

export type EducationDisplayStatusTone = 'pending' | 'progress' | 'completed' | 'rejected'

/**
 * 활동 포기 시점.
 * - `before_education`: 승인 후·교육 시작 전 포기 → 서류 합격과 동일 탭, 상태만 활동 포기·합격 배너 비노출
 * - `during_education`: 교육 진행 중 포기 → 진행중과 유사 탭(안내사항 제외), 포기 이전 회차만 노출
 */
export type EducationWithdrawalPhase = 'before_education' | 'during_education'

/** 교사회원 교육현황 상세 — 교재 배송 현황 */
export type EducationTeacherDeliveryStatus = 'before' | 'shipping' | 'completed'

export const EDUCATION_TEACHER_DELIVERY_STATUS_LABEL: Record<
  EducationTeacherDeliveryStatus,
  string
> = {
  before: '배송 전',
  shipping: '배송 중',
  completed: '배송 완료',
}

/** 교사회원 교육현황 상세 — 교재·배정강사(동의서) */
export type EducationTeacherAssignmentTextbook = {
  title: string
  kitCountLabel: string
  volumeCountLabel: string
  deliveryStatus: EducationTeacherDeliveryStatus
}

export type EducationTeacherAssignmentConsent = {
  id: string
  title: string
  fileUrl?: string
}

export type EducationTeacherAssignedInstructor = {
  id: string
  name: string
  /**
   * 기관이 JA 시스템에서 동의서 확인을 요청한 경우에만 true.
   * true일 때 성범죄·행정정보 동의서 다운로드 노출.
   */
  consentDocumentsRequested?: boolean
  consents?: EducationTeacherAssignmentConsent[]
}

export type EducationTeacherAssignment = {
  /** 지정 교재가 있을 때만 — 없으면 교재 카드 비노출 */
  textbook?: EducationTeacherAssignmentTextbook
  /** 배정 강사. 비어 있으면 강사 카드 비노출. 2명 이상이면 캐러셀 */
  instructors: EducationTeacherAssignedInstructor[]
}

export function hasTeacherAssignmentAsideContent(
  assignment: EducationTeacherAssignment | undefined,
): boolean {
  if (!assignment) return false
  return Boolean(assignment.textbook) || assignment.instructors.length > 0
}

export type EducationApplicationListItem = {
  id: string
  programId: string
  categoryLabel: string
  title: string
  recruitmentPeriodLabel: string
  operatingPeriodLabel: string
  recruitmentStatus: RecruitmentStatus
  educationTargetLabel: string
  educationForm: EducationForm
  educationFormLabel: string
  thumbnailUrl?: string
  displayStatus: EducationDisplayStatus
  /** 프로그램 상세 케이스 — 교육/봉사 목록 분리 */
  detailCase: ProgramDetailCase
  /** 면접 전형 포함 여부 — 서류 합격 배너 노출 조건 */
  hasInterview?: boolean
  /** 관리자 배정 면접일 표시 문구 (예: 2026년 04월 12일(일) 14시) */
  interviewAtLabel?: string
  /** 신청 내용 — 자기소개 및 지원동기 */
  selfIntroMotivation?: string
  /** 신청 내용 — 진행 희망 교육 일정 표시 문구 */
  preferredEducationScheduleLabel?: string
  /** `displayStatus === 'withdrawn'` 일 때 포기 시점 */
  withdrawalPhase?: EducationWithdrawalPhase
  /**
   * 진행 중 포기 시 마지막으로 참여한 회차(1-based).
   * 예: 10회차 중 3회차까지 진행 후 포기 → `3` — 이후 회차 일정·과제·자료 비노출
   */
  lastParticipatedSession?: number
  /** 교사회원 상세 헤더 우측 — 교재·배정강사 (일반/강사 비노출) */
  teacherAssignment?: EducationTeacherAssignment
  /** 교사회원 신청 내용 탭 — 기관 신청·안내사항·희망 일정 */
  teacherApplicationContent?: EducationTeacherApplicationContent
}

/** 교사회원 신청 내용 — 신청 기관 정보 */
export type EducationTeacherApplicationInstitution = {
  name: string
  grade: string
  address: string
  addressDetail: string
  classAndHeadcount: string
  /** 프로그램이 교육형태를 참여자 선택으로 둔 경우에만 */
  preferredEducationForm?: string
  venue?: string
  teacherContact: string
  reason: string
  otherRequests: string
}

/** 교사회원 신청 내용 — 성범죄 동의서 조회 방식 */
export type EducationTeacherSexOffenseInquiryMethod = 'ja_system' | 'criminal_record_site'
export type EducationTeacherSexOffenseSiteSubmission = 'direct' | 'online'

export type EducationTeacherSexOffenseConsent = {
  inquiryMethod: EducationTeacherSexOffenseInquiryMethod
  siteSubmission?: EducationTeacherSexOffenseSiteSubmission
  orgId?: string
  verificationCode?: string
}

/** 교사회원 신청 내용 — 안내사항 */
export type EducationTeacherApplicationGuidance = {
  computerInRoom: string
  waitingPlace: string
  meal: string
  otherNotes: string
  /** 성범죄 동의서 제출 요청 시에만 — 읽기 표시용 */
  sexOffenseConsentMethod?: string
  /** 성범죄 동의서 제출 요청 시에만 — 편집용 구조화 */
  sexOffenseConsent?: EducationTeacherSexOffenseConsent
}

export type EducationTeacherPreferredSchedule = {
  id: string
  label: string
  value: string
}

export type EducationTeacherApplicationContent = {
  institution: EducationTeacherApplicationInstitution
  guidance: EducationTeacherApplicationGuidance
  preferredSchedules: EducationTeacherPreferredSchedule[]
}

export type EducationApplicationListParams = {
  tab: EducationApplicationTab
  page: number
}

export const EDUCATION_APPLICATION_PAGE_SIZE = 10
