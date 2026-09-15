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

export function projectUjatVolunteerApplicationStatus(input: {
  applicationStatus?: string | null
  documentStatus?: string | null
  interviewStatus?: string | null
  finalResultStatus?: string | null
  reserveRank?: number
  giveUpYn?: boolean
}): UjatVolunteerStatusProjection {
  const canonical = normalizeUjatVolunteerApplicationStatus(input.applicationStatus, {
    giveUpYn: input.giveUpYn,
    reserveRank: input.reserveRank,
  })

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
    return {
      canonicalStatus: canonical,
      documentScreeningStatus: 'pass',
      interviewAssignmentStatus: 'assigned',
      // 면접 완료 여부는 evaluation 행 개수(2)로 UI에서 판단 — status만으로 completed 강제하지 않음
      secondInterviewScreeningStatus: 'waiting',
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
  const doc = String(input.documentStatus ?? '').toUpperCase()
  const documentScreeningStatus: UjatDocumentScreeningStatus =
    ['PASS', 'PASSED', 'APPROVED', 'DOCUMENT_PASSED'].includes(doc)
      ? 'pass'
      : ['FAIL', 'FAILED', 'REJECTED'].includes(doc)
        ? 'fail'
        : 'pending'

  return {
    canonicalStatus: 'UNKNOWN',
    documentScreeningStatus,
    interviewAssignmentStatus: input.giveUpYn ? 'withdrawn' : 'waiting',
    secondInterviewScreeningStatus: undefined,
  }
}
