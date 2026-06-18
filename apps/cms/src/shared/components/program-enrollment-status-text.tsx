/**
 * 프로그램 진행 현황(7단계) — 텍스트 전용 표시
 * UJAT·일반 프로그램 상세 공통. 색상은 `status-badge.css` program-enrollment 토큰.
 */

import type { ProgramLifecycleStatus, UjatProgramProgressStatus } from '@/types/domain'
import type { ProgramEnrollmentDisplayStatus } from '@/shared/constants/status'
import {
  getEnrollmentDisplayStatusFromProgramLifecycle,
  getProgramProgressDisplayStatus,
} from '@/shared/constants/status'
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
  return (
    <ProgramEnrollmentStatusText
      status={getProgramProgressDisplayStatus(program)}
      className={className}
    />
  )
}

export interface ProgramLifecycleEnrollmentStatusTextProps {
  lifecycleStatus: ProgramLifecycleStatus | undefined | null
  className?: string
}

/** lifecycle만 있을 때 7단계로 매핑해 텍스트 색상 표시 */
export function ProgramLifecycleEnrollmentStatusText({
  lifecycleStatus,
  className,
}: ProgramLifecycleEnrollmentStatusTextProps) {
  return (
    <ProgramEnrollmentStatusText
      status={getEnrollmentDisplayStatusFromProgramLifecycle(lifecycleStatus)}
      className={className}
    />
  )
}
