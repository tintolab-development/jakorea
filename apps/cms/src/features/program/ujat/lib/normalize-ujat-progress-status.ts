/**
 * UJAT 진행 현황 정규화 — BE SoT canonical만 유지.
 * FE Mock alias(PASSED/WAITING/FINAL_ACCEPTED 등)는 Primary progress로 매핑.
 */

import type { ProgramLifecycleStatus, UjatProgramProgressStatus } from '@/types/domain'

/** list-progress와 순환 import 금지 — canonical 집합은 여기에만 둔다 */
const CANONICAL = new Set<string>([
  'EDUCATION_SCHEDULED',
  'PARTICIPANT_RECRUITING',
  'VOLUNTEER_RECRUITING',
  'EDUCATION_IN_PROGRESS',
  'PROGRAM_ENDED',
])

/** periodStatus → 거친 progress (RECRUITING은 Primary id 맵이 우선) */
export function mapPeriodStatusToUjatProgress(
  periodStatus?: string | null
): UjatProgramProgressStatus | undefined {
  if (!periodStatus) return undefined
  switch (periodStatus.trim().toUpperCase()) {
    case 'SCHEDULED':
    case 'PLANNED':
      return 'EDUCATION_SCHEDULED'
    case 'RECRUITING':
      return 'PARTICIPANT_RECRUITING'
    case 'IN_PROGRESS':
    case 'RUNNING':
      return 'EDUCATION_IN_PROGRESS'
    case 'COMPLETED':
    case 'ENDED':
      return 'PROGRAM_ENDED'
    default:
      return undefined
  }
}

export function mapPeriodStatusToLifecycle(
  periodStatus?: string | null
): ProgramLifecycleStatus | undefined {
  if (!periodStatus) return undefined
  switch (periodStatus.trim().toUpperCase()) {
    case 'SCHEDULED':
    case 'PLANNED':
      return 'planned'
    case 'RECRUITING':
      return 'recruiting_students'
    case 'IN_PROGRESS':
    case 'RUNNING':
      return 'education_in_progress'
    case 'COMPLETED':
    case 'ENDED':
      return 'document_processing_completed'
    default:
      return undefined
  }
}

/**
 * 임의 문자열 → canonical UjatProgramProgressStatus.
 * 알 수 없으면 undefined (목록은 Primary id / periodStatus fallback).
 */
export function normalizeUjatProgressStatus(
  raw?: string | null
): UjatProgramProgressStatus | undefined {
  if (raw == null || String(raw).trim() === '') return undefined
  const normalized = String(raw).trim().toUpperCase().replace(/-/g, '_')

  if (CANONICAL.has(normalized)) {
    return normalized as UjatProgramProgressStatus
  }

  // legacy / thin mock aliases → SoT
  switch (normalized) {
    case 'PASSED':
    case 'FINAL_ACCEPTED':
    case 'FINAL_SELECTED':
    case 'WAITING':
    case 'SCHEDULED':
    case 'PLANNED':
      return 'EDUCATION_SCHEDULED'
    case 'PARTICIPANT_RECRUIT':
    case 'SCHOOL_RECRUITING':
    case 'ORG_RECRUITING':
      return 'PARTICIPANT_RECRUITING'
    case 'VOLUNTEER_RECRUIT':
    case 'DGBONG_RECRUITING':
      return 'VOLUNTEER_RECRUITING'
    case 'IN_PROGRESS':
    case 'RUNNING':
    case 'EDUCATION_RUNNING':
      return 'EDUCATION_IN_PROGRESS'
    case 'COMPLETED':
    case 'ENDED':
    case 'PROGRAM_COMPLETE':
    case 'FINISHED':
      return 'PROGRAM_ENDED'
    default:
      return undefined
  }
}

export function resolveUjatProgressStatus(input: {
  ujatProgressStatus?: string | null
  periodStatus?: string | null
  primaryFallback?: UjatProgramProgressStatus
}): UjatProgramProgressStatus | undefined {
  return (
    normalizeUjatProgressStatus(input.ujatProgressStatus) ??
    input.primaryFallback ??
    mapPeriodStatusToUjatProgress(input.periodStatus)
  )
}
