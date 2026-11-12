import type { ProgramParticipantApplicationEditorVariant } from './editor-variant.js'

export type TemplateRegistryCategory =
  | 'survey'
  | 'agreement'
  | 'application'
  | 'registration'
  | 'generic'

export type TemplateRegistryPreviewStrategy = 'standard' | 'a4-content-only'

/** 작성 양식 탭 전용 메타데이터 (`template.schema`의 목록용 `TemplateDefinition`과 별개) */
export type TemplateRegistryDefinition = {
  id: string
  category: TemplateRegistryCategory
  rendererKey: string
  editorVariant?: ProgramParticipantApplicationEditorVariant
  registrationFormVariant?: 'general' | 'economy' | 'trainedTeachers'
  registrationEditor?: 'general' | 'ujat'
  previewStrategy?: TemplateRegistryPreviewStrategy
  agreementConfigKey?: string
  /** `AgreementWritingFormShell` 등 별도 풀페이지 — `TemplateFullpageModal` 미사용 */
  usesAgreementShell?: boolean
  /** 성범죄 동의서 전용 모달 */
  usesCrimeConsentModal?: boolean
  /** URL `userPreview` 스트립 억제(설문·동의 셸) */
  suppressUserPreviewStrip?: boolean
  /** 셸/에디터가 미리보기 URL을 직접 제어 */
  selfManagedPreview?: boolean
  previewHeaderTitleFallback?: string
  /** 템플릿 편집 모달 헤더 안내. 미지정 시 `TEMPLATE_FORM_MODAL_DESCRIPTION` */
  modalDescription?: string
}

/** 등록 폼 편집기 상단 안내 (QA 261113 #40) */
export const REGISTRATION_MODAL_DESCRIPTION =
  '※ 해당 폼의 단락과 항목은 추가·삭제할 수 없습니다. 단, 일부 문구·항목값 수정과 항목별 초기값 설정은 가능합니다.'

/** 모집 폼 편집기 상단 안내 (QA 261113 #41) */
export const RECRUITMENT_MODAL_DESCRIPTION =
  '※ 해당 폼의 단락과 항목은 추가·삭제할 수 없고 문구·항목값도 수정할 수 없습니다. 단, 항목별 초기값은 설정이 가능합니다.'

/** 신청 폼 편집기 상단 안내 (QA 261113 #42) */
export const APPLICATION_MODAL_DESCRIPTION =
  '※ 해당 폼의 기존 항목은 삭제가 불가하며, 일부 텍스트만 수정이 가능합니다. 필요한 항목은 직접 추가가 가능합니다.'

/** 설문 폼 편집기 상단 안내 (QA 261113 #12) */
export const SURVEY_MODAL_DESCRIPTION =
  '※ 해당 폼은 단락과 항목의 추가·삭제와 문구·항목값 수정, 항목별 초기값 설정이 모두 가능합니다.'

/** 시스템 동의 양식 편집기 상단 안내 (QA 261113 #14) */
export const AGREEMENT_MODAL_DESCRIPTION =
  '※ 해당 폼의 단락과 항목은 추가·삭제할 수 없습니다. 단, 일부 문구·항목값 수정과 항목별 초기값 설정은 가능합니다.'

/** 성범죄경력 조회 동의서 편집기 상단 안내 (QA 261113 #21) */
export const CRIME_CONSENT_MODAL_DESCRIPTION =
  '※ 해당 폼은 모든 항목의 추가 및 삭제가 불가한 양식입니다. 내용을 변경하려면 [문서 변경]을 눌러 파일을 교체해 주세요.'

/** 사용자 생성(직접 등록) 동의 양식 편집기 상단 안내 (QA 261113 #70) */
export const DIRECT_AGREEMENT_MODAL_DESCRIPTION =
  '※ 최소 1개 이상의 단락이 존재해야 등록이 가능합니다. (제목글, 마무리글, 년도, 서명란 제외)'

/** 발급(보고·서류) 양식 편집기 상단 안내 — 기호만 「※」 (QA 261113 #43) */
export const ISSUANCE_MODAL_DESCRIPTION =
  '※ 해당 폼은 기존 항목의 삭제가 불가하며, 수정에 제한이 있습니다.'

