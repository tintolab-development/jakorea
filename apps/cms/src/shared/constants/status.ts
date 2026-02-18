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
    'matching_completed',
    'education_after_textbook', // 쿼리값: '교육 진행 중' = before + after 모두 표시
    'education_completed',
    'document_processing_completed',
  ] as ProgramLifecycleStatus[],
  labels: {
    planned: '모집 예정',
    recruiting_students: '수강자 모집 중',
    recruiting_instructors: '강사 모집 중',
    matching_completed: '교재 준비 중',
    education_before_textbook: '교육 진행 중',
    education_after_textbook: '교육 진행 중',
    education_completed: '교육 완료',
    document_processing_completed: '서류 처리 완료',
  } as Record<ProgramLifecycleStatus, string>,
  colors: {
    planned: 'default',
    recruiting_students: 'geekblue',
    recruiting_instructors: 'purple',
    matching_completed: 'cyan',
    education_before_textbook: 'cyan',
    education_after_textbook: 'cyan',
    education_completed: 'green',
    document_processing_completed: 'blue',
  } as Record<ProgramLifecycleStatus, string>,
}

export function getProgramLifecycleLabel(status: ProgramLifecycleStatus | string): string {
  return programLifecycleStatusConfig.labels[status as ProgramLifecycleStatus] || status
}

export function getProgramLifecycleColor(status: ProgramLifecycleStatus | string): string {
  return programLifecycleStatusConfig.colors[status as ProgramLifecycleStatus] || 'default'
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
    programLifecycleStatusConfig.order.map(status => [
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
