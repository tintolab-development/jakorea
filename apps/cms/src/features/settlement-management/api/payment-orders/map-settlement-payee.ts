/**
 * SettlementFrontendResponse.payee (MASKED) → 산출 내역서·지급조서 발급 기본정보
 * 목록/다른 API로 PII 보완 금지 — payee만 SSOT.
 * BE가 마스킹한 문자열을 그대로 표시한다. FE 마스킹·블러·날짜 재포맷을 덧씌우지 않는다.
 */

import type { SettlementFrontendPayeeResponse } from '@/shared/api/generated/settlement/schemas'

function presentOrEmpty(value: string | null | undefined): string {
  return value?.trim() ?? ''
}

function displayOrDash(value: string | null | undefined): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '-'
}

export function formatPayeeHomeAddressDisplay(
  payee: NonNullable<SettlementFrontendPayeeResponse> | null | undefined
): string {
  if (!payee) return '-'
  const parts = [presentOrEmpty(payee.addressRoad), presentOrEmpty(payee.addressDetail)].filter(
    Boolean
  )
  return parts.length > 0 ? parts.join(' ') : '-'
}

export function formatPayeeGenderBirthDisplay(
  payee: NonNullable<SettlementFrontendPayeeResponse> | null | undefined
): string {
  if (!payee) return '-'
  const genderPart = displayOrDash(payee.gender)
  const birthPart = displayOrDash(payee.birthDate)
  if (genderPart === '-' && birthPart === '-') return '-'
  return `${genderPart} | ${birthPart}`
}

/** `900101-*******` / `900101*******` → front/back (이미 MASKED 원문 유지) */
export function splitMaskedResidentRegistrationNumber(
  raw: string | null | undefined
): { residentFront: string; residentBack: string } {
  const trimmed = raw?.trim() ?? ''
  if (!trimmed) return { residentFront: '', residentBack: '' }
  if (trimmed.includes('-')) {
    const [front, ...rest] = trimmed.split('-')
    return { residentFront: front ?? '', residentBack: rest.join('-') }
  }
  if (trimmed.length > 6) {
    return { residentFront: trimmed.slice(0, 6), residentBack: trimmed.slice(6) }
  }
  return { residentFront: trimmed, residentBack: '' }
}

export type SettlementPayeeInstructorBasicFields = {
  nameEn: string
  phoneDisplay: string
  emailDisplay: string
  addressDisplay: string
  addressRoad: string
  addressDetail: string
  settlementAccountBankNumberPart: string
  settlementAccountHolderPart: string
  genderBirthDisplay: string
  affiliation: string
  residentRegistrationNumber: string
}

/**
 * payee가 있으면 MASKED 값을 그대로 표시용으로 매핑.
 * payee null/빈 객체면 null (호출부가 stub/`-` 유지).
 */
export function mapSettlementPayeeToInstructorBasicFields(
  payee: SettlementFrontendPayeeResponse | null | undefined
): SettlementPayeeInstructorBasicFields | null {
  if (payee == null) return null

  const hasAny =
    presentOrEmpty(payee.nameEn) ||
    presentOrEmpty(payee.phone) ||
    presentOrEmpty(payee.email) ||
    presentOrEmpty(payee.addressRoad) ||
    presentOrEmpty(payee.addressDetail) ||
    presentOrEmpty(payee.bankName) ||
    presentOrEmpty(payee.accountNumber) ||
    presentOrEmpty(payee.accountHolder) ||
    presentOrEmpty(payee.affiliation) ||
    presentOrEmpty(payee.residentRegistrationNumber) ||
    presentOrEmpty(payee.gender) ||
    presentOrEmpty(payee.birthDate)

  if (!hasAny) return null

  const bankAndNumber = [presentOrEmpty(payee.bankName), presentOrEmpty(payee.accountNumber)]
    .filter(Boolean)
    .join(' ')

  return {
    nameEn: displayOrDash(payee.nameEn),
    phoneDisplay: displayOrDash(payee.phone),
    emailDisplay: displayOrDash(payee.email),
    addressDisplay: formatPayeeHomeAddressDisplay(payee),
    addressRoad: presentOrEmpty(payee.addressRoad),
    addressDetail: presentOrEmpty(payee.addressDetail),
    settlementAccountBankNumberPart: bankAndNumber || '—',
    settlementAccountHolderPart: displayOrDash(payee.accountHolder),
    genderBirthDisplay: formatPayeeGenderBirthDisplay(payee),
    affiliation: presentOrEmpty(payee.affiliation),
    residentRegistrationNumber: presentOrEmpty(payee.residentRegistrationNumber),
  }
}
