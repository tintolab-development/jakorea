/**
 * 상태 라벨, 색상, 아이콘 중앙 관리
 * Phase 1.1: 상태 표시 로직 중앙화
 */

import { ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import type {
  ApplicationRejectionKind,
  ApplicationStatus,
  SettlementStatus,
  ProgramLifecycleStatus,
  ReportStatus,
} from '@/types/domain'
import type { ApplicationProgressStatus } from '@/types/application-progress'
import type { Status } from '@/types'

// 공통 상태 (Program, Matching 등에서 사용)
export const commonStatusConfig = {
  labels: {
    active: '활성',
    inactive: '비활성',
    pending: '대기',
    completed: '완료',
    cancelled: '취소',
  } as Record<Status, string>,

  colors: {
    active: 'green',
    inactive: 'default',
    pending: 'orange',
    completed: 'blue',
    cancelled: 'red',
  } as Record<Status, string>,
}

// 신청 상태
export const applicationStatusConfig = {
  labels: {
    submitted: '접수',
    reviewing: '검토',
    approved: '확정',
    rejected: '거절',
    cancelled: '취소',
    waiting: '대기',
  } as Record<ApplicationStatus, string>,

  colors: {
    submitted: 'default',
    reviewing: 'processing',
    approved: 'success',
    rejected: 'error',
    cancelled: 'default',
    waiting: 'warning',
  } as Record<ApplicationStatus, string>,

  icons: {
    submitted: ClockCircleOutlined,
    reviewing: ClockCircleOutlined,
    approved: CheckCircleOutlined,
    rejected: CloseCircleOutlined,
    cancelled: CloseCircleOutlined,
    waiting: ClockCircleOutlined,
  } as Record<ApplicationStatus, React.ComponentType>,
}

// 정산 상태
export const settlementStatusConfig = {
  labels: {
    pending: '대기',
    calculated: '산출 완료',
    review: '검토',
    approved: '승인',
    paid: '지급 완료',
    cancelled: '취소',
  } as Record<SettlementStatus, string>,

  colors: {
    pending: 'default',
    calculated: 'processing',
    review: 'processing',
    approved: 'success',
    paid: 'success',
    cancelled: 'error',
  } as Record<SettlementStatus, string>,
}

// 신청 주체 타입
export const applicationSubjectTypeConfig = {
  labels: {
    school: '학교',
    student: '학생',
    instructor: '강사',
    volunteer: '봉사자',
  },

  colors: {
    school: 'cyan',
    student: 'blue',
    instructor: 'purple',
    volunteer: 'green',
  },
}

// 헬퍼 함수: 상태 라벨 가져오기
export function getApplicationStatusLabel(status: ApplicationStatus): string {
  return applicationStatusConfig.labels[status] || status
}

export function getSettlementStatusLabel(status: SettlementStatus): string {
  return settlementStatusConfig.labels[status] || status
}

export function getCommonStatusLabel(status: Status | string): string {
  return commonStatusConfig.labels[status as Status] || status
}

// 헬퍼 함수: 상태 색상 가져오기
export function getApplicationStatusColor(status: ApplicationStatus | string): string {
  return applicationStatusConfig.colors[status as ApplicationStatus] || 'default'
}

export function getSettlementStatusColor(status: SettlementStatus | string): string {
  return settlementStatusConfig.colors[status as SettlementStatus] || 'default'
}

export function getCommonStatusColor(status: Status | string): string {
  return commonStatusConfig.colors[status as Status] || 'default'
}

// 헬퍼 함수: 상태 아이콘 가져오기
export function getApplicationStatusIcon(status: ApplicationStatus): React.ComponentType {
  return applicationStatusConfig.icons[status]
}

// 프로그램 진행 워크플로우 상태 (7단계, 대시보드·프로그램 관리 공통)
/** 프로그램 진행 현황 필터/위젯용 6단계 (planned 제외, 교육 진행 중 = before+after 통합) */
export const programLifecycleStatusConfig = {
  order: [
    'recruiting_students',
    'recruiting_instructors',
    'education_in_progress',
    'matching_completed',
    'education_completed',
    'document_processing_completed',
  ] as ProgramLifecycleStatus[],
  labels: {
    planned: '참여자 모집 예정',
    instructor_recruitment_planned: '강사 모집 예정',
    volunteer_recruitment_planned: '봉사자 모집 예정',
    participant_instructor_recruitment_planned: '참여자&교육자 모집 예정',
    recruiting_students: '참여자 모집 중',
    recruiting_instructors: '강사 모집 중',
    recruiting_volunteers: '봉사자 모집 중',
    participant_instructor_recruiting: '참여자&교육자 모집 중',
    education_in_progress: '프로그램 진행 중',
    matching_completed: '참여자 모집 완료',
    education_before_textbook: '교재 전',
    education_after_textbook: '교재 후 진행 중',
    education_completed: '강사 모집 완료',
    document_processing_completed: '봉사자 모집 완료',
    participant_instructor_recruitment_completed: '참여자&교육자 모집 완료',
  } as Record<ProgramLifecycleStatus, string>,
  colors: {
    planned: 'default',
    instructor_recruitment_planned: 'default',
    volunteer_recruitment_planned: 'default',
    participant_instructor_recruitment_planned: 'default',
    recruiting_students: 'geekblue',
    recruiting_instructors: 'purple',
    recruiting_volunteers: 'default',
    participant_instructor_recruiting: 'geekblue',
    education_in_progress: 'blue',
    matching_completed: 'cyan',
    education_before_textbook: 'blue',
    education_after_textbook: 'blue',
    education_completed: 'green',
    document_processing_completed: 'blue',
    participant_instructor_recruitment_completed: 'cyan',
  } as Record<ProgramLifecycleStatus, string>,
}

/**
 * 폼 셀렉트·공통정보 등: `ProgramLifecycleStatus` 전체를 도메인 라벨과 동일한 순서로 노출
 * (`programLifecycleStatusConfig.order`는 위젯/워크플로용 6단계이므로 별도)
 */
export const PROGRAM_LIFECYCLE_STATUS_SELECT_ORDER: ProgramLifecycleStatus[] = [
  'planned',
  'instructor_recruitment_planned',
  'volunteer_recruitment_planned',
  'participant_instructor_recruitment_planned',
  'recruiting_students',
  'recruiting_instructors',
  'recruiting_volunteers',
  'participant_instructor_recruiting',
  'matching_completed',
  'education_before_textbook',
  'education_after_textbook',
  'education_in_progress',
  'education_completed',
  'document_processing_completed',
  'participant_instructor_recruitment_completed',
]

/** 공통정보·경제 목록 등: 세부 `lifecycleStatus` → 요약 3단계 */
export type ProgramProgressPhaseKey = 'scheduled' | 'inProgress' | 'completed'

export const PROGRAM_PROGRESS_PHASE_LABELS: Record<ProgramProgressPhaseKey, string> = {
  scheduled: '프로그램 진행 예정',
  inProgress: '프로그램 진행 중',
  completed: '프로그램 진행 완료',
}

/** UI `color` (디자인 토큰 + 폴백 hex) */
export const PROGRAM_PROGRESS_PHASE_COLORS: Record<ProgramProgressPhaseKey, string> = {
  scheduled: 'var(--color-green, #1E8C29)',
  inProgress: 'var(--color-blue, #017EAF)',
  completed: 'var(--default-BK, #3D3D3D)',
}

/**
 * 대시보드 홈「모집 신청 현황」위젯 테이블 — 모집 신청 현황 컬럼 텍스트 색상 (시안)
 * 예정(녹) / 모집 중·진행 중(청) / 완료·이후 단계(본문 BK)
 */
export type ProgramRecruitmentApplicationTextTone = 'scheduled' | 'recruiting' | 'completed'

export const PROGRAM_RECRUITMENT_APPLICATION_TEXT_COLORS: Record<
  ProgramRecruitmentApplicationTextTone,
  string
> = {
  scheduled: 'var(--color-green, #1E8C29)',
  recruiting: 'var(--color-blue, #017EAF)',
  completed: 'var(--main-BK, #3D3D3D)',
}

/** 참여자·강사·봉사자·참여자&교육진행자 모집 예정 */
export const PROGRAM_RECRUITMENT_APPLICATION_SCHEDULED_STATUSES = [
  'planned',
  'instructor_recruitment_planned',
  'volunteer_recruitment_planned',
  'participant_instructor_recruitment_planned',
] as const satisfies readonly ProgramLifecycleStatus[]

/** 참여자·강사·봉사자·참여자&교육진행자 모집 중 + 프로그램 진행 중 */
export const PROGRAM_RECRUITMENT_APPLICATION_RECRUITING_STATUSES = [
  'recruiting_students',
  'recruiting_instructors',
  'recruiting_volunteers',
  'participant_instructor_recruiting',
  'education_in_progress',
] as const satisfies readonly ProgramLifecycleStatus[]

/** 참여자·강사·봉사자·참여자&교육진행자 모집 완료 및 교재·정리 단계 */
export const PROGRAM_RECRUITMENT_APPLICATION_COMPLETED_STATUSES = [
  'matching_completed',
  'education_before_textbook',
  'education_after_textbook',
  'education_completed',
  'document_processing_completed',
  'participant_instructor_recruitment_completed',
] as const satisfies readonly ProgramLifecycleStatus[]

/** 테이블 셀: `data-recruitment-tone` + CSS (`program-lifecycle-status-badge.css`) */
export function getProgramRecruitmentApplicationTextTone(
  status: ProgramLifecycleStatus
): ProgramRecruitmentApplicationTextTone {
  const scheduled = PROGRAM_RECRUITMENT_APPLICATION_SCHEDULED_STATUSES as readonly ProgramLifecycleStatus[]
  const recruiting = PROGRAM_RECRUITMENT_APPLICATION_RECRUITING_STATUSES as readonly ProgramLifecycleStatus[]
  const completed = PROGRAM_RECRUITMENT_APPLICATION_COMPLETED_STATUSES as readonly ProgramLifecycleStatus[]
  if (scheduled.includes(status)) return 'scheduled'
  if (recruiting.includes(status)) return 'recruiting'
  if (completed.includes(status)) return 'completed'
  return 'completed'
}

/** Canvas·차트 등에서 동일 색이 필요할 때 */
export function getProgramRecruitmentApplicationTextColor(
  status: ProgramLifecycleStatus
): string {
  return PROGRAM_RECRUITMENT_APPLICATION_TEXT_COLORS[getProgramRecruitmentApplicationTextTone(status)]
}

export const PROGRAM_PROGRESS_PHASE_SCHEDULED_STATUSES: readonly ProgramLifecycleStatus[] = [
  'planned',
  'instructor_recruitment_planned',
  'volunteer_recruitment_planned',
  'participant_instructor_recruitment_planned',
  'recruiting_students',
  'recruiting_instructors',
  'recruiting_volunteers',
  'participant_instructor_recruiting',
  'matching_completed',
  'education_before_textbook',
]

export const PROGRAM_PROGRESS_PHASE_IN_PROGRESS_STATUSES: readonly ProgramLifecycleStatus[] = [
  'education_after_textbook',
  'education_in_progress',
]

export const PROGRAM_PROGRESS_PHASE_COMPLETED_STATUSES: readonly ProgramLifecycleStatus[] = [
  'education_completed',
  'document_processing_completed',
  'participant_instructor_recruitment_completed',
]

export function getProgramProgressPhase(status: ProgramLifecycleStatus): ProgramProgressPhaseKey {
  if (PROGRAM_PROGRESS_PHASE_SCHEDULED_STATUSES.includes(status)) return 'scheduled'
  if (PROGRAM_PROGRESS_PHASE_IN_PROGRESS_STATUSES.includes(status)) return 'inProgress'
  if (PROGRAM_PROGRESS_PHASE_COMPLETED_STATUSES.includes(status)) return 'completed'
  return 'scheduled'
}

export function getProgramProgressPhaseDisplay(status: ProgramLifecycleStatus): {
  phase: ProgramProgressPhaseKey
  label: string
  color: string
} {
  const phase = getProgramProgressPhase(status)
  return {
    phase,
    label: PROGRAM_PROGRESS_PHASE_LABELS[phase],
    color: PROGRAM_PROGRESS_PHASE_COLORS[phase],
  }
}

export function getProgramLifecycleLabel(status: ProgramLifecycleStatus | string): string {
  return programLifecycleStatusConfig.labels[status as ProgramLifecycleStatus] || status
}

export function getProgramLifecycleColor(status: ProgramLifecycleStatus | string): string {
  return programLifecycleStatusConfig.colors[status as ProgramLifecycleStatus] || 'default'
}

/** 회원 상세 > 프로그램 수강 이력 탭: 표시용 진행 현황 7단계 */
export type ProgramEnrollmentDisplayStatus =
  | 'WAITING_RESULT' // 신청 및 대기 중
  | 'DOCUMENT_PASS' // 1차 서류 합격
  | 'EDUCATION_SCHEDULED' // 프로그램 진행 예정
  | 'EDUCATION_IN_PROGRESS' // 프로그램 진행 중
  | 'PROGRAM_ENDED' // 프로그램 진행 완료
  | 'INTERVIEW_FAILED' // 면접 불합격
  | 'REJECTED' // 신청 반려

export const PROGRAM_ENROLLMENT_DISPLAY_STATUS_ORDER: ProgramEnrollmentDisplayStatus[] = [
  'WAITING_RESULT',
  'DOCUMENT_PASS',
  'EDUCATION_SCHEDULED',
  'EDUCATION_IN_PROGRESS',
  'PROGRAM_ENDED',
  'INTERVIEW_FAILED',
  'REJECTED',
]

export const programEnrollmentDisplayConfig = {
  labels: {
    WAITING_RESULT: '신청 및 대기 중',
    DOCUMENT_PASS: '1차 서류 합격',
    EDUCATION_SCHEDULED: '프로그램 진행 예정',
    EDUCATION_IN_PROGRESS: '프로그램 진행 중',
    PROGRAM_ENDED: '프로그램 진행 완료',
    INTERVIEW_FAILED: '면접 불합격',
    REJECTED: '신청 반려',
  } as Record<ProgramEnrollmentDisplayStatus, string>,
  colors: {
    WAITING_RESULT: 'orange',
    DOCUMENT_PASS: 'purple',
    EDUCATION_SCHEDULED: 'green',
    EDUCATION_IN_PROGRESS: 'cyan',
    PROGRAM_ENDED: 'default',
    INTERVIEW_FAILED: 'default',
    REJECTED: 'red',
  } as Record<ProgramEnrollmentDisplayStatus, string>,
}

/**
 * 목록·테이블에서 쓰는 라벨(스크린샷 문구와 동일). `programEnrollmentDisplayConfig.labels`와 통일.
 */
export const programEnrollmentEconomyListLabels = {
  WAITING_RESULT: '신청 및 대기 중',
  DOCUMENT_PASS: '1차 서류 합격',
  EDUCATION_SCHEDULED: '프로그램 진행 예정',
  EDUCATION_IN_PROGRESS: '프로그램 진행 중',
  PROGRAM_ENDED: '프로그램 진행 완료',
  INTERVIEW_FAILED: '면접 불합격',
  REJECTED: '신청 반려',
} as const satisfies Record<ProgramEnrollmentDisplayStatus, string>

export function getProgramEnrollmentDisplayLabel(
  status: ProgramEnrollmentDisplayStatus | string
): string {
  return programEnrollmentDisplayConfig.labels[status as ProgramEnrollmentDisplayStatus] || status
}

/**
 * 회원/후원사 프로그램 이력 삭제 제한 — 테이블·배지가 「프로그램 진행 중」(`EDUCATION_IN_PROGRESS`)으로 보일 때
 * (삭제 확인 모달에서 [삭제] 확정 전 차단에 사용)
 */
export function isProgramHistoryDeleteBlockedByDisplayStatus(
  displayStatus: ProgramEnrollmentDisplayStatus
): boolean {
  return displayStatus === 'EDUCATION_IN_PROGRESS'
}

export function getProgramEnrollmentDisplayColor(
  status: ProgramEnrollmentDisplayStatus | string
): string {
  return programEnrollmentDisplayConfig.colors[status as ProgramEnrollmentDisplayStatus] || 'default'
}

/** 회원 상세 탭 프로그램 진행 현황 — StatusBadge용 config */
export const programEnrollmentDisplayStatusConfig: Record<
  ProgramEnrollmentDisplayStatus,
  StatusConfig
> = Object.fromEntries(
  PROGRAM_ENROLLMENT_DISPLAY_STATUS_ORDER.map(key => [
    key,
    {
      label: programEnrollmentDisplayConfig.labels[key],
      color: programEnrollmentDisplayConfig.colors[key],
    },
  ])
) as Record<ProgramEnrollmentDisplayStatus, StatusConfig>

const PROGRESS_FOR_EDUCATION_SCHEDULED: ApplicationProgressStatus[] = [
  'RECEIVED',
  'MATCHING_IN_PROGRESS',
  'MATCHING_COMPLETED',
  'MATERIAL_PREPARING',
  'MATERIAL_SHIPPED',
]
const PROGRESS_FOR_EDUCATION_IN_PROGRESS: ApplicationProgressStatus[] = [
  'IN_PROGRESS',
  'SURVEY_SUBMITTED',
]

/** 회원 상세 탭: Application.status + progressStatus → 표시용 7단계 */
export function getApplicationEnrollmentDisplayStatus(
  status: ApplicationStatus,
  progressStatus?: ApplicationProgressStatus,
  rejectionKind?: ApplicationRejectionKind
): ProgramEnrollmentDisplayStatus {
  if (status === 'rejected') {
    return rejectionKind === 'INTERVIEW' ? 'INTERVIEW_FAILED' : 'REJECTED'
  }
  if (status === 'cancelled') {
    return 'REJECTED'
  }
  if (status === 'reviewing') {
    return 'DOCUMENT_PASS'
  }
  if (status === 'submitted' || status === 'waiting') {
    return 'WAITING_RESULT'
  }
  if (status !== 'approved') {
    return 'WAITING_RESULT'
  }
  if (!progressStatus) {
    return 'EDUCATION_SCHEDULED'
  }
  if (progressStatus === 'REPORT_SUBMITTED') {
    return 'PROGRAM_ENDED'
  }
  if (PROGRESS_FOR_EDUCATION_SCHEDULED.includes(progressStatus)) {
    return 'EDUCATION_SCHEDULED'
  }
  if (PROGRESS_FOR_EDUCATION_IN_PROGRESS.includes(progressStatus)) {
    return 'EDUCATION_IN_PROGRESS'
  }
  return 'EDUCATION_SCHEDULED'
}

/** 프로그램 라이프사이클이 종료 단계인지 (추론: 이 단계면 수강도 PROGRAM_ENDED로 볼 수 있음) */
export function isProgramLifecycleEnded(
  lifecycle: ProgramLifecycleStatus | undefined
): boolean {
  return (
    lifecycle === 'education_completed' || lifecycle === 'document_processing_completed'
  )
}

/**
 * 프로그램 엔티티의 lifecycle → 회원 상세·경제 목록과 동일한 배지용 상태
 * (담당 프로그램 이력 등 Program 행 표시)
 */
export function getEnrollmentDisplayStatusFromProgramLifecycle(
  lifecycleStatus: ProgramLifecycleStatus | undefined | null
): ProgramEnrollmentDisplayStatus {
  if (lifecycleStatus == null) {
    return 'EDUCATION_SCHEDULED'
  }
  if (isProgramLifecycleEnded(lifecycleStatus)) {
    return 'PROGRAM_ENDED'
  }
  if (
    lifecycleStatus === 'education_in_progress' ||
    lifecycleStatus === 'education_before_textbook' ||
    lifecycleStatus === 'education_after_textbook'
  ) {
    return 'EDUCATION_IN_PROGRESS'
  }
  return 'EDUCATION_SCHEDULED'
}

/**
 * 수강 이력 표시용 진행 현황 (추론 연동)
 * Application 기준으로 계산한 뒤, 프로그램이 종료 단계면 PROGRAM_ENDED로 통일
 */
export function getEffectiveEnrollmentDisplayStatus(
  applicationStatus: ApplicationStatus,
  applicationProgressStatus: ApplicationProgressStatus | undefined,
  programLifecycleStatus?: ProgramLifecycleStatus,
  rejectionKind?: ApplicationRejectionKind
): ProgramEnrollmentDisplayStatus {
  const fromApplication = getApplicationEnrollmentDisplayStatus(
    applicationStatus,
    applicationProgressStatus,
    rejectionKind
  )
  if (isProgramLifecycleEnded(programLifecycleStatus)) {
    return 'PROGRAM_ENDED'
  }
  return fromApplication
}

// 보고서 상태
export const reportStatusConfig = {
  labels: {
    submitted: '제출',
    reviewing: '검토 중',
    approved: '승인',
    rejected: '반려',
  } as Record<ReportStatus, string>,

  colors: {
    submitted: 'default',
    reviewing: 'processing',
    approved: 'success',
    rejected: 'error',
  } as Record<ReportStatus, string>,

  icons: {
    submitted: ClockCircleOutlined,
    reviewing: ClockCircleOutlined,
    approved: CheckCircleOutlined,
    rejected: CloseCircleOutlined,
  } as Record<ReportStatus, React.ComponentType>,
}

export function getReportStatusLabel(status: ReportStatus | string): string {
  return reportStatusConfig.labels[status as ReportStatus] || status
}

export function getReportStatusColor(status: ReportStatus | string): string {
  return reportStatusConfig.colors[status as ReportStatus] || 'default'
}

// StatusBadge용 config (StatusBadge 컴포넌트에서 직접 사용 가능)
import type { StatusConfig } from '@/shared/ui/status-badge'

// 공통 상태 StatusBadge용 config
export const commonStatusStatusConfig: Record<Status, StatusConfig> = Object.fromEntries(
  Object.keys(commonStatusConfig.labels).map(status => [
    status,
    {
      label: commonStatusConfig.labels[status as Status],
      color: commonStatusConfig.colors[status as Status],
    },
  ])
) as Record<Status, StatusConfig>

// 신청 상태 StatusBadge용 config
export const applicationStatusStatusConfig: Record<ApplicationStatus, StatusConfig> =
  Object.fromEntries(
    Object.keys(applicationStatusConfig.labels).map(status => [
      status,
      {
        label: applicationStatusConfig.labels[status as ApplicationStatus],
        color: applicationStatusConfig.colors[status as ApplicationStatus],
        icon: applicationStatusConfig.icons[status as ApplicationStatus],
      },
    ])
  ) as Record<ApplicationStatus, StatusConfig>

// 정산 상태 StatusBadge용 config
export const settlementStatusStatusConfig: Record<SettlementStatus, StatusConfig> =
  Object.fromEntries(
    Object.keys(settlementStatusConfig.labels).map(status => [
      status,
      {
        label: settlementStatusConfig.labels[status as SettlementStatus],
        color: settlementStatusConfig.colors[status as SettlementStatus],
      },
    ])
  ) as Record<SettlementStatus, StatusConfig>

// 프로그램 라이프사이클 상태 StatusBadge용 config
export const programLifecycleStatusStatusConfig: Record<ProgramLifecycleStatus, StatusConfig> =
  Object.fromEntries(
    (Object.keys(programLifecycleStatusConfig.labels) as ProgramLifecycleStatus[]).map(status => [
      status,
      {
        label: programLifecycleStatusConfig.labels[status],
        color: programLifecycleStatusConfig.colors[status],
      },
    ])
  ) as Record<ProgramLifecycleStatus, StatusConfig>

// 보고서 상태 StatusBadge용 config
export const reportStatusStatusConfig: Record<ReportStatus, StatusConfig> = Object.fromEntries(
  Object.keys(reportStatusConfig.labels).map(status => [
    status,
    {
      label: reportStatusConfig.labels[status as ReportStatus],
      color: reportStatusConfig.colors[status as ReportStatus],
      icon: reportStatusConfig.icons[status as ReportStatus],
    },
  ])
) as Record<ReportStatus, StatusConfig>
