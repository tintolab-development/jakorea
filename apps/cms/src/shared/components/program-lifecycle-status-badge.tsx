/**
 * 프로그램 진행 현황 배지 (교재 현황 배지와 동일 베이스 사용)
 * 라벨: status.ts programLifecycleStatusConfig 연동 (참여자/강사/봉사자 모집 예정·중·완료)
 * 경제 교육 페이지: 3단계 라벨 (프로그램 진행 예정/중/완료) 및 스크린샷 색상 적용
 */

import { useLocation } from 'react-router-dom'
import type { ProgramLifecycleStatus } from '@/types/domain'
import { getProgramLifecycleLabel } from '@/shared/constants/status'
import { AppStatusBadge } from './app-status-badge'
import './app-status-badge.css'
import './program-lifecycle-status-badge.css'

/** 경제 교육 페이지 3단계 라벨 (스크린샷 기준) */
const ECONOMY_LABELS = {
  scheduled: '프로그램 진행 예정',
  inProgress: '프로그램 진행 중',
  completed: '프로그램 진행 완료',
} as const

const ECONOMY_SCHEDULED_STATUSES: ProgramLifecycleStatus[] = [
  'planned',
  'instructor_recruitment_planned',
  'volunteer_recruitment_planned',
  'recruiting_students',
  'recruiting_instructors',
  'recruiting_volunteers',
  'matching_completed',
  'education_before_textbook',
]
const ECONOMY_IN_PROGRESS_STATUSES: ProgramLifecycleStatus[] = ['education_after_textbook']
const ECONOMY_COMPLETED_STATUSES: ProgramLifecycleStatus[] = [
  'education_completed',
  'document_processing_completed',
]

function getEconomyDisplayLabel(status: ProgramLifecycleStatus): string {
  if (ECONOMY_SCHEDULED_STATUSES.includes(status)) return ECONOMY_LABELS.scheduled
  if (ECONOMY_IN_PROGRESS_STATUSES.includes(status)) return ECONOMY_LABELS.inProgress
  if (ECONOMY_COMPLETED_STATUSES.includes(status)) return ECONOMY_LABELS.completed
  return getProgramLifecycleLabel(status)
}

function getEconomyModifier(status: ProgramLifecycleStatus): string {
  if (ECONOMY_SCHEDULED_STATUSES.includes(status)) return 'program-lifecycle-status-badge--economy-scheduled'
  if (ECONOMY_IN_PROGRESS_STATUSES.includes(status)) return 'program-lifecycle-status-badge--economy-in-progress'
  if (ECONOMY_COMPLETED_STATUSES.includes(status)) return 'program-lifecycle-status-badge--economy-completed'
  return `program-lifecycle-status-badge--${status.replace(/_/g, '-')}`
}

export interface ProgramLifecycleStatusBadgeProps {
  status: ProgramLifecycleStatus
  className?: string
}

export function ProgramLifecycleStatusBadge({ status, className }: ProgramLifecycleStatusBadgeProps) {
  const location = useLocation()
  const isEconomyPage = location.pathname === '/programs/economy-education'

  const label = isEconomyPage ? getEconomyDisplayLabel(status) : getProgramLifecycleLabel(status)
  const modifier = isEconomyPage ? getEconomyModifier(status) : `program-lifecycle-status-badge--${status.replace(/_/g, '-')}`

  return (
    <AppStatusBadge
      label={label}
      className={`program-lifecycle-status-badge ${modifier} ${className ?? ''}`.trim()}
    />
  )
}
