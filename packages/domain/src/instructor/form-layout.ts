/**
 * 강사 프로필 양식 — surface별 섹션 순서·노출·동의 항목
 *
 * - 필드 모델/옵션/검증/카피: 기존 instructor/* SSOT
 * - 이 모듈: CMS 등록 / CMS 상세수정 / Platform 신청 간 **노출·순서**만 분기
 * - UI 위젯(Ant Design vs PF)은 앱이 담당
 */

import {
  INSTRUCTOR_CONSENT_DOCUMENT_ITEMS,
  INSTRUCTOR_CONSENT_RADIO_ITEMS,
  TERMS_CONSENT_DESCRIPTION,
  type InstructorConsentDocumentKey,
} from './consent.js'

export const INSTRUCTOR_FORM_SECTION_IDS = [
  'consent',
  'basic',
  'grades',
  'education',
  'career',
  'ja',
  'license',
  'award',
  'freeWrite',
] as const

export type InstructorFormSectionId = (typeof INSTRUCTOR_FORM_SECTION_IDS)[number]

export type InstructorFormSurface = 'cmsRegister' | 'cmsDetailEdit' | 'platformApply'

export type InstructorConsentLayoutMode = 'stacked' | 'cmsGrid'

export type InstructorConsentRadioKey = (typeof INSTRUCTOR_CONSENT_RADIO_ITEMS)[number]['key']

/** 섹션 기본 제목 (동의 단락은 layout.consent.title 우선) */
export const INSTRUCTOR_FORM_SECTION_BASE_TITLES: Record<InstructorFormSectionId, string> = {
  consent: '약관 및 동의',
  basic: '기본 정보',
  grades: '강사 등급',
  education: '학력사항',
  career: '경력사항',
  ja: 'JA Korea 활동 경험',
  license: '자격 및 면허',
  award: '수상 및 수료',
  freeWrite: '자유 작성 항목',
}

export type InstructorFormConsentLayout = {
  title: string
  description: string
  /** 동의 항목 하단 안내 (Platform 등). 없으면 미노출 */
  footerText?: string
  /** stacked: Platform 세로 목록 / cmsGrid: CMS 2열(초상권을 마케팅 옆) */
  layout: InstructorConsentLayoutMode
  radioKeys: readonly InstructorConsentRadioKey[]
  documentKeys: readonly InstructorConsentDocumentKey[]
  /** true면 해당 surface 동의 단락의 모든 항목을 필수(*)·제출 검증 */
  allItemsRequired: boolean
  /** true면 동의서 작성 전 기본정보 완성 게이트 생략 (CMS — 기본정보·동의서 미연동) */
  skipBasicInfoGate: boolean
}

export type InstructorFormLayout = {
  surface: InstructorFormSurface
  /** 화면에 그릴 섹션 순서 (미포함 = 비노출) */
  sections: readonly InstructorFormSectionId[]
  /** true면 섹션 제목 앞에 `N. ` 번호 (Platform) */
  numberSections: boolean
  /** CMS 등록 전용 강사비·JA 등급 섹션 */
  showInstructorGradeSection: boolean
  consent: InstructorFormConsentLayout
}

const ALL_CONSENT_RADIO_KEYS = INSTRUCTOR_CONSENT_RADIO_ITEMS.map(item => item.key)

const ALL_CONSENT_DOCUMENT_KEYS = INSTRUCTOR_CONSENT_DOCUMENT_ITEMS.map(item => item.key)

/** CMS 등록·상세 — 약관 8건 전체, 기본정보 뒤 */
const CMS_CONSENT_LAYOUT: InstructorFormConsentLayout = {
  title: '약관 및 동의',
  description: TERMS_CONSENT_DESCRIPTION,
  layout: 'cmsGrid',
  radioKeys: ALL_CONSENT_RADIO_KEYS,
  documentKeys: ALL_CONSENT_DOCUMENT_KEYS,
  allItemsRequired: false,
  skipBasicInfoGate: true,
}

/**
 * Platform 강사 신청 — 동의 상단·제목 별도.
 * 동의서 4건만 2열 노출 (지급조서|교육진행자 / 행정정보|성범죄). CMS 8건과 별개.
 */
