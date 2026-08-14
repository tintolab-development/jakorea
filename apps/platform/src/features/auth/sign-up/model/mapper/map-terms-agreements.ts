import type {
  AgreementKey,
  AgreementState,
  GuardianAgreementKey,
  GuardianAgreementState,
} from '../sign-up.types'
import type {
  SignupTermsAgreementPayload,
  SignupTermsCatalogResponse,
  SignupTermsDocument,
  TermsAgreementRequest,
} from '../types/signup-api.types'

/** UI 약관 키 ↔ 백엔드 termsType 후보 */
const UI_KEY_TO_TERMS_TYPES: Record<AgreementKey | GuardianAgreementKey, string[]> = {
  service: ['SERVICE_TERMS'],
  privacy: ['PRIVACY_COLLECTION', 'CHILD_PRIVACY_COLLECTION'],
  marketing: ['MARKETING'],
  portrait: ['PORTRAIT', 'PORTRAIT_RIGHTS', 'IMAGE_RIGHTS', 'RIGHTS_OF_PUBLICITY'],
  guardianLegal: ['GUARDIAN_CONSENT'],
}

function normalizeTermsType(value: string) {
  return value.trim().toUpperCase()
}

function resolveUiKeyForTermsType(
  termsType: string,
  label?: string,
): AgreementKey | GuardianAgreementKey | null {
  const normalized = normalizeTermsType(termsType)

  for (const [uiKey, candidates] of Object.entries(UI_KEY_TO_TERMS_TYPES) as [
    AgreementKey | GuardianAgreementKey,
    string[],
  ][]) {
    if (candidates.some(candidate => normalized === candidate || normalized.includes(candidate))) {
      return uiKey
    }
  }

  const labelText = (label ?? '').trim()
  if (labelText.includes('초상권')) return 'portrait'
  if (labelText.includes('마케팅')) return 'marketing'
  if (labelText.includes('법정대리인') || labelText.includes('보호자')) return 'guardianLegal'
  if (labelText.includes('개인정보')) return 'privacy'
  if (labelText.includes('이용약관') || labelText.includes('서비스')) return 'service'

  return null
}

function isChoiceAgreed(value: unknown): boolean {
  return value === true
}

function isAgreedForUiKey(
  uiKey: AgreementKey | GuardianAgreementKey,
  agreements: AgreementState,
  guardianAgreements: GuardianAgreementState | null,
  isUnderAge: boolean,
): boolean {
  if (uiKey === 'guardianLegal') {
    return isChoiceAgreed(guardianAgreements?.guardianLegal)
  }

  if (isUnderAge && guardianAgreements && uiKey in guardianAgreements) {
    return isChoiceAgreed(guardianAgreements[uiKey as GuardianAgreementKey])
  }

  if (uiKey in agreements) {
    return isChoiceAgreed(agreements[uiKey as AgreementKey])
  }

  return false
}

function toTermsAgreementRequest(
  doc: SignupTermsDocument,
  agreed: boolean,
): TermsAgreementRequest | null {
  const payload: SignupTermsAgreementPayload | undefined = doc.agreementPayload
  const termsType = payload?.termsType ?? doc.termsType
  const version = payload?.version ?? doc.version

  if (!termsType || !version) {
    return null
  }

  return {
    termsType,
    version,
    required: payload?.required ?? doc.required,
    agreed,
    ...(payload?.termsSnapshotJson
      ? { termsSnapshotJson: payload.termsSnapshotJson }
      : {}),
  }
}

/**
 * 약관 카탈로그 + UI 체크 상태 → 가입 요청 `termsAgreements`.
 * version/termsType은 카탈로그에서만 가져온다 (하드코딩 금지).
 */
export function buildTermsAgreementsFromCatalog(input: {
  catalog: SignupTermsCatalogResponse | null | undefined
  agreements: AgreementState
  guardianAgreements?: GuardianAgreementState | null
  isUnderAge?: boolean
}): TermsAgreementRequest[] {
  const terms = input.catalog?.terms
  if (!terms?.length) return []

  const isUnderAge = Boolean(input.isUnderAge)
  const guardianAgreements = input.guardianAgreements ?? null
  const result: TermsAgreementRequest[] = []

  for (const doc of terms) {
    const termsType = doc.agreementPayload?.termsType ?? doc.termsType
    if (!termsType) continue

    const uiKey = resolveUiKeyForTermsType(termsType, doc.label ?? doc.title)
    const agreed = uiKey
      ? isAgreedForUiKey(uiKey, input.agreements, guardianAgreements, isUnderAge)
      : false

    const item = toTermsAgreementRequest(doc, agreed)
    if (item) result.push(item)
  }

  return result
}
