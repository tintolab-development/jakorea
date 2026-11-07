import type { TermsViewType } from '@/features/auth'

export type SettingsConsentKind = 'terms' | 'toggle' | 'document'

export type SettingsConsentItemId =
  | 'serviceTerms'
  | 'privacyCollection'
  | 'teacherInfo'
  | 'guardianLegal'
  | 'childPrivacy'
  | 'marketing'
  | 'portrait'
  | 'paymentStatement'
  | 'receiptPreConsent'
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
  /** 전자서명 동의서 ID — 철회·확인 API 대상. 레거시 동의는 null */
  documentId?: number | null
  /** 서버 `withdrawable` — 철회 버튼 노출 조건 */
  withdrawable?: boolean
  /** 서버 `status` — WITHDRAWN이면 철회 버튼 비활성 */
  status?: string
  /** 서버 `consentStatus` — `PARTIAL`이면 부분동의 */
  consentStatus?: string
  /** 서버 `signed` — 동의서 게이트는 agreed && signed */
  signed?: boolean
  /** 서버 listed. boolean만 유지. null은 true로 올리지 않는다. */
  listed?: boolean
}

export type BasicConsentAudience = {
  isTeacher: boolean
  isMinor: boolean
}

const MOCK_AGREED_AT = '2026.07.03 09:23'

const SERVICE_TERMS_ITEM: SettingsConsentItem = {
  id: 'serviceTerms',
  title: '서비스 이용약관',
  required: true,
  kind: 'terms',
  agreed: true,
  agreedAt: MOCK_AGREED_AT,
  termsViewType: 'serviceTerms',
}

const PRIVACY_COLLECTION_ITEM: SettingsConsentItem = {
  id: 'privacyCollection',
  title: '개인정보 수집·이용 동의',
  required: true,
  kind: 'terms',
  agreed: true,
  agreedAt: MOCK_AGREED_AT,
  termsViewType: 'privacyCollection',
}

const TEACHER_INFO_ITEM: SettingsConsentItem = {
  id: 'teacherInfo',
  title: '교사 회원 가입 및 학교/기관 정보 수집·이용 동의',
  required: true,
  kind: 'terms',
  agreed: true,
  agreedAt: MOCK_AGREED_AT,
  termsViewType: 'teacherInfo',
}

const GUARDIAN_LEGAL_ITEM: SettingsConsentItem = {
  id: 'guardianLegal',
  title: '만 14세 미만 아동 회원가입 및 개인정보 수집·이용에 대한 법정대리인 동의',
  required: true,
  kind: 'terms',
  agreed: true,
  agreedAt: MOCK_AGREED_AT,
  termsViewType: 'guardianLegal',
}

const CHILD_PRIVACY_ITEM: SettingsConsentItem = {
  id: 'childPrivacy',
  title: '만 14세 미만 아동 개인정보 수집·이용 동의',
  required: false,
  kind: 'terms',
  agreed: true,
  agreedAt: MOCK_AGREED_AT,
  termsViewType: 'privacyCollection',
  withdrawable: true,
}

const MARKETING_ITEM: SettingsConsentItem = {
  id: 'marketing',
  title: '마케팅 정보 수신 동의',
  required: false,
  kind: 'toggle',
  agreed: true,
  agreedAt: MOCK_AGREED_AT,
  termsViewType: 'marketing',
}

const PORTRAIT_ITEM: SettingsConsentItem = {
  id: 'portrait',
  title: '초상권 수집·이용 동의',
  required: false,
  kind: 'document',
  agreed: true,
  agreedAt: MOCK_AGREED_AT,
  validityLabel: '1년',
  withdrawable: true,
}

/** 성인 일반회원 기본 4항목 — mock 기본값 */
export const BASIC_CONSENT_ITEMS: SettingsConsentItem[] = [
  SERVICE_TERMS_ITEM,
  PRIVACY_COLLECTION_ITEM,
  MARKETING_ITEM,
  PORTRAIT_ITEM,
]

export function getBasicConsentItems(audience: BasicConsentAudience): SettingsConsentItem[] {
  const items: SettingsConsentItem[] = [SERVICE_TERMS_ITEM]

  /** 미성년은 법정대리인·아동 개인정보 동의로 대체 — 성인용 개인정보 수집·이용 항목 미노출 */
  if (!audience.isMinor) {
    items.push(PRIVACY_COLLECTION_ITEM)
  }

  if (audience.isTeacher) {
    items.push(TEACHER_INFO_ITEM)
  }
  if (audience.isMinor) {
    items.push(GUARDIAN_LEGAL_ITEM, CHILD_PRIVACY_ITEM)
  }

  items.push(MARKETING_ITEM, PORTRAIT_ITEM)
  return items
}

/** 유형 무관 — 마이페이지 동의서·서약서 */
export const DOCUMENT_CONSENT_ITEMS: SettingsConsentItem[] = [
  {
    id: 'paymentStatement',
    title: '지급조서 사전 동의서',
    required: false,
    kind: 'document',
    agreed: false,
    validityLabel: '10년',
    hint: '영수증 제출 시 최초 1회 작성 · 유효기간 10년',
  },
  {
    id: 'receiptPreConsent',
    title: '영수증 발급 사전 동의서',
    required: false,
    kind: 'document',
    agreed: false,
    hint: '정산·영수증 신규 제출 시 작성. 본문은 법무 확정 전 초안이며, 유효기간은 서버 정책을 따릅니다.',
  },
  {
    id: 'educatorPledge',
    title: '교육진행자 서약서',
    required: false,
    kind: 'document',
    agreed: true,
    agreedAt: MOCK_AGREED_AT,
    validityLabel: '1년',
    withdrawable: true,
  },
  {
    id: 'administrativeJoint',
    title: '행정정보 공동이용 사전동의서',
    required: false,
    kind: 'document',
    agreed: true,
    agreedAt: MOCK_AGREED_AT,
    validityLabel: '1년',
    withdrawable: true,
  },
  {
    id: 'sexOffenseCheck',
    title: '성범죄 경력 조회 동의서',
    required: false,
    kind: 'document',
    agreed: true,
    agreedAt: MOCK_AGREED_AT,
    validityLabel: '1년',
    withdrawable: true,
  },
]

/** 서버 행 → 화면 메타(제목·종류·약관 보기·유효기간) 조회용. 노출 여부는 audience 필터 */
export const SETTINGS_CONSENT_CATALOG: SettingsConsentItem[] = [
  SERVICE_TERMS_ITEM,
  PRIVACY_COLLECTION_ITEM,
  TEACHER_INFO_ITEM,
  GUARDIAN_LEGAL_ITEM,
  CHILD_PRIVACY_ITEM,
  MARKETING_ITEM,
  PORTRAIT_ITEM,
  ...DOCUMENT_CONSENT_ITEMS,
]
