import type { TermsViewType } from '@/features/auth'

export type SettingsConsentKind = 'terms' | 'toggle' | 'document'

export type SettingsConsentItemId =
  | 'serviceTerms'
  | 'privacyCollection'
  | 'marketing'
  | 'portrait'
  | 'paymentStatement'
  | 'educatorPledge'
  | 'administrativeJoint'
  | 'sexOffenseCheck'

export type SettingsConsentItem = {
  id: SettingsConsentItemId
  title: string
  required: boolean
  kind: SettingsConsentKind
  agreed: boolean
  agreedAt?: string
  validityLabel?: string
  hint?: string
  termsViewType?: TermsViewType
}

const MOCK_AGREED_AT = '2026.07.03 09:23'

export const BASIC_CONSENT_ITEMS: SettingsConsentItem[] = [
  {
    id: 'serviceTerms',
    title: '서비스 이용약관',
    required: true,
    kind: 'terms',
    agreed: true,
    agreedAt: MOCK_AGREED_AT,
    termsViewType: 'serviceTerms',
  },
  {
    id: 'privacyCollection',
    title: '개인정보 수집·이용 동의',
    required: true,
    kind: 'terms',
    agreed: true,
    agreedAt: MOCK_AGREED_AT,
    termsViewType: 'privacyCollection',
  },
  {
    id: 'marketing',
    title: '마케팅 정보 수신 동의',
    required: false,
    kind: 'toggle',
    agreed: true,
    agreedAt: MOCK_AGREED_AT,
    termsViewType: 'marketing',
  },
  {
    id: 'portrait',
    title: '초상권 수집·이용 동의',
    required: false,
    kind: 'document',
    agreed: true,
    agreedAt: MOCK_AGREED_AT,
    validityLabel: '1년',
  },
]

export const INSTRUCTOR_DOCUMENT_CONSENT_ITEMS: SettingsConsentItem[] = [
  {
    id: 'paymentStatement',
    title: '지급조서 사전 동의서',
    required: false,
    kind: 'document',
    agreed: false,
    validityLabel: '10년',
    hint: '정산 신청 시 최초 1회 작성. 유효기간 10년',
  },
  {
    id: 'educatorPledge',
    title: '교육진행자 서약서',
    required: false,
    kind: 'document',
    agreed: true,
    agreedAt: MOCK_AGREED_AT,
    validityLabel: '1년',
  },
  {
    id: 'administrativeJoint',
    title: '행정정보 공동이용 사전동의서',
    required: false,
    kind: 'document',
    agreed: true,
    agreedAt: MOCK_AGREED_AT,
    validityLabel: '1년',
  },
  {
    id: 'sexOffenseCheck',
    title: '성범죄 경력 조회 동의서',
    required: false,
    kind: 'document',
    agreed: true,
    agreedAt: MOCK_AGREED_AT,
    validityLabel: '1년',
  },
]
