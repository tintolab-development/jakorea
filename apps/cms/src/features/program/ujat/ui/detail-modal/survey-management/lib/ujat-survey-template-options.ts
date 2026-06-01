import { getWritingTemplateRowsByCategory } from '@/features/template/lib/writing-template-create-helpers'

export type UjatSurveyTemplateSelectOption = {
  label: string
  value: string
}

/** 양식 관리 > 설문 양식 섹션과 동일한 목록 */
export function getSurveyWritingTemplateSelectOptions(): UjatSurveyTemplateSelectOption[] {
  return getWritingTemplateRowsByCategory('survey').map(row => ({
    label: row.templateName,
    value: row.id,
  }))
}
