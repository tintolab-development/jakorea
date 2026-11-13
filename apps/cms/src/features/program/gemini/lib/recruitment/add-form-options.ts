import {
  TEMPLATE_FORM_EDUCATION_RECRUITMENT_TARGET_OPTIONS,
  type TemplateFormSelectOption,
} from '@/features/template/lib/template-form-select-options'
import { getProgramRegistrationEducationFormOptions } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-education-form-options'

/** Gemini 찾아가는 연수 — 교육 대상 (모집 양식과 동일 5종) */
export const GEMINI_RECRUITMENT_EDUCATION_TARGET_OPTIONS: TemplateFormSelectOption[] =
  TEMPLATE_FORM_EDUCATION_RECRUITMENT_TARGET_OPTIONS

/** Gemini 찾아가는 연수 — 교육 형태 (온라인 / 오프라인만) */
export const GEMINI_RECRUITMENT_EDUCATION_FORM_OPTIONS = getProgramRegistrationEducationFormOptions(
  false
).filter(option => option.value === 'online' || option.value === 'offline')

export type GeminiRecruitmentEducationForm = 'online' | 'offline'

/**
 * Gemini 모집 공고 교육 진행 구조 (BE wire: CURRICULUM | SCHEDULE).
 * UI 셀렉트 없음 → 기본 SCHEDULE. CURRICULUM은 detailedProgramId 필수.
 */
export type GeminiRecruitmentEducationStructure = 'CURRICULUM' | 'SCHEDULE'

export const GEMINI_RECRUITMENT_DEFAULT_EDUCATION_STRUCTURE: GeminiRecruitmentEducationStructure =
  'SCHEDULE'

export const GEMINI_RECRUITMENT_ADD_SECTION_IDS = {
  institution: 'gemini-recruitment-add-section-institution',
  detail: 'gemini-recruitment-add-section-detail',
} as const

export const GEMINI_RECRUITMENT_PROGRAM_DESCRIPTION_FIELD = {
  label: '프로그램 설명',
  placeholder: '프로그램 설명을 작성해 주세요',
  key: 'programDescription' as const,
}

/** 시안 — 모집 안내·지원 방법·학습 지원 내용·추가 내용은 WYSIWYG */
export const GEMINI_RECRUITMENT_DETAIL_RICH_TEXT_FIELDS = [
  { label: '모집 안내', placeholder: '모집 안내를 작성하세요', key: 'recruitmentGuide' as const },
  { label: '지원 방법', placeholder: '지원 방법을 작성하세요', key: 'applicationMethod' as const },
  {
    label: '학습 지원 내용',
    placeholder: '학습 지원 내용을 작성하세요',
    key: 'learningSupportContent' as const,
  },
  { label: '추가 내용', placeholder: '내용을 작성하세요', key: 'additionalContentMarkdown' as const },
] as const

export type GeminiRecruitmentRichTextKey =
  (typeof GEMINI_RECRUITMENT_DETAIL_RICH_TEXT_FIELDS)[number]['key']

export type GeminiRecruitmentRichTextGetter = () => string

export type GeminiRecruitmentRichTextGetterMap = Partial<
  Record<GeminiRecruitmentRichTextKey, GeminiRecruitmentRichTextGetter>
>

const GEMINI_RECRUITMENT_RICH_TEXT_KEYS = GEMINI_RECRUITMENT_DETAIL_RICH_TEXT_FIELDS.map(
  field => field.key
)

export function overlayGeminiRecruitmentRichText<
  T extends Record<GeminiRecruitmentRichTextKey, string>,
>(getters: GeminiRecruitmentRichTextGetterMap, values: T): T {
  const next = { ...values }
  for (const key of GEMINI_RECRUITMENT_RICH_TEXT_KEYS) {
    const getter = getters[key]
    if (getter) next[key] = getter()
  }
  return next
}
