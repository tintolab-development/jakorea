/**
 * 프로그램 진행 현황 — 텍스트 전용 표시
 * 일반·1사1교: typed lifecycleStatus 라벨 (목록 셀과 동일)
 * UJAT: 7단계 enrollment 배지
 */

import type { ProgramLifecycleStatus, UjatProgramProgressStatus } from '@/types/domain'
import type { ProgramEnrollmentDisplayStatus } from '@/shared/constants/status'
import { getProgramProgressDisplayStatus } from '@/shared/constants/status'
import { ProgramListOverviewProgressCell } from './program-list-overview-progress-cell'
import { StatusBadge } from './status-badge'

export interface ProgramEnrollmentStatusTextProps {
  status: ProgramEnrollmentDisplayStatus
  className?: string
}

/** 7단계 상태 키로 텍스트 색상 표시 */
export function ProgramEnrollmentStatusText({
  status,
  className,
}: ProgramEnrollmentStatusTextProps) {
  return (
    <StatusBadge domain="programEnrollment" status={status} variant="text" className={className} />
  )
}

export interface ProgramProgressStatusTextProps {
  program: {
    ujatProgressStatus?: UjatProgramProgressStatus
    lifecycleStatus?: ProgramLifecycleStatus
  }
  className?: string
}

/** Program 엔티티에서 진행 현황을 추론해 텍스트 색상 표시 */
export function ProgramProgressStatusText({ program, className }: ProgramProgressStatusTextProps) {
  if (program.ujatProgressStatus) {
    return (
      <ProgramEnrollmentStatusText
        status={getProgramProgressDisplayStatus(program)}
        className={className}
      />
    )
  }

  return (
    <ProgramListOverviewProgressCell status={program.lifecycleStatus} className={className} />
  )
}

export interface ProgramLifecycleEnrollmentStatusTextProps {
  lifecycleStatus: ProgramLifecycleStatus | undefined | null
  className?: string
}

/** lifecycle만 있을 때 — 목록·상세와 동일 typed 라벨 */
export function ProgramLifecycleEnrollmentStatusText({
  lifecycleStatus,
  className,
}: ProgramLifecycleEnrollmentStatusTextProps) {
  return <ProgramListOverviewProgressCell status={lifecycleStatus} className={className} />
}
