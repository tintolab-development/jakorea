/**
 * 신청 승인 409 `APPLICATION_DECISION_CONFLICT` — 참여자격(초상권 / 1365 ID) 미충족 안내.
 * @see JABACK docs/frontend/application-approval-eligibility-conflict-details-frontend-handoff-2026-10-07.md
 */

import {
  extractApiErrorCode,
  extractApiErrorDetails,
} from '@/shared/lib/extract-api-error-message'
import { formatDateDot } from '@/shared/utils/date'

const APPLICATION_DECISION_CONFLICT = 'APPLICATION_DECISION_CONFLICT'

export const PORTRAIT_RIGHTS_CONSENT_REQUIRED = 'PORTRAIT_RIGHTS_CONSENT_REQUIRED'
export const EXTERNAL_1365_ID_REQUIRED = 'EXTERNAL_1365_ID_REQUIRED'

/** 봉사자 승인 409 — 1365 ID 미등록 */
export const VOLUNTEER_1365_APPROVAL_BLOCKED_ALERT = {
  title: '봉사자 신청 승인 불가 안내',
  content:
    '1365 ID가 등록되지 않은 봉사 신청자는\n프로그램 신청 승인이 불가합니다.',
} as const

type EligibilityRequirement =
  | typeof PORTRAIT_RIGHTS_CONSENT_REQUIRED
  | typeof EXTERNAL_1365_ID_REQUIRED

function isEligibilityRequirement(value: string): value is EligibilityRequirement {
  return value === PORTRAIT_RIGHTS_CONSENT_REQUIRED || value === EXTERNAL_1365_ID_REQUIRED
}

/** `missingRequirements`가 없는 구버전 서버는 `reason` 하나만 사용한다. */
export function parseMissingEligibilityRequirements(
  details: Record<string, string | undefined>
): EligibilityRequirement[] {
  const raw = details.missingRequirements?.trim() || details.reason?.trim() || ''
  const unique = new Set(
    raw
      .split(',')
      .map(token => token.trim())
      .filter(isEligibilityRequirement)
  )
  return [...unique]
}

function portraitConsentGuide(details: Record<string, string | undefined>): string {
  switch (details.portraitConsentStatus) {
    case 'NOT_FOUND':
      return '초상권 동의 이력이 없습니다. 초상권 동의서 서명을 요청해 주세요.'
    case 'WITHDRAWN':
      return '초상권 동의가 철회되었습니다. 재동의를 요청해 주세요.'
    case 'VOID':
      return '초상권 동의가 무효 처리되었습니다. 재동의를 요청해 주세요.'
    case 'EXPIRED':
      return '초상권 동의 유효기간이 만료되었습니다. 재동의를 요청해 주세요.'
    case 'POLICY_UPDATED': {
      const agreed = details.portraitConsentTermsVersion?.trim()
      const current = details.portraitConsentCurrentPolicyVersion?.trim()
      const versions = agreed && current ? ` (동의 버전 ${agreed}, 현행 버전 ${current})` : ''
      return `초상권 약관이 개정되었습니다${versions}. 새 약관으로 재동의를 요청해 주세요.`
    }
    case 'SIGNATURE_REQUIRED':
      return '초상권 동의 서명 문서가 없습니다. 서명 문서 제출을 요청해 주세요.'
    case 'PROGRAM_INELIGIBLE':
      return '프로그램 참여에 필요한 초상권 동의 항목에 동의하지 않았습니다. 참여 가능 항목 동의를 요청해 주세요.'
    default:
      return '유효한 초상권 동의가 없습니다. 회원의 초상권 동의 상태를 확인해 주세요.'
  }
}

function portraitConsentDates(details: Record<string, string | undefined>): string | null {
  const parts = [
    ['동의일', details.portraitConsentAgreedAt],
    ['만료일', details.portraitConsentExpiresAt],
    ['철회일', details.portraitConsentWithdrawnAt],
  ]
    .filter((entry): entry is [string, string] => Boolean(entry[1]?.trim()))
    .map(([label, value]) => `${label} ${formatDateDot(value)}`)
  return parts.length > 0 ? parts.join(', ') : null
}

function readConflictResponseData(error: unknown): unknown {
  if (!error || typeof error !== 'object' || !('response' in error)) return null
  return (error as { response?: { data?: unknown } }).response?.data ?? null
}

/**
 * 봉사자 승인에서 1365 ID만 없을 때의 안내.
 * 초상권 등 다른 자격 미충족이 함께 있으면 `null` — 기존 자격 안내를 쓴다.
 */
export function readVolunteer1365ApprovalBlockedAlert(
  error: unknown
): { title: string; content: string } | null {
  const data = readConflictResponseData(error)
  if (!data || extractApiErrorCode(data) !== APPLICATION_DECISION_CONFLICT) return null
  const requirements = parseMissingEligibilityRequirements(extractApiErrorDetails(data))
  if (
    !requirements.includes(EXTERNAL_1365_ID_REQUIRED) ||
    requirements.includes(PORTRAIT_RIGHTS_CONSENT_REQUIRED)
  ) {
    return null
  }
  return VOLUNTEER_1365_APPROVAL_BLOCKED_ALERT
}

/** 일괄 승인 `failures[]` — details 없이 code·message만 올 때 */
export function isVolunteer1365ApprovalBlockedFailure(
  failure: { code?: string | null; message?: string | null } | null | undefined
): boolean {
  if (failure?.code?.trim() !== APPLICATION_DECISION_CONFLICT) return false
  return /1365/.test(failure.message ?? '')
}

/**
 * 참여자격 409면 Alert 본문(줄바꿈 포함)을, 아니면 `null`을 반환한다.
 * `null`이면 호출부의 기존 오류 처리를 그대로 사용한다.
 */
export function formatApplicationEligibilityConflictMessage(error: unknown): string | null {
  if (!error || typeof error !== 'object' || !('response' in error)) return null
  const data = (error as { response?: { data?: unknown } }).response?.data
  if (extractApiErrorCode(data) !== APPLICATION_DECISION_CONFLICT) return null

  const details = extractApiErrorDetails(data)
  const requirements = parseMissingEligibilityRequirements(details)
  if (requirements.length === 0) return null

  const lines = ['참여 자격이 충족되지 않아 승인할 수 없습니다.', '']
  for (const requirement of requirements) {
    if (requirement === PORTRAIT_RIGHTS_CONSENT_REQUIRED) {
      lines.push(`· 초상권 동의: ${portraitConsentGuide(details)}`)
      const dates = portraitConsentDates(details)
      if (dates) lines.push(`  (${dates})`)
    } else {
      lines.push('· 1365 ID: 1365 ID가 등록되지 않았습니다. 1365 ID 등록을 요청해 주세요.')
    }
  }
  return lines.join('\n')
}
