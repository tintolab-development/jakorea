/**
 * 상태 라벨, 색상, 아이콘 중앙 관리
 * Phase 1.1: 상태 표시 로직 중앙화
 */

import { ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import type {
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

export function getProgramLifecycleLabel(status: ProgramLifecycleStatus | string): string {
  return programLifecycleStatusConfig.labels[status as ProgramLifecycleStatus] || status
}

export function getProgramLifecycleColor(status: ProgramLifecycleStatus | string): string {
  return programLifecycleStatusConfig.colors[status as ProgramLifecycleStatus] || 'default'
}

/** 회원 상세 > 프로그램 수강 이력 탭: 표시용 진행 현황 5단계 */
export type ProgramEnrollmentDisplayStatus =
  | 'WAITING_RESULT'       // 신청 결과 대기 중
  | 'REJECTED'             // 신청 반려
  | 'EDUCATION_SCHEDULED'  // 교육 진행 예정
  | 'EDUCATION_IN_PROGRESS' // 교육 진행 중
  | 'PROGRAM_ENDED'        // 프로그램 종료

export const programEnrollmentDisplayConfig = {
  labels: {
    WAITING_RESULT: '신청 결과 대기 중',
    REJECTED: '신청 반려',
    EDUCATION_SCHEDULED: '교육 진행 예정',
    EDUCATION_IN_PROGRESS: '교육 진행 중',
    PROGRAM_ENDED: '프로그램 종료',
  } as Record<ProgramEnrollmentDisplayStatus, string>,
  colors: {
    WAITING_RESULT: 'cyan',
    REJECTED: 'red',
    EDUCATION_SCHEDULED: 'orange',
    EDUCATION_IN_PROGRESS: 'blue',
    PROGRAM_ENDED: 'default',
  } as Record<ProgramEnrollmentDisplayStatus, string>,
}

/**
 * 경제 교육 프로그램 목록과 동일 톤(텍스트 컬러 위주)으로 쓰는 5단계 라벨
 * — 강사 상세 > 프로그램 강의 이력 등
 */
export const programEnrollmentEconomyListLabels = {
  WAITING_RESULT: '신청 결과 대기 중',
  REJECTED: '신청 반려',
  EDUCATION_SCHEDULED: '프로그램 진행 예정',
  EDUCATION_IN_PROGRESS: '프로그램 진행 중',
  PROGRAM_ENDED: '프로그램 진행 완료',
} as const satisfies Record<ProgramEnrollmentDisplayStatus, string>

export function getProgramEnrollmentDisplayLabel(
  status: ProgramEnrollmentDisplayStatus | string
): string {
  return programEnrollmentDisplayConfig.labels[status as ProgramEnrollmentDisplayStatus] || status
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
  (
    [
      'WAITING_RESULT',
      'REJECTED',
      'EDUCATION_SCHEDULED',
      'EDUCATION_IN_PROGRESS',
      'PROGRAM_ENDED',
    ] as ProgramEnrollmentDisplayStatus[]
  ).map(key => [
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

/** 회원 상세 탭: Application.status + progressStatus → 표시용 5단계 */
export function getApplicationEnrollmentDisplayStatus(
  status: ApplicationStatus,
  progressStatus?: ApplicationProgressStatus
): ProgramEnrollmentDisplayStatus {
  if (status === 'submitted' || status === 'reviewing' || status === 'waiting') {
    return 'WAITING_RESULT'
  }
  if (status === 'rejected' || status === 'cancelled') {
    return 'REJECTED'
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
 * 프로그램 엔티티의 lifecycle → 회원 상세·경제 목록과 동일한 5단계 배지용 상태
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
  programLifecycleStatus?: ProgramLifecycleStatus
): ProgramEnrollmentDisplayStatus {
  const fromApplication = getApplicationEnrollmentDisplayStatus(
    applicationStatus,
    applicationProgressStatus
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
