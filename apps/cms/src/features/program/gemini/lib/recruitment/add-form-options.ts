import type { TemplateFormSelectOption } from '@/features/template/lib/template-form-select-options'
import { getProgramRegistrationEducationFormOptions } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-education-form-options'

/** Gemini 찾아가는 연수 — 교육 대상 (성인 / 대학생만) */
export const GEMINI_RECRUITMENT_EDUCATION_TARGET_OPTIONS: TemplateFormSelectOption[] = [
  { value: 'adult', label: '성인' },
  { value: 'university', label: '대학생' },
]

/** Gemini 찾아가는 연수 — 교육 형태 (온라인 / 오프라인만) */
export const GEMINI_RECRUITMENT_EDUCATION_FORM_OPTIONS = getProgramRegistrationEducationFormOptions(
  false
).filter(option => option.value === 'online' || option.value === 'offline')

export type GeminiRecruitmentEducationForm = 'online' | 'offline'

export const GEMINI_RECRUITMENT_ADD_SECTION_IDS = {
  institution: 'gemini-recruitment-add-section-institution',
  detail: 'gemini-recruitment-add-section-detail',
} as const

export const GEMINI_RECRUITMENT_DETAIL_TEXT_FIELDS = [
  { label: '프로그램 설명', placeholder: '프로그램 설명을 작성하세요', key: 'programDescription' as const },
  { label: '모집 안내', placeholder: '모집 안내를 작성하세요', key: 'recruitmentGuide' as const },
  { label: '지원 방법', placeholder: '지원 방법을 작성하세요', key: 'applicationMethod' as const },
  {
    label: '학습 지원 내용',
    placeholder: '학습 지원 내용을 작성하세요',
    key: 'learningSupportContent' as const,
  },
]
