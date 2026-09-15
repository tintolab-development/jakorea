/**
 * 일반·1사1교 목록 「진행 현황」— typed lifecycleStatus 라벨 (상세 상단 위젯과 동일 SSOT)
 */

import type { ProgramLifecycleStatus } from '@/types/domain'
import { getTypedProgramLifecycleDisplay } from '@/shared/lib/program-typed-lifecycle'
import './program-lifecycle-status-badge.css'

export interface ProgramListOverviewProgressCellProps {
  status: ProgramLifecycleStatus | string | null | undefined
  className?: string
}

export function ProgramListOverviewProgressCell({
  status,
  className,
}: ProgramListOverviewProgressCellProps) {
  const { label, color } = getTypedProgramLifecycleDisplay(status)

  return (
    <span
      className={['program-lifecycle-status-text', className].filter(Boolean).join(' ')}
      style={{ color }}
    >
      {label}
    </span>
  )
}
