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
  'registration-trained-teachers': {
    id: 'registration-trained-teachers',
    category: 'registration',
    rendererKey: 'registration-trained-teachers',
    registrationEditor: 'general',
    registrationFormVariant: 'trainedTeachers',
    previewHeaderTitleFallback: '교육받은 교사 프로그램 등록 폼',
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
  'application-trained-teachers': {
    id: 'application-trained-teachers',
    category: 'application',
    rendererKey: 'participant-application',
    editorVariant: 'trained-teachers-application-institution',
    previewHeaderTitleFallback: '교육받은 교사 프로그램 참여자 신청 폼',
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
    previewHeaderTitleFallback: 'Gemini 찾아가는 연수 참여 기관 신청 폼',
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

/**
 * API 복제·직접 생성 code → 에디터 레지스트리용 베이스 code.
 * - `recruitment-volunteer-copy-01` → `recruitment-volunteer`
 * - `survey-custom-20260713-01` → `survey-default`
 * - `agreement-custom-…` → 직접 등록 동의(셸 없음) — undefined 유지 후 호출부 처리
 */
export function resolveBaseTemplateCodeForRegistry(
  templateCode: string
): string | undefined {
  const code = templateCode.trim()
  if (code === '') return undefined

  const copyMatch = code.match(/^(.*)-copy-\d+$/)
  if (copyMatch?.[1]) return copyMatch[1]

  if (/^survey-custom-/i.test(code)) return 'survey-default'

  return undefined
}

export function lookupTemplateRegistry(
  templateId: string | undefined | null
): TemplateRegistryDefinition | undefined {
  if (templateId == null || templateId.trim() === '') return undefined
  const code = templateId.trim()
  const exact = TEMPLATE_REGISTRY[code]
  if (exact != null) return exact

  const baseCode = resolveBaseTemplateCodeForRegistry(code)
  if (baseCode == null) return undefined
  const base = TEMPLATE_REGISTRY[baseCode]
  if (base == null) return undefined

  // 에디터 종류는 베이스를 따르고, draft 로드/저장 id는 실제 templateCode 유지
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
