import type { ConsentFormData } from '@/types/consent'

export type TermsViewConsentKey = keyof ConsentFormData

export type TermsViewType = TermsViewConsentKey | 'mfaSetup'

export const TERMS_VIEW_TITLES: Record<TermsViewType, string> = {
  termsOfService: '서비스 이용약관 약관',
  privacyPolicy: '개인정보 수집·이용 동의 약관',
  mfaSetup: '2단계 인증(MFA) 설정 동의 약관',
  marketingConsent: '마케팅 정보 수신 동의 약관',
}

export type TermsConsentChoice = 'agree' | 'disagree'

export const TERMS_CONSENT_OPTIONS: Array<{ label: string; value: TermsConsentChoice }> = [
  { label: '동의', value: 'agree' },
  { label: '동의하지 않음', value: 'disagree' },
]
