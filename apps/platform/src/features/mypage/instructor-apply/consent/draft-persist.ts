import type { ConsentValue } from '@jakorea/domain/instructor/consent'
import type { InstructorApplyConsentKey } from './catalog'

const DRAFT_STORAGE_PREFIX = 'platform.instructor-apply.consent-draft.'

export type ConsentChoice = ConsentValue | ''

export type PaymentConsentDraft = {
  tableConsents: [ConsentChoice, ConsentChoice, ConsentChoice, ConsentChoice]
  nameKo: string
  residentFront: string
  residentBack: string
  affiliation: string
  noAffiliation: boolean
  addressRoad: string
  addressDetail: string
  bankName: string
  accountNumber: string
  accountHolder: string
}

export type EducatorConsentDraft = {
  clauses: [ConsentChoice, ConsentChoice, ConsentChoice, ConsentChoice]
}

export type NoticeConsentDraft = {
  institution: string
  purpose: string
  idType: string
  idNumber: string
  name: string
  birthDate: string
  phone: string
  confirm: ConsentChoice
}

export type CrimeConsentDraft = {
  consent: ConsentChoice
}

export type ConsentWriteDraftMap = {
  consentPaymentStatement: PaymentConsentDraft
  consentEducatorPledge: EducatorConsentDraft
  consentAdministrativeJoint: NoticeConsentDraft
  consentSexOffenseCheck: CrimeConsentDraft
}

export const EMPTY_PAYMENT_CONSENT_DRAFT: PaymentConsentDraft = {
  tableConsents: ['', '', '', ''],
  nameKo: '',
  residentFront: '',
  residentBack: '',
  affiliation: '',
  noAffiliation: false,
  addressRoad: '',
  addressDetail: '',
  bankName: '',
  accountNumber: '',
  accountHolder: '',
}

export const EMPTY_EDUCATOR_CONSENT_DRAFT: EducatorConsentDraft = {
  clauses: ['', '', '', ''],
}

export const EMPTY_NOTICE_CONSENT_DRAFT: NoticeConsentDraft = {
  institution: '',
  purpose: '범죄경력 유무 조회',
  idType: 'resident',
  idNumber: '',
  name: '',
  birthDate: '',
  phone: '',
  confirm: '',
}

export const EMPTY_CRIME_CONSENT_DRAFT: CrimeConsentDraft = {
  consent: '',
}

const EMPTY_DRAFTS: ConsentWriteDraftMap = {
  consentPaymentStatement: EMPTY_PAYMENT_CONSENT_DRAFT,
  consentEducatorPledge: EMPTY_EDUCATOR_CONSENT_DRAFT,
  consentAdministrativeJoint: EMPTY_NOTICE_CONSENT_DRAFT,
  consentSexOffenseCheck: EMPTY_CRIME_CONSENT_DRAFT,
}

function canUseSessionStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

export function loadConsentWriteDraft<K extends InstructorApplyConsentKey>(
  key: K
): ConsentWriteDraftMap[K] {
  const fallback = EMPTY_DRAFTS[key]
  if (!canUseSessionStorage()) return fallback
  try {
    const raw = window.sessionStorage.getItem(`${DRAFT_STORAGE_PREFIX}${key}`)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as ConsentWriteDraftMap[K]
    if (parsed == null || typeof parsed !== 'object') return fallback
    return { ...fallback, ...parsed }
  } catch {
    return fallback
  }
}

export function saveConsentWriteDraft<K extends InstructorApplyConsentKey>(
  key: K,
  draft: ConsentWriteDraftMap[K]
): void {
  if (!canUseSessionStorage()) return
  try {
    window.sessionStorage.setItem(`${DRAFT_STORAGE_PREFIX}${key}`, JSON.stringify(draft))
  } catch {
    /* quota / private mode */
  }
}
