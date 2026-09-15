/**
 * Backend local demo — UJAT Primary 5 Case SoT (182101–182105).
 * BE: LocalDemoUjatPrimaryCasesSeedContributor
 */

import type { UjatProgramProgressStatus } from '@/types/domain'

export const UJAT_PRIMARY_PROGRAM_IDS = [
  '182101',
  '182102',
  '182103',
  '182104',
  '182105',
] as const

export type UjatPrimaryProgramId = (typeof UJAT_PRIMARY_PROGRAM_IDS)[number]

export const UJAT_PRIMARY_CASE_UUIDS = [
  'ujat-primary-case-01',
  'ujat-primary-case-02',
  'ujat-primary-case-03',
  'ujat-primary-case-04',
  'ujat-primary-case-05',
] as const

/** Primary id → SoT progress (목록 serviceDetail 없을 때 fallback) */
export const UJAT_PRIMARY_PROGRESS_BY_ID: Record<UjatPrimaryProgramId, UjatProgramProgressStatus> =
  {
    '182101': 'EDUCATION_SCHEDULED',
    '182102': 'PARTICIPANT_RECRUITING',
    '182103': 'VOLUNTEER_RECRUITING',
    '182104': 'EDUCATION_IN_PROGRESS',
    '182105': 'PROGRAM_ENDED',
  }

export function isUjatPrimaryProgramId(programId: string | null | undefined): boolean {
  if (!programId) return false
  return (UJAT_PRIMARY_PROGRAM_IDS as readonly string[]).includes(String(programId))
}

export function isUjatPrimaryCaseUuid(value: string | null | undefined): boolean {
  if (!value) return false
  return (UJAT_PRIMARY_CASE_UUIDS as readonly string[]).includes(String(value))
}

/** mock string id · Primary 숫자 id · uuid · 로컬 등록 prefix 판별용 */
export function looksLikeUjatProgramId(programId: string | null | undefined): boolean {
  if (!programId) return false
  const id = String(programId)
  return (
    isUjatPrimaryProgramId(id) ||
    isUjatPrimaryCaseUuid(id) ||
    id.startsWith('ujat-progress-') ||
    id.startsWith('ujat-pending-') ||
    id.startsWith('ujat-local-') ||
    /^18[0-9]{4}$/.test(id)
  )
}

export function resolveUjatPrimaryProgressById(
  programId: string | null | undefined
): UjatProgramProgressStatus | undefined {
  if (!programId || !isUjatPrimaryProgramId(programId)) return undefined
  return UJAT_PRIMARY_PROGRESS_BY_ID[programId as UjatPrimaryProgramId]
}
