import type { EducationDisplayStatus, EducationWithdrawalPhase } from '../model/types'
import type {
  PortalProgramApplicationDetail,
  PortalProgramApplicationListItem,
} from './types'

function asWireRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function readWireWithdrawalPhase(value: unknown): EducationWithdrawalPhase | undefined {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim().toLowerCase()
  if (normalized === 'during_education') return 'during_education'
  if (normalized === 'before_education') return 'before_education'
  return undefined
}

function readPositiveInt(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const parsed = Number(value.trim())
    if (Number.isInteger(parsed) && parsed > 0) return parsed
  }
  return undefined
}

function isGiveUpStatus(value: string | null | undefined): boolean {
  const upper = (value ?? '').trim().toUpperCase()
  return upper === 'GIVEN_UP' || upper.startsWith('GIVE_UP')
}

function isGiveUpBeforeFirstActivity(value: string | null | undefined): boolean {
  return (value ?? '').trim().toUpperCase().includes('BEFORE_FIRST')
}

function isCancelledStatus(value: string | null | undefined): boolean {
  const upper = (value ?? '').trim().toUpperCase()
  return upper === 'CANCELLED' || upper === 'CANCELED'
}

function hasStartedEducationHint(row: PortalProgramApplicationListItem): boolean {
  const participation =
    'participation' in row ? (row as PortalProgramApplicationDetail).participation : undefined
  const firstEducationAt = participation?.firstEducationAt?.trim()
  const lastEducationAt = participation?.lastEducationAt?.trim()
  const progress = participation?.progressPercent ?? row.progressPercent
  if (firstEducationAt || lastEducationAt) return true
  return typeof progress === 'number' && Number.isFinite(progress) && progress > 0
}

/**
 * OpenAPI `MemberPortalApplicationDetail` / `ApplicationListItemResponse`에는
 * `withdrawalPhase`가 없다. 실제 전달 필드는
 * `displayStatus`(활동 포기|신청 취소), `applicationStatus`, `participation.status`,
 * `firstEducationAt` / `lastEducationAt` / `progressPercent`이다.
 * 와이어에 명시 `withdrawalPhase`가 있으면 그대로 쓰고, 없는 값은 만들지 않는다.
 */
export function resolvePortalWithdrawalPhase(
  row: PortalProgramApplicationListItem,
  displayStatus: EducationDisplayStatus,
): EducationWithdrawalPhase | undefined {
  if (displayStatus !== 'withdrawn') return undefined

  const wire = asWireRecord(row)
  const participationWire = asWireRecord((row as PortalProgramApplicationDetail).participation)
  const explicit =
    readWireWithdrawalPhase(wire.withdrawalPhase) ??
    readWireWithdrawalPhase(participationWire.withdrawalPhase)
  if (explicit) return explicit

  const rawDisplay = (row.displayStatus ?? '').trim()
  if (rawDisplay === '신청 취소') return 'before_education'
  if (rawDisplay === '활동 포기') return 'during_education'

  const applicationStatus = row.applicationStatus ?? ''
  const participationStatus =
    row.participationStatus ?? (row as PortalProgramApplicationDetail).participation?.status ?? ''

  if (
    isGiveUpBeforeFirstActivity(applicationStatus) ||
    isGiveUpBeforeFirstActivity(participationStatus)
  ) {
    return 'before_education'
  }
  if (isCancelledStatus(applicationStatus) && !isGiveUpStatus(participationStatus)) {
    return 'before_education'
  }
  if (isGiveUpStatus(applicationStatus) || isGiveUpStatus(participationStatus)) {
    return 'during_education'
  }
  if (hasStartedEducationHint(row)) return 'during_education'
  return 'before_education'
}

/** OpenAPI에 없는 필드. 응답에 숫자가 있을 때만 매핑한다. */
export function resolveLastParticipatedSession(
  row: PortalProgramApplicationListItem,
): number | undefined {
  const wire = asWireRecord(row)
  const participationWire = asWireRecord((row as PortalProgramApplicationDetail).participation)
  return (
    readPositiveInt(wire.lastParticipatedSession) ??
    readPositiveInt(participationWire.lastParticipatedSession)
  )
}
