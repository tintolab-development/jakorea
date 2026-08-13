import type {
  GlobalValue,
  GlobalValueKey,
} from '@/entities/global-value/model/types'
import type { GlobalValueBulkRequest } from '@/shared/api/generated/ja-korea/schemas/globalValueBulkRequest'
import type { GlobalValueResponse } from '@/shared/api/generated/ja-korea/schemas/globalValueResponse'

const ITEM_CODE_TO_KEY: Record<string, GlobalValueKey> = {
  VALUE_1: 'value_1',
  VALUE_2: 'value_2',
  VALUE_3: 'value_3',
  VALUE_4: 'value_4',
  VALUE_5: 'value_5',
}

export function mapGlobalValueResponseToDomain(row: GlobalValueResponse): GlobalValue {
  const key = (row.itemCode && ITEM_CODE_TO_KEY[row.itemCode]) || 'value_1'
  const id = row.id != null ? String(row.id) : `global-value-${key}`
  return {
    id,
    key,
    sortOrder: row.displayOrder ?? 0,
    isActive: Boolean(row.enabled),
    mainText: row.mainText ?? '',
    subText: row.subText ?? '',
    iconKey: key,
    updatedAt: row.updatedAt ?? '',
    version: row.version ?? 0,
  }
}

export function toGlobalValueBulkRequest(rows: GlobalValue[]): GlobalValueBulkRequest {
  return {
    items: rows.map(row => ({
      id: Number(row.id),
      mainText: row.mainText.trim() || undefined,
      subText: row.subText.trim() || undefined,
      enabled: row.isActive,
      displayOrder: row.sortOrder,
      version: row.version,
    })),
  }
}
