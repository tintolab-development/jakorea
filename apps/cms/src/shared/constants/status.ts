/**
 * 상태 라벨, 색상, 아이콘 중앙 관리
 * Phase 1.1: 상태 표시 로직 중앙화
 */

import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import type { ApplicationStatus, SettlementStatus } from '@/types/domain'
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
  } as Record<ApplicationStatus, string>,

  colors: {
    submitted: 'default',
    reviewing: 'processing',
    approved: 'success',
    rejected: 'error',
    cancelled: 'default',
  } as Record<ApplicationStatus, string>,

  icons: {
    submitted: ClockCircleOutlined,
    reviewing: ClockCircleOutlined,
    approved: CheckCircleOutlined,
    rejected: CloseCircleOutlined,
    cancelled: CloseCircleOutlined,
  } as Record<ApplicationStatus, React.ComponentType>,
}

// 정산 상태
export const settlementStatusConfig = {
  labels: {
    pending: '대기',
    calculated: '산출 완료',
    approved: '승인',
    paid: '지급 완료',
    cancelled: '취소',
  } as Record<SettlementStatus, string>,

  colors: {
    pending: 'default',
    calculated: 'processing',
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
  },

  colors: {
    school: 'cyan',
    student: 'blue',
    instructor: 'purple',
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

