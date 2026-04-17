import { writingSections } from '@/features/template/model/template.schema'
import type { TemplateRow } from '@/features/template/model/template.schema'
import type { WritingTemplateCategory } from '@/features/template/model/template-create.types'

export function getWritingTemplateRowsByCategory(
  category: WritingTemplateCategory
): TemplateRow[] {
  const section = writingSections.find(s => s.key === category)
  return section?.rows ?? []
}

export function findWritingTemplateRowByDefinitionId(id: string): TemplateRow | undefined {
  for (const section of writingSections) {
    const row = section.rows.find(r => r.id === id)
    if (row) return row
  }
  return undefined
}
