import { TEMPLATE_FORM_EDUCATION_RECRUITMENT_TARGET_OPTIONS } from '@/features/template/lib/template-form-select-options'

const LABEL_TO_VALUE = new Map(
  TEMPLATE_FORM_EDUCATION_RECRUITMENT_TARGET_OPTIONS.map(o => [o.label, o.value])
)
const VALUE_TO_LABEL = new Map(
  TEMPLATE_FORM_EDUCATION_RECRUITMENT_TARGET_OPTIONS.map(o => [o.value, o.label])
)

/** UJAT 봉사자 모집 — 모집 대상 기본값 (대학(원)생, 성인) */
export const UJAT_VOLUNTEER_RECRUIT_DEFAULT_TARGET_VALUES = ['university', 'adult'] as const
export const UJAT_VOLUNTEER_RECRUIT_DEFAULT_TARGET_LABELS = ['대학(원)생', '성인'] as const

/** 모집 대상 표시 문자열(쉼표 구분 라벨) → CmsSelect multiple option value[] */
export function recruitmentTargetLabelsToOptionValues(text: string | undefined): string[] {
  if (!text?.trim()) return [...UJAT_VOLUNTEER_RECRUIT_DEFAULT_TARGET_VALUES]
  const parts = text
    .split(/[,，·]/)
    .map(s => s.trim())
    .filter(Boolean)
  const values = parts
    .map(part => LABEL_TO_VALUE.get(part))
    .filter((v): v is string => v != null)
  return values.length > 0 ? values : [...UJAT_VOLUNTEER_RECRUIT_DEFAULT_TARGET_VALUES]
}

/** CmsSelect option value[] → 저장용 라벨[] */
export function recruitmentTargetOptionValuesToLabels(values: unknown): string[] {
  if (!Array.isArray(values)) return []
  return values
    .map(value => VALUE_TO_LABEL.get(String(value)))
    .filter((label): label is string => label != null)
}

/** form `volunteerTargets`(라벨 또는 option value) → CmsSelect multiple value[] */
export function normalizeRecruitmentTargetSelectValues(raw: string[] | undefined): string[] {
  if (raw == null) return [...UJAT_VOLUNTEER_RECRUIT_DEFAULT_TARGET_VALUES]
  if (raw.length === 0) return []
  const asValues = raw.filter(value => VALUE_TO_LABEL.has(value))
  if (asValues.length > 0) return asValues
  return recruitmentTargetLabelsToOptionValues(raw.join(', '))
}