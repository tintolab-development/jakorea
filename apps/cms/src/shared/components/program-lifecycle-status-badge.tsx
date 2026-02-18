/**
 * 프로그램 진행 현황 배지 (교재 현황 배지와 동일 베이스 사용)
 * 상태: 수강자 모집 중, 강사 모집 중, 교재 준비 중, 교육 진행 중, 교육 완료, 서류 처리 완료
 */

import type { ProgramLifecycleStatus } from '@/types/domain'
import { AppStatusBadge } from './app-status-badge'
import './app-status-badge.css'
import './program-lifecycle-status-badge.css'

const LABELS: Record<ProgramLifecycleStatus, string> = {
  planned: '모집 예정',
  recruiting_students: '수강자 모집 중',
  recruiting_instructors: '강사 모집 중',
  matching_completed: '교재 준비 중',
  education_before_textbook: '교육 진행 중',
  education_after_textbook: '교육 진행 중',
  education_completed: '교육 완료',
  document_processing_completed: '서류 처리 완료',
}

export interface ProgramLifecycleStatusBadgeProps {
  status: ProgramLifecycleStatus
  className?: string
}

export function ProgramLifecycleStatusBadge({ status, className }: ProgramLifecycleStatusBadgeProps) {
  const label = LABELS[status] ?? status
  const modifier = `program-lifecycle-status-badge--${status.replace(/_/g, '-')}`
  return (
    <AppStatusBadge
      label={label}
      className={`program-lifecycle-status-badge ${modifier} ${className ?? ''}`.trim()}
    />
  )
}
