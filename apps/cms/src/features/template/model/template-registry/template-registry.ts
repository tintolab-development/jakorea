import type { ProgramParticipantApplicationEditorVariant } from '@/features/template/hooks/use-program-participant-application-editor'

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
  registrationFormVariant?: 'general' | 'economy'
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
}

const REGISTRATION_MODAL_DESCRIPTION =
  '* 해당 폼은 기존 항목의 삭제가 불가하며, 수정에 제한이 있습니다.'

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
    previewHeaderTitleFallback: '1사 1교 프로그램 등록 폼',
  },
  'registration-ujat': {
    id: 'registration-ujat',
    category: 'registration',
    rendererKey: 'registration-ujat',
    registrationEditor: 'ujat',
    previewHeaderTitleFallback: 'UJAT 프로그램 등록 폼',
  },
  'recruitment-participant-school': {
    id: 'recruitment-participant-school',
    category: 'application',
    rendererKey: 'participant-application',
    editorVariant: 'applicant-recruit-institution',
    previewHeaderTitleFallback: '프로그램 참여자 모집 폼 (학교)',
  },
  'recruitment-participant-individual': {
    id: 'recruitment-participant-individual',
    category: 'application',
    rendererKey: 'participant-application',
    editorVariant: 'applicant-recruit-individual',
    previewHeaderTitleFallback: '프로그램 참여자 모집 폼 (개인)',
  },
  'recruitment-instructor': {
    id: 'recruitment-instructor',
    category: 'application',
    rendererKey: 'participant-application',
    editorVariant: 'recruit-instructor',
    previewHeaderTitleFallback: '프로그램 강사 모집 폼',
  },
  'recruitment-volunteer': {
    id: 'recruitment-volunteer',
    category: 'application',
    rendererKey: 'participant-application',
    editorVariant: 'recruit-volunteer',
    previewHeaderTitleFallback: '프로그램 봉사자 모집 폼',
  },
  'recruitment-ujat-school': {
    id: 'recruitment-ujat-school',
    category: 'application',
    rendererKey: 'participant-application',
    editorVariant: 'ujat-recruit-institution',
    previewHeaderTitleFallback: 'UJAT 프로그램 학교 모집 폼',
  },
  'recruitment-ujat-volunteer': {
    id: 'recruitment-ujat-volunteer',
    category: 'application',
    rendererKey: 'participant-application',
    editorVariant: 'ujat-recruit-volunteer',
    previewHeaderTitleFallback: 'UJAT 프로그램 봉사자 모집 폼',
  },
  'application-participant-school': {
    id: 'application-participant-school',
    category: 'application',
    rendererKey: 'participant-application',
    editorVariant: 'institution',
    previewHeaderTitleFallback: '프로그램 참여자 신청 폼 (학교)',
  },
  'application-participant-individual': {
    id: 'application-participant-individual',
    category: 'application',
    rendererKey: 'participant-application',
    editorVariant: 'individual',
    previewHeaderTitleFallback: '프로그램 참여자 신청 폼 (개인)',
  },
  'application-instructor': {
    id: 'application-instructor',
    category: 'application',
    rendererKey: 'participant-application',
    editorVariant: 'instructor',
    previewHeaderTitleFallback: '프로그램 강사 신청 폼',
  },
  'application-volunteer': {
    id: 'application-volunteer',
    category: 'application',
    rendererKey: 'participant-application',
    editorVariant: 'volunteer',
    previewHeaderTitleFallback: '프로그램 봉사자 신청 폼',
  },
  'application-economy': {
    id: 'application-economy',
    category: 'application',
    rendererKey: 'participant-application',
    editorVariant: 'economy-application-institution',
    previewHeaderTitleFallback: '1사1교 프로그램 참여자 신청 폼',
  },
  'application-gemini-visiting-training-instructor': {
    id: 'application-gemini-visiting-training-instructor',
    category: 'application',
    rendererKey: 'participant-application',
    editorVariant: 'gemini-application-instructor',
    previewHeaderTitleFallback: 'Gemini 찾아가는 연수 강사 신청 폼',
  },
  'application-gemini-visiting-training-school': {
    id: 'application-gemini-visiting-training-school',
    category: 'application',
    rendererKey: 'participant-application',
    editorVariant: 'gemini-application-institution',
    previewHeaderTitleFallback: 'Gemini 찾아가는 연수 학교 신청 폼',
  },
  'application-ujat-school': {
    id: 'application-ujat-school',
    category: 'application',
    rendererKey: 'participant-application',
    editorVariant: 'ujat-application-institution',
    previewHeaderTitleFallback: 'UJAT 프로그램 학교 신청 폼',
  },
  'application-ujat-volunteer': {
    id: 'application-ujat-volunteer',
    category: 'application',
    rendererKey: 'participant-application',
    editorVariant: 'ujat-application-volunteer',
    previewHeaderTitleFallback: 'UJAT 프로그램 봉사자 신청 폼',
  },
  'survey-default': {
    id: 'survey-default',
    category: 'survey',
    rendererKey: 'survey',
    suppressUserPreviewStrip: true,
    previewHeaderTitleFallback: '설문',
  },
  'survey-student': {
    id: 'survey-student',
    category: 'survey',
    rendererKey: 'survey',
    suppressUserPreviewStrip: true,
    previewHeaderTitleFallback: '설문',
  },
  'survey-teacher': {
    id: 'survey-teacher',
    category: 'survey',
    rendererKey: 'survey',
    suppressUserPreviewStrip: true,
    previewHeaderTitleFallback: '설문',
  },
  'survey-admin': {
    id: 'survey-admin',
    category: 'survey',
    rendererKey: 'survey',
    suppressUserPreviewStrip: true,
    previewHeaderTitleFallback: '설문',
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
  'agreement-crime': {
    id: 'agreement-crime',
    category: 'agreement',
    rendererKey: 'crime-consent',
    usesCrimeConsentModal: true,
    previewHeaderTitleFallback: '성범죄 경력조회 동의서',
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
    previewHeaderTitleFallback: '교육진행자 동의 서약서',
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

export function lookupTemplateRegistry(
  templateId: string | undefined | null
): TemplateRegistryDefinition | undefined {
  if (templateId == null || templateId.trim() === '') return undefined
  return TEMPLATE_REGISTRY[templateId.trim()]
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
