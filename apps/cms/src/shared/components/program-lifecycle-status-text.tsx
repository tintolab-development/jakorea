/**
 * 프로그램 진행 현황 읽기 전용 텍스트 (태그/배지 없이 색상만 적용)
 * 대시보드 모집 신청 현황 위젯 등에서 사용
 */

import type { ProgramLifecycleStatus } from '@/types/domain'
import { getProgramLifecycleLabel } from '@/shared/constants/status'
import './program-lifecycle-status-badge.css'

export interface ProgramLifecycleStatusTextProps {
  status: ProgramLifecycleStatus
  className?: string
}

export function ProgramLifecycleStatusText({ status, className }: ProgramLifecycleStatusTextProps) {
  const label = getProgramLifecycleLabel(status)
  const modifier = `program-lifecycle-status-text--${status.replace(/_/g, '-')}`
  return (
    <span
      className={`program-lifecycle-status-text ${modifier} ${className ?? ''}`.trim()}
    >
      {label}
    </span>
  )
}
