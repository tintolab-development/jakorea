import type { JaKoreaBi } from '@/entities/ja-korea-bi/model/types'
import type { BiResponse } from '@/shared/api/generated/ja-korea/schemas/biResponse'
import type { BiUpdateRequest } from '@/shared/api/generated/ja-korea/schemas/biUpdateRequest'

export function mapBiResponseToDomain(row: BiResponse): JaKoreaBi {
  return {
    title: row.title ?? '',
    mainText: row.mainText ?? '',
    subText: row.subText ?? '',
    updatedAt: row.updatedAt ?? '',
    version: row.version ?? 0,
  }
}

export function toBiUpdateRequest(data: JaKoreaBi): BiUpdateRequest {
  return {
    title: data.title.trimEnd() || undefined,
    mainText: data.mainText.trimEnd() || undefined,
    subText: data.subText.trimEnd() || undefined,
    version: data.version,
  }
}
