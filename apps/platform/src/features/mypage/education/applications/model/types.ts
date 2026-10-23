import type { RecruitmentStatus } from '@jakorea/domain/recruitment/recruitment-status'
import type { EducationForm, ProgramDetailCase } from '@/features/program'
import type { PortalPreferredScheduleBlock } from '@/features/program/api/application-types'
import type { ProgramApplicationType, UjatPortalBannerState } from '../api/types'

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

/** 교사 회원 교육현황 상세 — 교재 배송 현황 */
export type EducationTeacherDeliveryStatus = 'before' | 'shipping' | 'completed'

export const EDUCATION_TEACHER_DELIVERY_STATUS_LABEL: Record<
  EducationTeacherDeliveryStatus,
  string
> = {
  before: '배송 전',
  shipping: '배송 중',
  completed: '배송 완료',
}

/** 교사 회원 교육현황 상세 — 교재·배정강사(동의서) */
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
  documentId?: number
  originalFileName?: string
}

export type EducationTeacherAssignedInstructor = {
  id: string
  /** 배정 강사 회원 번호. 동의서 download-requests 경로 */
  instructorMemberId?: number
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
  assignment: EducationTeacherAssignment | undefined
): boolean {
  if (!assignment) return false
  return Boolean(assignment.textbook) || assignment.instructors.length > 0
}

export type EducationApplicationListItem = {
  id: string
  /** 포털 신청 건 역할 SoT. Mock/레거시 항목은 없을 수 있음. */
  applicationType?: ProgramApplicationType
  programId: string
  /** 포털 신청 건 모집 id — 설문 form-bindings GET 쿼리 */
  recruitmentId?: number
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
  /** 포털 상세 `cancellable`. 없으면 진행 상태로 취소 가능 여부를 판단한다. */
  cancellable?: boolean
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
  /**
   * answers의 scheduleChoice 등 opaque option_value (`schedule:186626`, `line:0`).
   * 표시 시 프로그램 일정·교육 진행 예정일로 해석한다.
   */
  preferredScheduleOptionValues?: string[]
  /** Portal 신청 상세 `preferredScheduleBlocks` — 서버가 매칭한 일정 원본 */
  preferredScheduleBlocks?: readonly PortalPreferredScheduleBlock[]
  /** 상세 API nested program의 canonical 화면 설정값 */
  programConfig?: EducationApplicationProgramConfig
  /** Portal 신청 상세 `answers` — 상세 재조회·신청 정보 팝업용 */
  applicationAnswers?: Record<string, unknown>
  /** Portal 신청 상세 `formResponseId` — 안내사항 PATCH 전제 */
  formResponseId?: number
  /** Portal 신청 상세 `formBindingId` — 제출 후 양식 runtime 조회 */
  formBindingId?: number
  /** Portal 신청 상세 `formResponseStatus` — SUBMITTED/APPROVED/COMPLETED 등 */
  formResponseStatus?: string
  /** `displayStatus === 'withdrawn'` 일 때 포기 시점 */
  withdrawalPhase?: EducationWithdrawalPhase
  /**
   * 진행 중 포기 시 마지막으로 참여한 회차(1-based).
   * 예: 10회차 중 3회차까지 진행 후 포기 → `3` — 이후 회차 일정·과제·자료 비노출
   */
  lastParticipatedSession?: number
  /** 교사 회원 상세 헤더 우측 — 교재·배정강사 (일반/강사 비노출) */
  teacherAssignment?: EducationTeacherAssignment
  /** 교사 회원 신청 내용 탭 — 기관 신청·안내사항·희망 일정 */
  teacherApplicationContent?: EducationTeacherApplicationContent
  /** 수료증 발급 가능 — 포털 신청 상세 `certificateAvailable` */
  certificateAvailable?: boolean
  /** 미응답 설문 수 — 포털 신청 목록·상세 `pendingSurveyCount` */
  pendingSurveyCount?: number
  /**
   * UJAT 기관 일정협의 배너 — Portal `supplement.ujat.portalBannerState`.
   * 재계산하지 않고 서버 값만 전달한다.
   */
  ujatPortalBannerState?: UjatPortalBannerState
  /** CMS 일정 수정 요청 본문 — `supplement.ujat` 문자열 필드 */
  ujatRevisionReason?: string
  /** 교사 UJAT 신청 내용 탭 — 학년별 신청·수업시간 */
  ujatApplicationContent?: EducationUjatApplicationContent
  /** UJAT 기관 상세 전용 CMS 확정 배정 일정. 신청 당시 희망 일정과 별도 SSOT. */
  ujatTemporarySchedule?: EducationUjatTemporarySchedule
}

/** 교사 회원 신청 내용 — 신청 기관 정보 */
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

/** 교사 회원 신청 내용 — 안내사항 */
export type EducationTeacherApplicationGuidance = {
  computerInRoom: string
  waitingPlace: string
  meal: string
  otherNotes: string
  /** 성범죄 동의서 제출 요청 시에만 */
  sexOffenseConsentMethod?: string
}

export type EducationTeacherPreferredSchedule = {
  id: string
  label: string
  value: string
  scheduleId?: number | null
  startAt?: string | null
  endAt?: string | null
  round?: number | null
  scheduleStatus?: string | null
  statusLabel?: string
}

export type EducationApplicationProgramConfig = {
  programType?: string
  educationFormLabel?: string | null
  educationJournalEnabled?: boolean | null
  surveyConfigured?: boolean | null
  satisfactionConfigured?: boolean | null
}

export type EducationTeacherApplicationContent = {
  institution: EducationTeacherApplicationInstitution
  guidance: EducationTeacherApplicationGuidance
  preferredSchedules: EducationTeacherPreferredSchedule[]
}

export type EducationUjatApplicationInstitution = {
  name: string
  address: string
  addressDetail: string
  teacherContact: string
  otherRequests: string
}

export type EducationUjatGradeBlock = {
  gradeLabel: string
  classCountLabel: string
  classesLabel: string
}

export type EducationUjatClassPeriod = {
  periodLabel: string
  timeLabel: string
}

export type EducationUjatClassTimeBlock = {
  gradeRangeLabel: string
  periods: EducationUjatClassPeriod[]
}

export type EducationUjatApplicationContent = {
  preferredDates: string[]
  institution: EducationUjatApplicationInstitution
  gradeBlocks: EducationUjatGradeBlock[]
  classTimeBlocks: EducationUjatClassTimeBlock[]
}

export type EducationUjatTemporaryScheduleSlot = {
  scheduleId?: number | null
  scheduleStartAt?: string | null
  grade?: string | null
  className?: string | null
  studentCount?: number | null
  assignmentStatus?: string | null
}

export type EducationUjatTemporarySchedule = {
  slots: EducationUjatTemporaryScheduleSlot[]
}

export type EducationApplicationListParams = {
  tab: EducationApplicationTab
  page: number
}

export const EDUCATION_APPLICATION_PAGE_SIZE = 10
