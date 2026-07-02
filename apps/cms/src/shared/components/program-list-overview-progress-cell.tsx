/**
 * 4탭 overview 목록 — 프로그램 진행 현황 텍스트 (배지 없음)
 * 전체 프로그램 탭 등: 프로그램 진행 예정 / 진행 중 / 완료
 */

import type { ProgramLifecycleStatus } from '@/types/domain'
import { getProgramProgressPhaseDisplay } from '@/shared/constants/status'
import './program-lifecycle-status-badge.css'

export interface ProgramListOverviewProgressCellProps {
  status: ProgramLifecycleStatus
  className?: string
}

export function ProgramListOverviewProgressCell({
  status,
  className,
}: ProgramListOverviewProgressCellProps) {
  const { label, color } = getProgramProgressPhaseDisplay(status)

  return (
    <span
      className={['program-lifecycle-status-text', className].filter(Boolean).join(' ')}
      style={{ color }}
    >
      {label}
    </span>
  )
}
