import {
  ISSUANCE_FORM_LIST_TEMPLATE_CODES,
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
import {
  isProgramScopedOperationalWritingTemplate,
  resolveWritingFormTemplateDeletable,
} from '@/features/template/lib/form-template-delete-policy'
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
    baseTemplateCode: item.baseTemplateCode?.trim() || templateCode,
    latestVersionId: item.latestVersionId,
    deletable: resolveWritingFormTemplateDeletable({
      id: templateCode,
      systemTemplate,
      availableActions: item.availableActions,
      deletable: item.deletable,
    }),
  }
}

/**
 * API 행만 노출 — mock 카탈로그 merge 없음 (remote SSOT).
 * No.는 내림차순(맨 위 행이 가장 큰 번호, QA 261113 #1·#8).
 */
function renumberRows(apiRows: TemplateRow[]): TemplateRow[] {
  return apiRows.map((row, index) => ({ ...row, no: apiRows.length - index }))
}

const ISSUANCE_LIST_ORDER_INDEX = new Map<string, number>(
  ISSUANCE_FORM_LIST_TEMPLATE_CODES.map((code, index) => [code, index])
)

/** 발급 양식 목록 — `ISSUANCE_FORM_LIST_TEMPLATE_CODES` 순서로 표시(목록에 없는 코드는 API 순서로 뒤에) */
function sortIssuanceItemsByListOrder(
  items: FormTemplateListItemResponse[]
): FormTemplateListItemResponse[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const ai = ISSUANCE_LIST_ORDER_INDEX.get(a.item.templateCode?.trim() ?? '') ?? Number.MAX_SAFE_INTEGER
      const bi = ISSUANCE_LIST_ORDER_INDEX.get(b.item.templateCode?.trim() ?? '') ?? Number.MAX_SAFE_INTEGER
      return ai === bi ? a.index - b.index : ai - bi
    })
    .map(({ item }) => item)
}

function groupItemsByCategory(
  items: FormTemplateListItemResponse[]
): Map<WritingFormCategory, FormTemplateListItemResponse[]> {
  const grouped = new Map<WritingFormCategory, FormTemplateListItemResponse[]>()
  for (const item of items) {
    const code = item.templateCode?.trim()
    if (code == null || code === '') continue
    // 프로그램 종속 등록 copy — 양식 관리 비노출. 모집·신청 사용자 복제는 노출.
    if (isProgramScopedOperationalWritingTemplate(item)) continue
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
      rows: renumberRows(apiRows),
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
    const categoryItems = sortIssuanceItemsByListOrder(grouped.get(section.category) ?? [])
    const apiRows = categoryItems
      .map((item, index) =>
        mapFormTemplateListItemToIssuanceRow(item, { rowIndex: index, rowKeyPrefix: section.key })
      )
      .filter((row): row is TemplateRow => row != null)

    return {
      key: section.key,
      title: section.title,
      description: section.description,
      rows: renumberRows(apiRows),
    }
  })
}