const PLATFORM_APPLY_CONSENT_LAYOUT: InstructorFormConsentLayout = {
  title: '필수 작성 동의서',
  description: '',
  footerText:
    '위의 정보 수집•이용에 대한 동의를 거부할 권리가 있습니다. 그러나 동의하지 않을 시 JA Korea 강사 신청 및 활동이 불가합니다.',
  layout: 'cmsGrid',
  radioKeys: [],
  documentKeys: [
    'consentPaymentStatement',
    'consentEducatorPledge',
    'consentAdministrativeJoint',
    'consentSexOffenseCheck',
  ],
  allItemsRequired: true,
  /** Platform: 동의서↔기본정보 연동·작성 전 기본정보 게이트 없음 */
  skipBasicInfoGate: true,
}

export const INSTRUCTOR_FORM_LAYOUT: Record<InstructorFormSurface, InstructorFormLayout> = {
  cmsRegister: {
    surface: 'cmsRegister',
    sections: [
      'basic',
      'grades',
      'consent',
      'education',
      'career',
      'ja',
      'license',
      'award',
      'freeWrite',
    ],
    numberSections: false,
    showInstructorGradeSection: true,
    consent: CMS_CONSENT_LAYOUT,
  },
  cmsDetailEdit: {
    surface: 'cmsDetailEdit',
    sections: [
      'basic',
      'consent',
      'education',
      'career',
      'ja',
      'license',
      'award',
      'freeWrite',
    ],
    numberSections: false,
    showInstructorGradeSection: false,
    consent: {
      ...CMS_CONSENT_LAYOUT,
      skipBasicInfoGate: true,
    },
  },
  platformApply: {
    surface: 'platformApply',
    sections: [
      'consent',
      'basic',
      'education',
      'career',
      'ja',
      'license',
      'award',
      'freeWrite',
    ],
    numberSections: true,
    showInstructorGradeSection: false,
    consent: PLATFORM_APPLY_CONSENT_LAYOUT,
  },
}

export function getInstructorFormLayout(surface: InstructorFormSurface): InstructorFormLayout {
  return INSTRUCTOR_FORM_LAYOUT[surface]
}

/** surface 섹션 표시 제목 (`1. 필수 작성 동의서` 등) */
export function getInstructorFormSectionDisplayTitle(
  surface: InstructorFormSurface,
  sectionId: InstructorFormSectionId,
): string {
  const layout = INSTRUCTOR_FORM_LAYOUT[surface]
  const base =
    sectionId === 'consent'
      ? layout.consent.title
      : INSTRUCTOR_FORM_SECTION_BASE_TITLES[sectionId]
  if (!layout.numberSections) return base
  const index = layout.sections.indexOf(sectionId)
  if (index < 0) return base
  return `${index + 1}. ${base}`
}

export function getInstructorConsentRadioItems(surface: InstructorFormSurface) {
  const layout = INSTRUCTOR_FORM_LAYOUT[surface]
  const allowed = new Set(layout.consent.radioKeys)
  return INSTRUCTOR_CONSENT_RADIO_ITEMS.filter(item => allowed.has(item.key)).map(item => ({
    ...item,
    required: layout.consent.allItemsRequired ? true : item.required,
  }))
}

export function getInstructorConsentDocumentItems(surface: InstructorFormSurface) {
  const layout = INSTRUCTOR_FORM_LAYOUT[surface]
  const allowed = new Set(layout.consent.documentKeys)
  return INSTRUCTOR_CONSENT_DOCUMENT_ITEMS.filter(item => allowed.has(item.key)).map(item => ({
    ...item,
    required: layout.consent.allItemsRequired,
  }))
}

/** 제출 시 동의(agree)가 필요한 키 — surface 동의 단락 기준 */
export function getInstructorRequiredConsentAgreeKeys(surface: InstructorFormSurface) {
  const layout = INSTRUCTOR_FORM_LAYOUT[surface]
  if (layout.consent.allItemsRequired) {
    return [...layout.consent.radioKeys, ...layout.consent.documentKeys] as const
  }
  return ['consentTermsOfService', 'consentPersonal'] as const
}
