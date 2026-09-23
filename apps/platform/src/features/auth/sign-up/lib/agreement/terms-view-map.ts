import type { TermsViewType } from '@/features/auth/model/terms-view.types'
import type { AgreementKey, GuardianAgreementKey } from '../../model/sign-up.types'

const AGREEMENT_KEY_TO_TERMS_VIEW: Record<AgreementKey | GuardianAgreementKey, TermsViewType> = {
  service: 'serviceTerms',
  privacy: 'privacyCollection',
  teacherInfo: 'teacherInfo',
  marketing: 'marketing',
  portrait: 'portrait',
  guardianLegal: 'guardianLegal',
}

const TERMS_VIEW_TO_AGREEMENT_KEY = Object.fromEntries(
  Object.entries(AGREEMENT_KEY_TO_TERMS_VIEW).map(([key, type]) => [type, key]),
) as Partial<Record<TermsViewType, AgreementKey | GuardianAgreementKey>>

const GUARDIAN_AGREEMENT_KEYS = new Set<GuardianAgreementKey>([
  'service',
  'privacy',
  'guardianLegal',
  'marketing',
  'portrait',
])

export function agreementKeyToTermsView(key: AgreementKey | GuardianAgreementKey): TermsViewType {
  return AGREEMENT_KEY_TO_TERMS_VIEW[key]
}

export function termsViewToAgreementKey(type: TermsViewType): AgreementKey | null {
  const key = TERMS_VIEW_TO_AGREEMENT_KEY[type]
  if (key == null || key === 'guardianLegal') return null
  return key
}

export function termsViewToGuardianAgreementKey(type: TermsViewType): GuardianAgreementKey | null {
  const key = TERMS_VIEW_TO_AGREEMENT_KEY[type]
  if (key == null || !GUARDIAN_AGREEMENT_KEYS.has(key as GuardianAgreementKey)) return null
  return key as GuardianAgreementKey
}
