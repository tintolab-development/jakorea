/**
 * 프로그램 진행 현황 배지 (교재 현황 배지와 동일 베이스 사용)
 * 라벨: status.ts programLifecycleStatusConfig 연동 (참여자/강사/봉사자 모집 예정·중·완료)
 * 4탭 위젯 목록(/programs/general·1사1교): 3단계 라벨 (프로그램 진행 예정/중/완료)
 */

import type { CSSProperties } from 'react'
import { useLocation } from 'react-router-dom'
import type { ProgramLifecycleStatus } from '@/types/domain'
import {
  getProgramLifecycleLabel,
  getProgramProgressPhase,
  PROGRAM_PROGRESS_PHASE_LABELS,
  type ProgramProgressPhaseKey,
} from '@/shared/constants/status'
import { AppStatusBadge } from './app-status-badge'
import './app-status-badge.css'
import './program-lifecycle-status-badge.css'

const LIST_PHASE_MODIFIER: Record<ProgramProgressPhaseKey, string> = {
  scheduled: 'program-lifecycle-status-badge--list-phase-scheduled',
  inProgress: 'program-lifecycle-status-badge--list-phase-in-progress',
  completed: 'program-lifecycle-status-badge--list-phase-completed',
}

function getListPhaseDisplayLabel(status: ProgramLifecycleStatus): string {
  return PROGRAM_PROGRESS_PHASE_LABELS[getProgramProgressPhase(status)]
}

function getListPhaseModifier(status: ProgramLifecycleStatus): string {
  return LIST_PHASE_MODIFIER[getProgramProgressPhase(status)]
}

export interface ProgramLifecycleStatusBadgeProps {
  status: ProgramLifecycleStatus
  className?: string
  style?: CSSProperties
  /**
   * `table`: 목록/테이블 컬럼용 — `AppStatusBadge` 기본 고정 폭(120px)을 풀고 라벨 길이에 맞춤.
   * 카드·요약 위젯 등은 기본값(`default`) 유지.
   */
  variant?: 'default' | 'table'
}

export function ProgramLifecycleStatusBadge({
  status,
  className,
  style,
  variant = 'default',
}: ProgramLifecycleStatusBadgeProps) {
  const location = useLocation()
  const p = location.pathname.replace(/\/$/, '') || '/'
  const isOverviewListPage =
    p === '/programs/economy-education' ||
    p === '/programs/company-school' ||
    p.startsWith('/programs/company-school/') ||
    p === '/programs/general' ||
    p.startsWith('/programs/general/') ||
    p === '/programs/trained-teachers' ||
    p.startsWith('/programs/trained-teachers/')

  const label = isOverviewListPage
    ? getListPhaseDisplayLabel(status)
    : getProgramLifecycleLabel(status)
  const modifier = isOverviewListPage
    ? getListPhaseModifier(status)
    : `program-lifecycle-status-badge--${status.replace(/_/g, '-')}`
  const variantClass = variant === 'table' ? ' program-lifecycle-status-badge--table' : ''

  return (
    <AppStatusBadge
      label={label}
      className={`program-lifecycle-status-badge ${modifier}${variantClass} ${className ?? ''}`.trim()}
      style={style}
    />
  )
}
