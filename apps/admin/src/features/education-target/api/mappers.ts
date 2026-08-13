/**
 * 교육 대상 — OpenAPI ↔ 도메인 매핑
 */

import type {
  EducationTarget,
  EducationTargetKey,
  EducationTargetNamePatch,
} from '@/entities/education-target/model/types'
import { EDUCATION_TARGET_INDEX_COLORS } from '@/entities/education-target/model/types'
import type { TargetBulkUpdateRequest } from '@/shared/api/generated/education/schemas/targetBulkUpdateRequest'
import type { TargetResponse } from '@/shared/api/generated/education/schemas/targetResponse'

const TARGET_CODE_TO_KEY: Record<string, EducationTargetKey> = {
  PRESCHOOL: 'preschool',
  ELEMENTARY: 'elementary',
  MIDDLE_SCHOOL: 'middle',
  HIGH_SCHOOL: 'high',
  ADULT: 'adult',
}

export function mapTargetResponseToDomain(row: TargetResponse): EducationTarget | null {
  const key = row.targetCode ? TARGET_CODE_TO_KEY[row.targetCode] : null
  if (!key || row.id == null) return null
  const sortOrder = row.displayOrder ?? 1
  const colorIndex = Math.max(0, Math.min(4, sortOrder - 1))
  return {
    id: String(row.id),
    key,
    sortOrder,
    name: row.targetName ?? '',
    indexColor: row.colorHex ?? EDUCATION_TARGET_INDEX_COLORS[colorIndex]!,
    updatedAt: row.updatedAt ?? '',
    version: row.version ?? 0,
  }
}

export function toTargetBulkUpdateRequest(
  current: EducationTarget[],
  patches: EducationTargetNamePatch[],
): TargetBulkUpdateRequest {
  const patchById = new Map(patches.map(p => [p.id, p]))
  return {
    items: current.map(row => {
      const patch = patchById.get(row.id)
      return {
        id: Number(row.id),
        targetName: (patch?.name ?? row.name).trim() || row.name,
        version: row.version ?? 0,
      }
    }),
  }
}
