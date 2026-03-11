/**
 * 프로그램 진행 현황 배지 (교재 현황 배지와 동일 베이스 사용)
 * 라벨: status.ts programLifecycleStatusConfig 연동 (참여자/강사/봉사자 모집 예정·중·완료)
 */

import type { ProgramLifecycleStatus } from '@/types/domain'
import { getProgramLifecycleLabel } from '@/shared/constants/status'
import { AppStatusBadge } from './app-status-badge'
import './app-status-badge.css'
import './program-lifecycle-status-badge.css'

export interface ProgramLifecycleStatusBadgeProps {
  status: ProgramLifecycleStatus
  className?: string
}

export function ProgramLifecycleStatusBadge({ status, className }: ProgramLifecycleStatusBadgeProps) {
  const label = getProgramLifecycleLabel(status)
  const modifier = `program-lifecycle-status-badge--${status.replace(/_/g, '-')}`
  return (
    <AppStatusBadge
      label={label}
      className={`program-lifecycle-status-badge ${modifier} ${className ?? ''}`.trim()}
    />
  )
}
