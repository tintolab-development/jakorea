/**
 * UJAT 교육 지역명 — 정규화·중복 판별
 * 사용/미사용 모두 포함해 동일 이름( trim 후 완전 일치 ) 등록·수정을 막는다.
 */

import type { UjatEducationRegion } from '@/features/program/ujat/model/education-region.types'

export const UJAT_EDUCATION_REGION_DUPLICATE_NAME_MESSAGE =
  '이미 등록된 교육 지역명입니다.' as const

export class UjatEducationRegionDuplicateNameError extends Error {
  readonly code = 'duplicate_name' as const

  constructor(message = UJAT_EDUCATION_REGION_DUPLICATE_NAME_MESSAGE) {
    super(message)
    this.name = 'UjatEducationRegionDuplicateNameError'
  }
}

export function isUjatEducationRegionDuplicateNameError(
  error: unknown
): error is UjatEducationRegionDuplicateNameError {
  return (
    error instanceof UjatEducationRegionDuplicateNameError ||
    (typeof error === 'object' &&
      error != null &&
      'code' in error &&
      (error as { code: unknown }).code === 'duplicate_name')
  )
}

export function normalizeUjatEducationRegionName(name: string): string {
  return name.trim()
}

export function isUjatEducationRegionNameTaken(
  regions: readonly UjatEducationRegion[],
  name: string,
  options?: { excludeId?: string }
): boolean {
  const normalized = normalizeUjatEducationRegionName(name)
  if (!normalized) return false
  return regions.some(
    row =>
      row.id !== options?.excludeId &&
      normalizeUjatEducationRegionName(row.name) === normalized
  )
}

export function assertUjatEducationRegionNameAvailable(
  regions: readonly UjatEducationRegion[],
  name: string,
  options?: { excludeId?: string }
): void {
  if (isUjatEducationRegionNameTaken(regions, name, options)) {
    throw new UjatEducationRegionDuplicateNameError()
  }
}
