import { TEMPLATE_FORM_EDUCATION_RECRUITMENT_TARGET_OPTIONS } from '@/features/template/lib/template-form-select-options'
const LABEL_TO_VALUE = new Map(
  TEMPLATE_FORM_EDUCATION_RECRUITMENT_TARGET_OPTIONS.map(o => [o.label, o.value])
)
/** 모집 대상 표시 문자열(쉼표 구분 라벨) → CmsSelect multiple option value[] */
export function recruitmentTargetLabelsToOptionValues(text: string | undefined): string[] {
  if (!text?.trim()) return ['university', 'adult']
  const parts = text
    .split(/[,，·]/)
    .map(s => s.trim())
    .filter(Boolean)
  const values = parts
    .map(part => LABEL_TO_VALUE.get(part))
    .filter((v): v is string => v != null)
  return values.length > 0 ? values : ['university', 'adult']
}