export const TEMPLATE_REGISTRY: Record<string, TemplateRegistryDefinition> = {
  'registration-general': {
    id: 'registration-general',
    category: 'registration',
    rendererKey: 'registration-general',
    registrationEditor: 'general',
    registrationFormVariant: 'general',
    previewHeaderTitleFallback: '일반 프로그램 등록 폼',
  },
  'registration-economy': {
    id: 'registration-economy',
    category: 'registration',
    rendererKey: 'registration-economy',
    registrationEditor: 'general',
    registrationFormVariant: 'economy',
    previewHeaderTitleFallback: '1사1교 프로그램 등록 폼',
  },
  'registration-ujat': {
    id: 'registration-ujat',
    category: 'registration',
    rendererKey: 'registration-ujat',
    registrationEditor: 'ujat',
    previewHeaderTitleFallback: 'UJAT 프로그램 등록 폼',
  },
  'registration-trained-teachers': {
    id: 'registration-trained-teachers',
    category: 'registration',
    rendererKey: 'registration-trained-teachers',
    registrationEditor: 'general',
    registrationFormVariant: 'trainedTeachers',
    previewHeaderTitleFallback: '교육 받은 교사 프로그램 등록 폼',
  },
  'recruitment-participant-school': {
    id: 'recruitment-participant-school',
    category: 'application',
    rendererKey: 'participant-application',
    editorVariant: 'applicant-recruit-institution',
    previewHeaderTitleFallback: '일반_참여 기관 모집 폼',
    modalDescription: RECRUITMENT_MODAL_DESCRIPTION,
  },
  'recruitment-economy': {
    id: 'recruitment-economy',
    category: 'application',
    rendererKey: 'participant-application',
    editorVariant: 'economy-recruit-institution',
    previewHeaderTitleFallback: '1사1교_참여 기관 모집 폼',
    modalDescription: RECRUITMENT_MODAL_DESCRIPTION,
  },
  'recruitment-participant-individual': {
    id: 'recruitment-participant-individual',
    category: 'application',
    rendererKey: 'participant-application',
    editorVariant: 'applicant-recruit-individual',
    previewHeaderTitleFallback: '일반_참여자 모집 폼',
    modalDescription: RECRUITMENT_MODAL_DESCRIPTION,
  },
  'recruitment-instructor': {
    id: 'recruitment-instructor',
    category: 'application',
    rendererKey: 'participant-application',
    editorVariant: 'recruit-instructor',
    previewHeaderTitleFallback: '공통_강사 모집 폼',
    modalDescription: RECRUITMENT_MODAL_DESCRIPTION,
  },
  'recruitment-volunteer': {
    id: 'recruitment-volunteer',
    category: 'application',
    rendererKey: 'participant-application',
    editorVariant: 'recruit-volunteer',
    previewHeaderTitleFallback: '공통_봉사자 모집 폼',
    modalDescription: RECRUITMENT_MODAL_DESCRIPTION,
  },
  'recruitment-ujat-school': {
    id: 'recruitment-ujat-school',
    category: 'application',
    rendererKey: 'participant-application',
    editorVariant: 'ujat-recruit-institution',
    previewHeaderTitleFallback: 'UJAT_참여 기관 모집 폼',
    modalDescription: RECRUITMENT_MODAL_DESCRIPTION,
  },
  'recruitment-ujat-volunteer': {
    id: 'recruitment-ujat-volunteer',
    category: 'application',
    rendererKey: 'participant-application',
    editorVariant: 'ujat-recruit-volunteer',
    previewHeaderTitleFallback: 'UJAT_봉사자 모집 폼',
    modalDescription: RECRUITMENT_MODAL_DESCRIPTION,
  },
  'recruitment-gemini-visiting-training': {
    id: 'recruitment-gemini-visiting-training',
    category: 'application',
    rendererKey: 'participant-application',
    editorVariant: 'gemini-recruit',
    previewHeaderTitleFallback: 'Gemini_찾아가는 연수 모집 폼',
    modalDescription: RECRUITMENT_MODAL_DESCRIPTION,
  },
  'recruitment-trained-teachers': {
    id: 'recruitment-trained-teachers',
    category: 'application',
    rendererKey: 'participant-application',
    editorVariant: 'trained-teachers-recruit-institution',
    previewHeaderTitleFallback: '교육 받은 교사_참여 기관 모집 폼',
    modalDescription: RECRUITMENT_MODAL_DESCRIPTION,
  },
  'application-participant-school': {
    id: 'application-participant-school',
    category: 'application',
    rendererKey: 'participant-application',
    editorVariant: 'institution',
    previewHeaderTitleFallback: '일반_참여 기관 신청 폼',
    modalDescription: APPLICATION_MODAL_DESCRIPTION,
  },
  'application-participant-individual': {
    id: 'application-participant-individual',
    category: 'application',
    rendererKey: 'participant-application',
    editorVariant: 'individual',
    previewHeaderTitleFallback: '일반_참여자 신청 폼',
    modalDescription: APPLICATION_MODAL_DESCRIPTION,
  },
  'application-instructor': {
    id: 'application-instructor',
    category: 'application',
    rendererKey: 'participant-application',
    editorVariant: 'instructor',
    previewHeaderTitleFallback: '공통_강사 신청 폼',
    modalDescription: APPLICATION_MODAL_DESCRIPTION,
  },
  'application-volunteer': {
    id: 'application-volunteer',
    category: 'application',
    rendererKey: 'participant-application',
    editorVariant: 'volunteer',
    previewHeaderTitleFallback: '공통_봉사자 신청 폼',
    modalDescription: APPLICATION_MODAL_DESCRIPTION,
  },
  'application-economy': {
    id: 'application-economy',
    category: 'application',
    rendererKey: 'participant-application',
    editorVariant: 'economy-application-institution',
    previewHeaderTitleFallback: '1사1교_참여 기관 신청 폼',
    modalDescription: APPLICATION_MODAL_DESCRIPTION,
  },
  'application-trained-teachers': {
    id: 'application-trained-teachers',
    category: 'application',
    rendererKey: 'participant-application',
    editorVariant: 'trained-teachers-application-institution',
    previewHeaderTitleFallback: '교육받은 교사_참여 기관 신청 폼',
    modalDescription: APPLICATION_MODAL_DESCRIPTION,
  },
  'application-gemini-visiting-training-instructor': {
    id: 'application-gemini-visiting-training-instructor',
    category: 'application',
    rendererKey: 'participant-application',
    editorVariant: 'gemini-application-instructor',
    previewHeaderTitleFallback: 'Gemini_찾아가는 연수 강사 신청 폼',
    modalDescription: APPLICATION_MODAL_DESCRIPTION,
  },
  'application-gemini-visiting-training-school': {
    id: 'application-gemini-visiting-training-school',
    category: 'application',
    rendererKey: 'participant-application',
    editorVariant: 'gemini-application-institution',
    previewHeaderTitleFallback: 'Gemini_찾아가는 연수 참여 기관 신청 폼',
    modalDescription: APPLICATION_MODAL_DESCRIPTION,
  },
  'application-ujat-school': {
    id: 'application-ujat-school',
    category: 'application',
    rendererKey: 'participant-application',
    editorVariant: 'ujat-application-institution',
    previewHeaderTitleFallback: 'UJAT_참여 기관 신청 폼',
    modalDescription: APPLICATION_MODAL_DESCRIPTION,
  },
  'application-ujat-volunteer': {
    id: 'application-ujat-volunteer',
    category: 'application',
    rendererKey: 'participant-application',
    editorVariant: 'ujat-application-volunteer',
    previewHeaderTitleFallback: 'UJAT_봉사자 신청 폼',
    modalDescription: APPLICATION_MODAL_DESCRIPTION,
  },
  'survey-default': {
    id: 'survey-default',
    category: 'survey',
    rendererKey: 'survey',
    suppressUserPreviewStrip: true,
    previewHeaderTitleFallback: '설문',
    modalDescription: SURVEY_MODAL_DESCRIPTION,
  },
  'survey-student': {
    id: 'survey-student',
    category: 'survey',
    rendererKey: 'survey',
    suppressUserPreviewStrip: true,
    previewHeaderTitleFallback: '설문',
    modalDescription: SURVEY_MODAL_DESCRIPTION,
  },
  'survey-teacher': {
    id: 'survey-teacher',
    category: 'survey',
    rendererKey: 'survey',
    suppressUserPreviewStrip: true,
    previewHeaderTitleFallback: '설문',
    modalDescription: SURVEY_MODAL_DESCRIPTION,
  },
  'survey-admin': {
    id: 'survey-admin',
    category: 'survey',
    rendererKey: 'survey',
    suppressUserPreviewStrip: true,
    previewHeaderTitleFallback: '설문',
    modalDescription: SURVEY_MODAL_DESCRIPTION,
  },
  'agreement-third-party': {
    id: 'agreement-third-party',
    category: 'agreement',
    rendererKey: 'agreement-shell',
    agreementConfigKey: 'agreement-third-party',
    usesAgreementShell: true,
    suppressUserPreviewStrip: true,
    selfManagedPreview: true,
    previewStrategy: 'a4-content-only',
    previewHeaderTitleFallback: '지급조서 사전 동의서',
  },
  'agreement-receipt-pre-consent': {
    id: 'agreement-receipt-pre-consent',
    category: 'agreement',
    rendererKey: 'agreement-shell',
    agreementConfigKey: 'agreement-receipt-pre-consent',
    usesAgreementShell: true,
    suppressUserPreviewStrip: true,
    selfManagedPreview: true,
    previewStrategy: 'a4-content-only',
    previewHeaderTitleFallback: '영수증 사전 동의서',
  },
  'agreement-crime': {
    id: 'agreement-crime',
    category: 'agreement',
    rendererKey: 'crime-consent',
    usesCrimeConsentModal: true,
    previewHeaderTitleFallback: '성범죄경력 조회 동의서',
    modalDescription: CRIME_CONSENT_MODAL_DESCRIPTION,
  },
  'agreement-notice': {
    id: 'agreement-notice',
    category: 'agreement',
    rendererKey: 'agreement-shell',
    agreementConfigKey: 'agreement-notice',
    usesAgreementShell: true,
    suppressUserPreviewStrip: true,
    selfManagedPreview: true,
    previewStrategy: 'a4-content-only',
    previewHeaderTitleFallback: '행정정보 공동이용 사전동의서',
  },
  'agreement-expense': {
    id: 'agreement-expense',
    category: 'agreement',
    rendererKey: 'agreement-shell',
    agreementConfigKey: 'agreement-expense',
    usesAgreementShell: true,
    suppressUserPreviewStrip: true,
    selfManagedPreview: true,
    previewStrategy: 'a4-content-only',
    previewHeaderTitleFallback: 'JA Korea 교육진행자 서약서',
  },
  'agreement-portrait': {
    id: 'agreement-portrait',
    category: 'agreement',
    rendererKey: 'agreement-shell',
    agreementConfigKey: 'agreement-portrait',
    usesAgreementShell: true,
    suppressUserPreviewStrip: true,
    selfManagedPreview: true,
    previewStrategy: 'a4-content-only',
    previewHeaderTitleFallback: '초상권 수집·이용 동의서',
  },
}

