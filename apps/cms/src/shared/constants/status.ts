/**
 * 상태 라벨, 색상, 아이콘 중앙 관리
 * Phase 1.1: 상태 표시 로직 중앙화
 */

import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import type { ApplicationStatus, SettlementStatus, ProgramLifecycleStatus, ReportStatus } from '@/types/domain'
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

// 프로그램 진행 워크플로우 상태
export const programLifecycleStatusConfig = {
  order: [
    'planned',
    'recruiting_students',
    'recruiting_instructors',
    'recruitment_completed_waiting',
    'matching_completed_waiting',
    'in_progress',
    'completed',
  ] as ProgramLifecycleStatus[],
  labels: {
    planned: '모집 예정',
    recruiting_students: '수강자 모집 중',
    recruiting_instructors: '강사 모집 중',
    recruitment_completed_waiting: '모집 완료 및 대기 중',
    matching_completed_waiting: '매칭 완료 및 진행 대기 중',
    in_progress: '진행 중',
    completed: '진행 완료',
  } as Record<ProgramLifecycleStatus, string>,
  colors: {
    planned: 'default',
    recruiting_students: 'geekblue',
    recruiting_instructors: 'purple',
    recruitment_completed_waiting: 'gold',
    matching_completed_waiting: 'cyan',
    in_progress: 'green',
    completed: 'blue',
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

