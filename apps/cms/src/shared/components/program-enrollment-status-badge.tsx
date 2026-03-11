/**
 * 프로그램 수강 이력 테이블 > 프로그램 진행 현황 배지
 * ProgramLifecycleStatusBadge와 동일한 UI 베이스(AppStatusBadge) 사용
 * 상태: 신청 결과 대기 중, 신청 반려, 교육 진행 예정, 교육 진행 중, 프로그램 종료
 */

import type { ProgramEnrollmentDisplayStatus } from '@/shared/constants/status'
import { programEnrollmentDisplayConfig } from '@/shared/constants/status'
import { AppStatusBadge } from './app-status-badge'
import './app-status-badge.css'
import './program-enrollment-status-badge.css'

export interface ProgramEnrollmentStatusBadgeProps {
  status: ProgramEnrollmentDisplayStatus
  className?: string
}

export function ProgramEnrollmentStatusBadge({ status, className }: ProgramEnrollmentStatusBadgeProps) {
  const label = programEnrollmentDisplayConfig.labels[status] ?? status
  const modifier = `program-enrollment-status-badge--${status.replace(/_/g, '-').toLowerCase()}`
  return (
    <AppStatusBadge
      label={label}
      className={`program-enrollment-status-badge ${modifier} ${className ?? ''}`.trim()}
    />
  )
}