export const TEMPLATE_FORM_MODAL_DESCRIPTION = REGISTRATION_MODAL_DESCRIPTION

/**
 * API 복제·직접 생성 code → 에디터 레지스트리용 베이스 code.
 * - `recruitment-volunteer-copy-01` → `recruitment-volunteer`
 * - `survey-custom-20260713-01` → `survey-default`
 * - `agreement-custom-…` → 직접 등록 동의(셸 없음) — undefined 유지 후 호출부 처리
 */
export function resolveBaseTemplateCodeForRegistry(
  templateCode: string,
  apiBaseTemplateCode?: string | null
): string | undefined {
  const explicit = apiBaseTemplateCode?.trim()
  if (explicit != null && explicit !== '') return explicit

  const code = templateCode.trim()
  if (code === '') return undefined

  if (/^survey-custom-/i.test(code)) return 'survey-default'

  return undefined
}

export function lookupTemplateRegistry(
  templateId: string | undefined | null,
  options?: { baseTemplateCode?: string | null }
): TemplateRegistryDefinition | undefined {
  if (templateId == null || templateId.trim() === '') return undefined
  const code = templateId.trim()
  const exact = TEMPLATE_REGISTRY[code]
  if (exact != null) return { ...exact, id: code }

  const baseCode = resolveBaseTemplateCodeForRegistry(code, options?.baseTemplateCode)
  if (baseCode == null) return undefined
  const base = TEMPLATE_REGISTRY[baseCode]
  if (base == null) return undefined

  return { ...base, id: code }
}

export function isParticipantApplicationRegistryEntry(
  entry: TemplateRegistryDefinition | undefined
): boolean {
  return entry?.rendererKey === 'participant-application'
}

export function isRegistrationRegistryEntry(
  entry: TemplateRegistryDefinition | undefined
): boolean {
  return entry?.category === 'registration'
}

export function isSurveyRegistryEntry(entry: TemplateRegistryDefinition | undefined): boolean {
  return entry?.category === 'survey'
}

export function resolvePreviewEditorKind(
  entry: TemplateRegistryDefinition | undefined
): 'agreement' | 'survey' {
  return entry?.category === 'agreement' || entry?.id.startsWith('agreement-') === true
    ? 'agreement'
    : 'survey'
}

export function resolvePreviewHeaderTitle(
  entry: TemplateRegistryDefinition | undefined,
  templateName?: string
): string {
  const name = templateName?.trim()
  if (name != null && name !== '') return name
  return entry?.previewHeaderTitleFallback ?? '양식 미리보기'
}

export function shouldRegistryUseA4Preview(entry: TemplateRegistryDefinition | undefined): boolean {
  return entry?.previewStrategy === 'a4-content-only'
}
