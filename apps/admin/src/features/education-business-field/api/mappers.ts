/**
 * 사업분야 catalog — OpenAPI ↔ 도메인 매핑
 */

import type {
  EducationBusinessField,
  EducationBusinessFieldDocument,
  EducationBusinessFieldIntro,
  EducationBusinessFieldKey,
  EducationBusinessFieldTextPatch,
} from '@/entities/education-business-field/model/types'
import type { BusinessCatalogResponse } from '@/shared/api/generated/education/schemas/businessCatalogResponse'
import type { BusinessCatalogUpdateRequest } from '@/shared/api/generated/education/schemas/businessCatalogUpdateRequest'
import type { BusinessFieldResponse } from '@/shared/api/generated/education/schemas/businessFieldResponse'
import type { BusinessFieldUpdateItem } from '@/shared/api/generated/education/schemas/businessFieldUpdateItem'

const FIELD_CODE_TO_KEY: Record<string, EducationBusinessFieldKey> = {
  CAREER_EMPLOYMENT: 'career',
  ECONOMICS_FINANCE: 'economy',
  ENTREPRENEURSHIP: 'entrepreneurship',
  DIGITAL_LITERACY: 'digital_literacy',
}

export function fieldCodeToKey(code: string | undefined): EducationBusinessFieldKey | null {
  if (!code) return null
  return FIELD_CODE_TO_KEY[code] ?? null
}

export function mapBusinessFieldResponseToDomain(
  row: BusinessFieldResponse,
): EducationBusinessField | null {
  const key = fieldCodeToKey(row.fieldCode)
  if (!key || row.id == null) return null
  return {
    id: String(row.id),
    key,
    sortOrder: row.displayOrder ?? 1,
    isActive: Boolean(row.enabled),
    name: row.displayName ?? '',
    description: row.description ?? '',
    guideText: row.notice ?? '',
    updatedAt: row.updatedAt ?? '',
    version: row.version ?? 0,
  }
}

export function mapBusinessCatalogToDocument(
  res: BusinessCatalogResponse,
): EducationBusinessFieldDocument {
  const fields = (res.fields ?? [])
    .map(mapBusinessFieldResponseToDomain)
    .filter((row): row is EducationBusinessField => row != null)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  const intro: EducationBusinessFieldIntro = {
    mainText: res.introText ?? '',
    updatedAt: res.updatedAt ?? '',
    settingVersion: res.settingVersion ?? 0,
  }

  return { intro, fields }
}

export function toBusinessCatalogUpdateRequest(
  doc: EducationBusinessFieldDocument,
  input: {
    mainText?: string
    patches?: EducationBusinessFieldTextPatch[]
    orderedIds?: string[]
    activePatch?: { id: string; isActive: boolean }
  },
): BusinessCatalogUpdateRequest {
  const patchById = new Map((input.patches ?? []).map(p => [p.id, p]))
  let fields = [...doc.fields]

  if (input.orderedIds && input.orderedIds.length > 0) {
    const byId = new Map(fields.map(f => [f.id, f]))
    const ordered: EducationBusinessField[] = []
    for (const id of input.orderedIds) {
      const row = byId.get(id)
      if (row) {
        ordered.push(row)
        byId.delete(id)
      }
    }
    for (const row of byId.values()) ordered.push(row)
    fields = ordered.map((row, i) => ({ ...row, sortOrder: i + 1 }))
  }

  if (input.activePatch) {
    fields = fields.map(row =>
      row.id === input.activePatch!.id
        ? { ...row, isActive: input.activePatch!.isActive }
        : row,
    )
  }

  const items: BusinessFieldUpdateItem[] = fields.map(row => {
    const patch = patchById.get(row.id)
    return {
      id: Number(row.id),
      description: patch?.description ?? row.description,
      notice: patch?.guideText ?? row.guideText,
      enabled: row.isActive,
      displayOrder: row.sortOrder,
      version: row.version ?? 0,
    }
  })

  return {
    introText: input.mainText ?? doc.intro.mainText,
    settingVersion: doc.intro.settingVersion ?? 0,
    fields: items,
  }
}
