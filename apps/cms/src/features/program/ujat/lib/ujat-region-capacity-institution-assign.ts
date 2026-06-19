import { getUjatEducationRegionLabel } from '@/features/program/ujat/lib/ujat-education-regions'
import { resolveUjatRegionCapacitySemesterValues } from '@/features/program/ujat/lib/ujat-region-capacity-display'
import type {
  UjatRegionCapacityRegionName,
  UjatRegionCapacitySemesterKey,
} from '@/features/program/ujat/lib/ujat-region-capacity-types'
import type { UjatInstitutionApplicationRegionKey } from '@/features/program/ujat/ui/detail-modal/application-institution/list/regions'
import type { UjatInstitutionApplicationRow } from '@/features/program/ujat/ui/detail-modal/application-institution/list/types'

function parseMaxClassCount(value: string | undefined): number | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  const parsed = Number.parseInt(trimmed, 10)
  return Number.isFinite(parsed) ? parsed : null
}

export function sumUjatRegionAssignedClassCount(
  rows: UjatInstitutionApplicationRow[],
  regionKey: UjatInstitutionApplicationRegionKey,
  options?: { onlyTempAssigned?: boolean }
): number {
  return rows
    .filter(row => {
      if (row.regionKey !== regionKey) return false
      if (options?.onlyTempAssigned && row.tempAssignmentStatus !== 'temp_assigned') return false
      return true
    })
    .reduce((sum, row) => sum + row.totalClassCount, 0)
}

export function checkUjatRegionClassCapacityExceeded(args: {
  regionKey: UjatInstitutionApplicationRegionKey
  rowsAfterAssign: UjatInstitutionApplicationRow[]
  half?: UjatRegionCapacitySemesterKey
}): {
  exceeded: boolean
  regionLabel: UjatRegionCapacityRegionName
  maxClassCount: number | null
  totalAfterAssign: number
} {
  const half = args.half ?? 'h1'
  const regionLabel = getUjatEducationRegionLabel(args.regionKey, args.regionKey)
  const capacityValues = resolveUjatRegionCapacitySemesterValues(half)
  const maxClassCount = parseMaxClassCount(capacityValues[regionLabel]?.classCount)
  const totalAfterAssign = sumUjatRegionAssignedClassCount(args.rowsAfterAssign, args.regionKey, {
    onlyTempAssigned: true,
  })
  const exceeded = maxClassCount != null && totalAfterAssign > maxClassCount

  return {
    exceeded,
    regionLabel,
    maxClassCount,
    totalAfterAssign,
  }
}

export function getUjatRegionClassCapacityExceededAlertContent(args: {
  regionLabel: UjatRegionCapacityRegionName
  maxClassCount: number
  totalAfterAssign: number
}): string {
  return `${args.regionLabel} 지역 최대 학급 수(${args.maxClassCount}개)를 초과합니다. (배정 후 합계: ${args.totalAfterAssign}개 학급)\n배정은 완료되었으나 확인이 필요합니다.`
}
