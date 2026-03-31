/**
 * 프로그램 수강/강의 이력 > 프로그램 진행 현황 배지
 * - default: 칩형(배경·테두리)
 * - economyList: 프로그램 관리 > 경제 교육 목록과 같은 텍스트 컬러만(배경 없음)
 */

import type { ProgramEnrollmentDisplayStatus } from '@/shared/constants/status'
import {
  programEnrollmentDisplayConfig,
  programEnrollmentEconomyListLabels,
} from '@/shared/constants/status'
import { AppStatusBadge } from './app-status-badge'
import './app-status-badge.css'
import './program-enrollment-status-badge.css'

export type ProgramEnrollmentStatusBadgeVariant = 'default' | 'economyList'

export interface ProgramEnrollmentStatusBadgeProps {
  status: ProgramEnrollmentDisplayStatus
  className?: string
  variant?: ProgramEnrollmentStatusBadgeVariant
}

export function ProgramEnrollmentStatusBadge({
  status,
  className,
  variant = 'default',
}: ProgramEnrollmentStatusBadgeProps) {
  const label =
    variant === 'economyList'
      ? (programEnrollmentEconomyListLabels[status] ?? programEnrollmentDisplayConfig.labels[status] ?? status)
      : (programEnrollmentDisplayConfig.labels[status] ?? status)
  const modifier = `program-enrollment-status-badge--${status.replace(/_/g, '-').toLowerCase()}`
  const variantClass =
    variant === 'economyList' ? ' program-enrollment-status-badge--variant-economy-list' : ''
  return (
    <AppStatusBadge
      label={label}
      className={`program-enrollment-status-badge ${modifier}${variantClass} ${className ?? ''}`.trim()}
    />
  )
}
