/**
 * UJAT 봉사 application_status — BE Primary SoT canonical만 사용.
 * INTERVIEW_EVALUATED는 application_status로 쓰지 않음 (면접 완료 = INTERVIEW_ASSIGNED + eval 행 2개).
 */

import type {
  UjatDocumentScreeningStatus,
  UjatInterviewAssignmentStatus,
  UjatSecondInterviewScreeningStatus,
} from '@/features/program/ujat/model/ujat-volunteer-screening-constants'

export const UJAT_CANONICAL_APPLICATION_STATUSES = [
  'WAITING_REVIEW',
  'DOCUMENT_PASSED',
  'INTERVIEW_ASSIGNED',
  'FINAL_SELECTED',
  'RESERVE',
  'INTERVIEW_FAILED',
  'GIVE_UP',
] as const

export type UjatCanonicalApplicationStatus =
  (typeof UJAT_CANONICAL_APPLICATION_STATUSES)[number]

export type UjatVolunteerStatusProjection = {
  canonicalStatus: UjatCanonicalApplicationStatus | 'UNKNOWN'
  documentScreeningStatus: UjatDocumentScreeningStatus
  interviewAssignmentStatus: UjatInterviewAssignmentStatus
  secondInterviewScreeningStatus?: UjatSecondInterviewScreeningStatus
  reserveRank?: number
}

type UjatVolunteerApplicationStatusInput = {
  applicationStatus?: string | null
  documentStatus?: string | null
  interviewStatus?: string | null
  finalResultStatus?: string | null
  reserveRank?: number
  giveUpYn?: boolean
}

function normalizeWireStatus(raw?: string | null): string {
  return String(raw ?? '')
    .trim()
    .toUpperCase()
    .replace(/-/g, '_')
}

function isDocumentPassed(status: string): boolean {
  return ['PASS', 'PASSED', 'APPROVED', 'DOCUMENT_PASSED'].includes(status)
}

function isDocumentRejected(status: string): boolean {
  return ['FAIL', 'FAILED', 'REJECTED', 'DOCUMENT_FAILED', 'DOCUMENT_REJECTED'].includes(status)
}

function isInterviewAssignedOrEvaluated(status: string): boolean {
  return ['ASSIGNED', 'PARTIALLY_EVALUATED', 'EVALUATED', 'COMPLETED'].includes(status)
}

/**
 * Admin API는 applicationStatus 하나가 아니라 심사 단계별 필드를 함께 반환한다.
 * 최종 결과와 서류 결과를 먼저 반영하고, applicationStatus는 레거시 응답에만 사용한다.
 */
function resolveUjatVolunteerCanonicalStatus(
  input: UjatVolunteerApplicationStatusInput
): UjatCanonicalApplicationStatus | 'UNKNOWN' {
  if (input.giveUpYn) return 'GIVE_UP'

  const finalResultStatus = normalizeWireStatus(input.finalResultStatus)
  if (finalResultStatus === 'PASS') return 'FINAL_SELECTED'
  if (finalResultStatus === 'FAIL') return 'INTERVIEW_FAILED'
  if (finalResultStatus === 'RESERVE') return 'RESERVE'

  const documentStatus = normalizeWireStatus(input.documentStatus)
  const applicationStatus = normalizeWireStatus(input.applicationStatus)
  const interviewStatus = normalizeWireStatus(input.interviewStatus)
  const hasDetailStatus = Boolean(input.documentStatus || input.interviewStatus || input.finalResultStatus)

  // REJECTED is ambiguous without the stage-specific fields. An explicit document
  // rejection must stay in the first-stage result instead of becoming interview fail.
  if (isDocumentRejected(documentStatus)) return 'UNKNOWN'

  if (isDocumentPassed(documentStatus) && isInterviewAssignedOrEvaluated(interviewStatus)) {
    return 'INTERVIEW_ASSIGNED'
  }

  if (applicationStatus === 'REJECTED' && hasDetailStatus) return 'UNKNOWN'

  const legacyCanonical = normalizeUjatVolunteerApplicationStatus(input.applicationStatus, {
    giveUpYn: false,
    reserveRank: input.reserveRank,
  })
  if (
    isDocumentPassed(documentStatus) &&
    ['FINAL_SELECTED', 'RESERVE', 'INTERVIEW_FAILED', 'GIVE_UP', 'INTERVIEW_ASSIGNED'].includes(
      legacyCanonical
    )
  ) {
    return legacyCanonical
  }
  if (isDocumentPassed(documentStatus)) return 'DOCUMENT_PASSED'

  return legacyCanonical
}

