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
  | 'cancelled'
  | 'approval_cancelled'

export type EducationDisplayStatusTone =
  | 'pending'
  | 'progress'
  | 'completed'
  | 'rejected'
  | 'cancelled'

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
  consentType?: 'CRIMINAL_HISTORY_CHECK_CONSENT' | 'ADMINISTRATIVE_INFO_CONSENT'
  title: string
  fileUrl?: string
  documentId?: number | null
  originalFileName?: string
}

export type EducationTeacherAssignedInstructor = {
  id: string
  /** 배정 강사 회원 번호. 동의서 download-requests 경로 */
  instructorMemberId?: number
  name: string
  assignmentId?: number | null
  programScheduleId?: number | null
  assignmentStatus?: string | null
  phone?: string
  email?: string
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
  educationForm?: EducationForm
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
  /** 목록·상세 `programType` — 개인 수료증 대상 판별 */
  programType?: string
  /** 목록·상세 `programGroup` */
  programGroup?: string
  /**
   * 목록 `certificateAvailable` — 목록 액션 힌트.
   * 상세는 `canIssueCertificate`를 쓴다. 발급 CTA 최종 SSOT는 availability API.
   */
  certificateAvailable?: boolean
  /** 목록 `availableActions` — ISSUE_CERTIFICATE 등 */
  availableActions?: string[]
  /** 상세 `participation.participantId` — 발급 POST용 힌트(availability 우선) */
  participantId?: number
  /** 상세 `participation.certificateStatus` — 표시 라벨만 */
  certificateStatus?: string
  /** 상세 `capabilities.canIssueCertificate` — UX 힌트. CTA 최종은 availability */
  canIssueCertificate?: boolean
  /** 미응답 설문 수 — 포털 신청 목록·상세 `pendingSurveyCount` */
  pendingSurveyCount?: number
  /** 상세 `summary.satisfactionPendingCount` — 로컬 추정 금지 */
  satisfactionPendingCount?: number
  /** 상세 `capabilities.canSubmitSatisfaction` — 목록 `canSubmit`/`canResubmit`이 제출 SSOT */
  canSubmitSatisfaction?: boolean
  /** 상세 `capabilities.canSubmitSurvey` — 목록 `canSubmit`/`canResubmit`이 제출 SSOT */
  canSubmitSurvey?: boolean
  /** 409 `PORTAL_ANSWER_PRIVACY_UNVERIFIABLE` — answers는 유지하고 코드만 표시 */
  portalWarningCode?: string
  /** 상세 `summary.surveyPendingCount` — 로컬 추정 금지 */
  surveyPendingCount?: number
  /**
   * UJAT 기관 일정협의 배너 — Portal `supplement.ujat.portalBannerState`.
   * 재계산하지 않고 서버 값만 전달한다.
   */
  ujatPortalBannerState?: UjatPortalBannerState
  /** CMS 일정 수정 요청 본문 — `supplement.ujat` 문자열 필드 */
  ujatRevisionReason?: string
  /** 화면에 표시 중인 배정 revision — confirm POST body */
  ujatAssignmentRevision?: number
  /**
   * `supplement.ujat.preferredEducationDateOptions` — 제출 후 희망일 후보 SSOT.
   * 항상 배열(없으면 `[]`). 반기 금요일 FE 전개로 보완하지 않는다.
   */
  ujatPreferredEducationDateOptions?: Array<{
    id: string
    date: string
    label: string
  }>
  /** 교사 UJAT 신청 내용 탭 — 학년별 신청·수업시간 */
  ujatApplicationContent?: EducationUjatApplicationContent
  /** UJAT 봉사자 신청 내용 — 지역·대학·전공·경력·유입 경로 */
  ujatVolunteerApplicationContent?: EducationUjatVolunteerApplicationContent
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
  /** 제미나이 연수 신청 — 수강 인원 */
  studentCount?: string
  /** 제미나이 연수 신청 — 담당 교사 직급 */
  jobTitle?: string
  /** 제미나이 연수 신청 — 담당 과목 */
  subject?: string
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
  /** 교육받은교사 — 차시별 「K차시: M교시 | 시작 ~ 종료」 줄. 다른 유형은 없음 */
  sessionLines?: string[]
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
  /** 교육 지역(신청 지역). 기관 소재지(address)와 별도 */
  applicationRegion: string
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

/** UJAT 봉사자 마이페이지 신청 내용 — 기본 정보 필드(표시 문구) */
export type EducationUjatVolunteerApplicationContent = {
  preferredRegion: string
  universityName: string
  gradeLabel: string
  major: string
  educationExperienceLabel: string
  applicationRouteLabel: string
  /** 수료자 — 이전 UJAT 활동 기수. 없으면 빈 문자열 */
  previousTermLabel: string
  /** 면접 진행 가능 일정. 없으면 빈 문자열 */
  interviewScheduleLabel: string
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
