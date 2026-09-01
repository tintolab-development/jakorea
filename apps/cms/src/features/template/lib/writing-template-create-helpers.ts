import type { TemplateRow, TemplateSection } from '@/features/template/model/template.schema'
import { writingSections } from '@/features/template/model/template.schema'
import type { WritingTemplateCategory } from '@/features/template/model/template-create.types'

export function getWritingTemplateRowsByCategory(
  category: WritingTemplateCategory,
  sections: TemplateSection[] = writingSections
): TemplateRow[] {
  const section = sections.find(s => s.key === category)
  return section?.rows ?? []
}

export function findWritingTemplateRowByDefinitionId(
  id: string,
  sections: TemplateSection[] = writingSections
): TemplateRow | undefined {
  for (const section of sections) {
    const row = section.rows.find(r => r.id === id)
    if (row) return row
  }
  return undefined
}
