import { resolveWritingFormBaseTemplateCode } from '@/features/template/lib/form-template-delete-policy'
import type { TemplateRow } from '@/features/template/model/template.schema'

/** 목록 행의 양식 패밀리(카탈로그 원본 code). 복제본은 baseTemplateCode 또는 접미사 규칙으로 해석한다. */
export function resolveWritingTemplateRowFamily(row: TemplateRow): string {
  return resolveWritingFormBaseTemplateCode(row.id, row.baseTemplateCode)
}

export function isWritingTemplateRowInFamily(
  row: TemplateRow,
  expectedFamilyCode: string | undefined | null
): boolean {
  const expected = expectedFamilyCode?.trim()
  if (expected == null || expected === '') return true
  return resolveWritingTemplateRowFamily(row) === expected
}
