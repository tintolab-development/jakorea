/**
 * UJAT 프로그램 목록 — 프로그램 진행 현황 (5종)
 * 모집 신청 현황(`lifecycleStatus`)과 별도.
 */

import type { UjatProgramProgressStatus } from '@/types/domain'

export const UJAT_PROGRAM_LIST_PROGRESS_ORDER: readonly UjatProgramProgressStatus[] = [
  'EDUCATION_SCHEDULED',
  'PARTICIPANT_RECRUITING',
  'VOLUNTEER_RECRUITING',
  'EDUCATION_IN_PROGRESS',
  'PROGRAM_ENDED',
] as const

export const UJAT_PROGRAM_LIST_PROGRESS_LABELS: Record<UjatProgramProgressStatus, string> = {
  EDUCATION_SCHEDULED: '프로그램 진행 예정',
  PARTICIPANT_RECRUITING: '참여자 모집 중',
  VOLUNTEER_RECRUITING: '봉사자 모집 중',
  EDUCATION_IN_PROGRESS: '프로그램 진행 중',
  PROGRAM_ENDED: '프로그램 진행 완료',
}

export const UJAT_PROGRAM_LIST_PROGRESS_COLORS: Record<UjatProgramProgressStatus, string> = {
  EDUCATION_SCHEDULED: 'var(--color-green, #1e8c29)',
  PARTICIPANT_RECRUITING: 'var(--color-orange, #f07917)',
  VOLUNTEER_RECRUITING: 'var(--color-purple, #8457ce)',
  EDUCATION_IN_PROGRESS: 'var(--color-blue, #017eaf)',
  PROGRAM_ENDED: '#374151',
}

export function getUjatProgramListProgressLabel(
  status: UjatProgramProgressStatus | undefined | null
): string {
  if (!status) return '-'
  return UJAT_PROGRAM_LIST_PROGRESS_LABELS[status] ?? status
}

export function resolveUjatProgramListProgressStatus(program: {
  ujatProgressStatus?: UjatProgramProgressStatus
}): UjatProgramProgressStatus | null {
  const status = program.ujatProgressStatus
  if (!status) return null
  if (status in UJAT_PROGRAM_LIST_PROGRESS_LABELS) return status
  return null
}
