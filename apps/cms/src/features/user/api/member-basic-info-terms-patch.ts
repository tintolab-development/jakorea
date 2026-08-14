import type { TermsAgreementRequest } from '@/shared/api/generated/members/schemas/termsAgreementRequest'
import type { TermsAgreementRequestTermsType } from '@/shared/api/generated/members/schemas/termsAgreementRequestTermsType'
import type { TermsAgreementRow } from '@/shared/api/generated/members/schemas/termsAgreementRow'
import { ADMIN_PRE_REGISTER_TERMS_VERSION } from '@/features/user/api/build-pre-register-terms-agreements'

/**
 * 회원 기본정보 PATCH로 **수정 불가**인 필수 약관.
 * FE·BE 공통 — 상세 수정 모드에서 라디오 disabled 노출, PATCH body에서 제외, 서버도 거부.
 */
export const MEMBER_BASIC_INFO_IMMUTABLE_TERMS_TYPES = [
  'SERVICE_TERMS',
  'PRIVACY_COLLECTION',
  'MFA_SETUP_CONSENT',
] as const

export type MemberBasicInfoImmutableTermsType =
  (typeof MEMBER_BASIC_INFO_IMMUTABLE_TERMS_TYPES)[number]

const IMMUTABLE_SET = new Set<string>(MEMBER_BASIC_INFO_IMMUTABLE_TERMS_TYPES)

/** UI 라벨 → PATCH canonical termsType (선택 동의만) */
export const CONSENT_LABEL_TO_EDITABLE_TERMS_TYPE: Record<string, TermsAgreementRequestTermsType> = {
  '마케팅 제공 동의': 'MARKETING',
  '초상권 수집·이용 동의': 'PORTRAIT_RIGHTS',
  '지급조서 사전 동의서': 'PAYMENT_STATEMENT_PRE_CONSENT',
  '교육진행자 서약서': 'FACILITATOR_PLEDGE',
  '행정정보 공동이용 사전동의서': 'ADMINISTRATIVE_INFO_CONSENT',
  '성범죄 경력 조회 동의서': 'CRIMINAL_HISTORY_CHECK_CONSENT',
}

const IMMUTABLE_LABELS = new Set([
  '서비스 이용약관',
  '개인정보 수집·이용 동의',
  '2단계 인증(MFA) 설정 동의',
])

export function isMemberBasicInfoImmutableTermsType(termsType: string | undefined): boolean {
  if (!termsType?.trim()) return false
  return IMMUTABLE_SET.has(termsType.trim().toUpperCase())
}

export function isMemberBasicInfoImmutableConsentLabel(label: string): boolean {
  return IMMUTABLE_LABELS.has(label.trim())
}

/** PATCH body용 — 필수 약관 제거 */
export function filterEditableTermsAgreementsForBasicInfoPatch(
  rows: TermsAgreementRequest[] | undefined
): TermsAgreementRequest[] | undefined {
  if (!rows?.length) return undefined
  const filtered = rows.filter(row => !isMemberBasicInfoImmutableTermsType(row.termsType))
  return filtered.length > 0 ? filtered : undefined
}

export function termsAgreementRowsToRequests(
  rows: TermsAgreementRow[] | undefined
): TermsAgreementRequest[] {
  if (!rows?.length) return []
  return rows
    .filter(row => row.termsType?.trim())
    .map(row => ({
      termsType: row.termsType!.trim() as TermsAgreementRequestTermsType,
      version: row.termsVersion?.trim() || ADMIN_PRE_REGISTER_TERMS_VERSION,
      required: Boolean(row.required),
      agreed: Boolean(row.agreed),
    }))
}

/** draft에 선택 동의만 upsert — 기존 version 유지 */
export function upsertEditableTermsAgreementInDraft(
  existing: TermsAgreementRequest[] | undefined,
  label: string,
  agreed: boolean
): TermsAgreementRequest[] {
  const termsType = CONSENT_LABEL_TO_EDITABLE_TERMS_TYPE[label.trim()]
  if (!termsType) return existing ?? []

  const base = (existing ?? []).filter(
    row => !isMemberBasicInfoImmutableTermsType(row.termsType)
  )
  const prev = base.find(row => row.termsType === termsType)
  const without = base.filter(row => row.termsType !== termsType)
  return [
    ...without,
    {
      termsType,
      version: prev?.version?.trim() || ADMIN_PRE_REGISTER_TERMS_VERSION,
      required: false,
      agreed,
    },
  ]
}

/** PATCH 선택 약관을 상세 termsAgreements에 항목별로 병합 (필수 약관 유지) */
export function mergeTermsAgreementRowsFromPatch(
  existing: TermsAgreementRow[] | undefined,
  patchRows: TermsAgreementRequest[],
  agreedAtIso = new Date().toISOString()
): TermsAgreementRow[] {
  const existingByType = new Map(
    (existing ?? [])
      .filter(row => row.termsType?.trim())
      .map(row => [row.termsType!.trim(), row])
  )
  const overlay = new Map<string, TermsAgreementRow>()
  for (const row of patchRows) {
    const termsType = row.termsType?.trim()
    if (!termsType) continue
    const prev = existingByType.get(termsType)
    const agreedChanged = prev == null || Boolean(prev.agreed) !== Boolean(row.agreed)
    overlay.set(termsType, {
      termsType,
      termsVersion: row.version,
      required: row.required,
      agreed: row.agreed,
      ...(agreedChanged ? { agreedAt: agreedAtIso } : {}),
    })
  }

  const seen = new Set<string>()
  const merged: TermsAgreementRow[] = []
  for (const row of existing ?? []) {
    const key = row.termsType?.trim()
    if (!key) {
      merged.push(row)
      continue
    }
    seen.add(key)
    const next = overlay.get(key)
    merged.push(next ? { ...row, ...next } : row)
  }
  for (const [key, row] of overlay) {
    if (!seen.has(key)) merged.push(row)
  }
  return merged
}

export function resolveEditableConsentAgreedFromDraft(
  draft: TermsAgreementRequest[] | undefined,
  label: string,
  fallbackAgreed: boolean
): boolean {
  const termsType = CONSENT_LABEL_TO_EDITABLE_TERMS_TYPE[label.trim()]
  if (!termsType || !draft?.length) return fallbackAgreed
  const hit = draft.find(row => row.termsType === termsType)
  return hit != null ? Boolean(hit.agreed) : fallbackAgreed
}
