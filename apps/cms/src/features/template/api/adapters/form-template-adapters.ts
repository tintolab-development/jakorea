import {
  ISSUANCE_FORM_SECTION_CATALOG,
  ISSUANCE_TEMPLATE_CODE_CATALOG,
  isIssuanceFormListTemplateCode,
  resolveIssuanceFormCategory,
  resolveWritingFormCategory,
  TEMPLATE_CODE_CATALOG,
  WRITING_FORM_SECTION_CATALOG,
  type IssuanceFormCategory,
  type WritingFormCategory,
} from '@/features/template/api/form-template-catalog'
import { resolveWritingFormTemplateDeletable } from '@/features/template/lib/form-template-delete-policy'
import { issuanceFormSections } from '@/features/template/model/issuance-form.schema'
import { writingSections } from '@/features/template/model/template.schema'
import type { TemplateRow, TemplateSection } from '@/features/template/model/template.schema'
import type { FormTemplateListItemResponse } from '@/shared/api/generated/forms-surveys/schemas'

function formatTemplateDate(iso?: string): string {
  if (iso == null || iso.trim() === '') return '-'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '-'
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}.${m}.${d}`
}

export function mapFormTemplateListItemToRow(
  item: FormTemplateListItemResponse,
  options: { rowIndex: number; rowKeyPrefix: string }
): TemplateRow | null {
  const templateCode = item.templateCode?.trim()
  if (templateCode == null || templateCode === '') return null

  const catalog = TEMPLATE_CODE_CATALOG[templateCode]
  const systemTemplate = item.systemTemplate
  return {
    id: templateCode,
    templateName: item.templateName?.trim() || catalog?.templateName || templateCode,
    variant: catalog?.variant ?? 'default',
    key: `${options.rowKeyPrefix}-${options.rowIndex + 1}`,
    no: options.rowIndex + 1,
    creator: systemTemplate === false ? '사용자 생성' : '시스템 생성',
    createdAt: formatTemplateDate(item.updatedAt),
    updatedAt: formatTemplateDate(item.updatedAt),
    apiTemplateId: item.templateId,
    systemTemplate,
    availableActions: item.availableActions,
    deletable: resolveWritingFormTemplateDeletable({
      id: templateCode,
      systemTemplate,
      availableActions: item.availableActions,
    }),
  }
}

function mergeSectionRows(apiRows: TemplateRow[], mockRows: TemplateRow[]): TemplateRow[] {
  if (apiRows.length === 0) return mockRows
  const apiById = new Map(apiRows.map(row => [row.id, row]))
  const merged: TemplateRow[] = []
  const seen = new Set<string>()

  for (const mockRow of mockRows) {
    const apiRow = apiById.get(mockRow.id)
    merged.push(apiRow ?? mockRow)
    seen.add(mockRow.id)
  }

  for (const apiRow of apiRows) {
    if (!seen.has(apiRow.id)) {
      merged.push(apiRow)
      seen.add(apiRow.id)
    }
  }

  return merged.map((row, index) => ({ ...row, no: index + 1 }))
}

function groupItemsByCategory(
  items: FormTemplateListItemResponse[]
): Map<WritingFormCategory, FormTemplateListItemResponse[]> {
  const grouped = new Map<WritingFormCategory, FormTemplateListItemResponse[]>()
  for (const item of items) {
    const code = item.templateCode?.trim()
    if (code == null || code === '') continue
    const category = resolveWritingFormCategory(code, item.category)
    if (category == null) continue
    const list = grouped.get(category) ?? []
    list.push(item)
    grouped.set(category, list)
  }
  return grouped
}

export function buildWritingFormSectionsFromApiItems(
  items: FormTemplateListItemResponse[]
): TemplateSection[] {
  const grouped = groupItemsByCategory(items)

  return WRITING_FORM_SECTION_CATALOG.map(section => {
    const mockSection = writingSections.find(s => s.key === section.key)
    const categoryItems = grouped.get(section.category) ?? []
    const apiRows = categoryItems
      .map((item, index) =>
        mapFormTemplateListItemToRow(item, { rowIndex: index, rowKeyPrefix: section.key })
      )
      .filter((row): row is TemplateRow => row != null)

    return {
      key: section.key,
      title: section.title,
      description: section.description,
      rows: mergeSectionRows(apiRows, mockSection?.rows ?? []),
    }
  })
}

function groupIssuanceItemsByCategory(
  items: FormTemplateListItemResponse[]
): Map<IssuanceFormCategory, FormTemplateListItemResponse[]> {
  const grouped = new Map<IssuanceFormCategory, FormTemplateListItemResponse[]>()
  for (const item of items) {
    const code = item.templateCode?.trim()
    if (code == null || code === '') continue
    // Notion 목록 비노출 코드(시드/레거시)는 UI 목록에 합치지 않음
    if (!isIssuanceFormListTemplateCode(code) && ISSUANCE_TEMPLATE_CODE_CATALOG[code] != null) {
      continue
    }
    const category = resolveIssuanceFormCategory(code, item.category)
    if (category == null) continue
    const list = grouped.get(category) ?? []
    list.push(item)
    grouped.set(category, list)
  }
  return grouped
}

export function mapFormTemplateListItemToIssuanceRow(
  item: FormTemplateListItemResponse,
  options: { rowIndex: number; rowKeyPrefix: string }
): TemplateRow | null {
  const templateCode = item.templateCode?.trim()
  if (templateCode == null || templateCode === '') return null

  const catalog = ISSUANCE_TEMPLATE_CODE_CATALOG[templateCode]
  return {
    id: templateCode,
    templateName: item.templateName?.trim() || catalog?.templateName || templateCode,
    variant: 'default',
    key: `${options.rowKeyPrefix}-${options.rowIndex + 1}`,
    no: options.rowIndex + 1,
    creator: '시스템 생성',
    createdAt: formatTemplateDate(item.updatedAt),
    updatedAt: formatTemplateDate(item.updatedAt),
  }
}

export function buildIssuanceFormSectionsFromApiItems(
  items: FormTemplateListItemResponse[]
): TemplateSection[] {
  const grouped = groupIssuanceItemsByCategory(items)

  return ISSUANCE_FORM_SECTION_CATALOG.map(section => {
    const mockSection = issuanceFormSections.find(s => s.key === section.key)
    const categoryItems = grouped.get(section.category) ?? []
    const apiRows = categoryItems
      .map((item, index) =>
        mapFormTemplateListItemToIssuanceRow(item, { rowIndex: index, rowKeyPrefix: section.key })
      )
      .filter((row): row is TemplateRow => row != null)

    return {
      key: section.key,
      title: section.title,
      description: section.description,
      rows: mergeSectionRows(apiRows, mockSection?.rows ?? []),
    }
  })
}