/** thin/alias → canonical (표시·필터용). PASSED/WAITING/FINAL_ACCEPTED는 Primary에 맞게 정규화 */
export function normalizeUjatVolunteerApplicationStatus(
  raw?: string | null,
  options?: { giveUpYn?: boolean; reserveRank?: number }
): UjatCanonicalApplicationStatus | 'UNKNOWN' {
  if (options?.giveUpYn) return 'GIVE_UP'
  if (raw == null || String(raw).trim() === '') return 'UNKNOWN'
  const normalized = String(raw).trim().toUpperCase().replace(/-/g, '_')

  if ((UJAT_CANONICAL_APPLICATION_STATUSES as readonly string[]).includes(normalized)) {
    return normalized as UjatCanonicalApplicationStatus
  }

  switch (normalized) {
    case 'WAITING':
    case 'PENDING':
    case 'SUBMITTED':
      return 'WAITING_REVIEW'
    case 'PASSED':
    case 'DOCUMENT_PASS':
    case 'DOC_PASSED':
      return 'DOCUMENT_PASSED'
    case 'INTERVIEW_EVALUATED':
    case 'INTERVIEW_COMPLETED':
    case 'ASSIGNED':
      return 'INTERVIEW_ASSIGNED'
    case 'FINAL_ACCEPTED':
    case 'FINAL_PASS':
    case 'SELECTED':
    case 'PASS':
      return 'FINAL_SELECTED'
    case 'FAILED':
    case 'FAIL':
    case 'REJECTED':
      return 'INTERVIEW_FAILED'
    case 'WITHDRAWN':
    case 'CANCELLED':
      return 'GIVE_UP'
    default:
      if (normalized.startsWith('RESERVE')) return 'RESERVE'
      return 'UNKNOWN'
  }
}

export function projectUjatVolunteerApplicationStatus(
  input: UjatVolunteerApplicationStatusInput
): UjatVolunteerStatusProjection {
  const canonical = resolveUjatVolunteerCanonicalStatus(input)

  if (canonical === 'WAITING_REVIEW') {
    return {
      canonicalStatus: canonical,
      documentScreeningStatus: 'pending',
      interviewAssignmentStatus: 'waiting',
      secondInterviewScreeningStatus: 'waiting',
    }
  }
  if (canonical === 'DOCUMENT_PASSED') {
    return {
      canonicalStatus: canonical,
      documentScreeningStatus: 'pass',
      interviewAssignmentStatus: 'waiting',
      secondInterviewScreeningStatus: 'waiting',
    }
  }
  if (canonical === 'INTERVIEW_ASSIGNED') {
    const interviewStatus = normalizeWireStatus(input.interviewStatus)
    return {
      canonicalStatus: canonical,
      documentScreeningStatus: 'pass',
      interviewAssignmentStatus: 'assigned',
      secondInterviewScreeningStatus:
        interviewStatus === 'EVALUATED' ? 'completed' : 'waiting',
    }
  }
  if (canonical === 'FINAL_SELECTED') {
    return {
      canonicalStatus: canonical,
      documentScreeningStatus: 'pass',
      interviewAssignmentStatus: 'assigned',
      secondInterviewScreeningStatus: 'pass',
    }
  }
  if (canonical === 'RESERVE') {
    const rank = Math.min(4, Math.max(1, input.reserveRank ?? 1)) as 1 | 2 | 3 | 4
    return {
      canonicalStatus: canonical,
      documentScreeningStatus: 'pass',
      interviewAssignmentStatus: 'assigned',
      secondInterviewScreeningStatus: `reserve${rank}`,
      reserveRank: rank,
    }
  }
  if (canonical === 'INTERVIEW_FAILED') {
    return {
      canonicalStatus: canonical,
      documentScreeningStatus: 'pass',
      interviewAssignmentStatus: 'assigned',
      secondInterviewScreeningStatus: 'fail',
    }
  }
  if (canonical === 'GIVE_UP') {
    return {
      canonicalStatus: canonical,
      documentScreeningStatus: 'pass',
      interviewAssignmentStatus: 'withdrawn',
      secondInterviewScreeningStatus: undefined,
    }
  }

  // fallback — document/interview/final columns (비-Primary 응답)
  const doc = normalizeWireStatus(input.documentStatus)
  const documentScreeningStatus: UjatDocumentScreeningStatus =
    isDocumentPassed(doc)
      ? 'pass'
      : isDocumentRejected(doc)
        ? 'fail'
        : 'pending'

  return {
    canonicalStatus: 'UNKNOWN',
    documentScreeningStatus,
    interviewAssignmentStatus: input.giveUpYn ? 'withdrawn' : 'waiting',
    secondInterviewScreeningStatus: undefined,
  }
}
