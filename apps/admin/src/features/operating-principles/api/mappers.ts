import type {
  OperatingPrinciple,
  OperatingPrinciplesDoc,
  PrincipleIconKey,
} from '@/entities/operating-principles/model/types'
import type { PrincipleManagementResponse } from '@/shared/api/generated/ja-korea/schemas/principleManagementResponse'
import type { PrincipleResponse } from '@/shared/api/generated/ja-korea/schemas/principleResponse'
import type { PrincipleUpdateItem } from '@/shared/api/generated/ja-korea/schemas/principleUpdateItem'
import type { PrincipleUpdateRequest } from '@/shared/api/generated/ja-korea/schemas/principleUpdateRequest'

const ICON_BY_ID: Record<number, PrincipleIconKey> = {
  1: 'p1',
  2: 'p2',
  3: 'p3',
  4: 'p4',
  5: 'p5',
}

export function principleIdFromNumeric(id: number): string {
  return `operating-principle-p${id}`
}

export function numericIdFromPrincipleId(id: string): number {
  const match = /^operating-principle-p([1-5])$/.exec(id)
  if (match) return Number(match[1])
  const asNum = Number(id)
  if (asNum >= 1 && asNum <= 5) return asNum
  throw new Error(`Invalid operating principle id: ${id}`)
}

function iconKeyFromResponse(row: PrincipleResponse): PrincipleIconKey {
  if (row.id != null && ICON_BY_ID[row.id]) return ICON_BY_ID[row.id]!
  const fromCode = row.iconCode?.match(/TRANSPARENCY_PRINCIPLE_([1-5])/)
  if (fromCode) return `p${fromCode[1]}` as PrincipleIconKey
  throw new Error(`Unknown principle icon for id=${row.id ?? '?'}`)
}

export function mapPrincipleResponseToDomain(row: PrincipleResponse): OperatingPrinciple {
  const numericId = row.id
  if (numericId == null) {
    throw new Error('PrincipleResponse.id is required')
  }
  const iconKey = iconKeyFromResponse(row)
  return {
    id: principleIdFromNumeric(numericId),
    iconKey,
    sortOrder: row.displayOrder ?? numericId,
    isActive: Boolean(row.enabled),
    title: row.title ?? '',
    subText: row.subText ?? '',
    version: row.version ?? 0,
    updatedAt: '',
  }
}

export function mapPrincipleManagementToDomain(
  response: PrincipleManagementResponse,
): OperatingPrinciplesDoc {
  const principles = (response.items ?? [])
    .map(mapPrincipleResponseToDomain)
    .sort((a, b) => a.sortOrder - b.sortOrder)
  return {
    intro: {
      topSubText: response.introSubText ?? '',
      mainText: response.introMainText ?? '',
    },
    settingVersion: response.settingVersion ?? 0,
    principles,
    updatedAt: '',
  }
}

export function toPrincipleUpdateItem(
  row: OperatingPrinciple,
  displayOrder: number,
): PrincipleUpdateItem {
  return {
    id: numericIdFromPrincipleId(row.id),
    enabled: row.isActive,
    title: row.title.trim() || undefined,
    subText: row.subText.trim() || undefined,
    displayOrder,
    version: row.version,
  }
}

export function toPrincipleUpdateRequest(doc: OperatingPrinciplesDoc): PrincipleUpdateRequest {
  if (doc.principles.length !== 5) {
    throw new Error(`Principles update requires exactly 5 items, got ${doc.principles.length}`)
  }
  return {
    introSubText: doc.intro.topSubText.trim() || undefined,
    introMainText: doc.intro.mainText.trim() || undefined,
    settingVersion: doc.settingVersion,
    items: doc.principles.map((row, index) => toPrincipleUpdateItem(row, index + 1)),
  }
}
