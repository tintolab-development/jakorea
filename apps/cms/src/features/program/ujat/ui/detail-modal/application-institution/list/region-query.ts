import { UJAT_INSTITUTION_EDUCATION_REGION_PARAM } from '@/features/program/ujat/lib/ujat-program-detail-url'
import {
  findUjatEducationRegionKeyByCode,
  getDefaultUjatEducationRegionKey,
  isUjatInstitutionApplicationRegionKey,
  type UjatInstitutionApplicationRegionKey,
} from './regions'
import { toUjatEducationRegionCode } from '@/features/program/ujat/api/ujat-education-region-code'

export function parseUjatInstitutionEducationRegionParam(
  raw: string | null | undefined
): UjatInstitutionApplicationRegionKey | null {
  const trimmed = raw?.trim()
  if (!trimmed) return null
  if (isUjatInstitutionApplicationRegionKey(trimmed)) return trimmed
  const fromCode = findUjatEducationRegionKeyByCode(trimmed)
  if (fromCode) return fromCode
  if (/^[a-z][a-z0-9_]*$/.test(trimmed)) return toUjatEducationRegionCode(trimmed)
  return null
}

export function resolveUjatInstitutionEducationRegionKey(
  searchParams: URLSearchParams
): UjatInstitutionApplicationRegionKey {
  return (
    parseUjatInstitutionEducationRegionParam(
      searchParams.get(UJAT_INSTITUTION_EDUCATION_REGION_PARAM)
    ) ?? getDefaultUjatEducationRegionKey()
  )
}

export function applyUjatInstitutionEducationRegionParam(
  next: URLSearchParams,
  regionKey: UjatInstitutionApplicationRegionKey
): void {
  next.set(UJAT_INSTITUTION_EDUCATION_REGION_PARAM, toUjatEducationRegionCode(regionKey))
}

export function clearUjatInstitutionEducationRegionParam(next: URLSearchParams): void {
  next.delete(UJAT_INSTITUTION_EDUCATION_REGION_PARAM)
}

export function shouldKeepUjatInstitutionEducationRegionParam(lnb: string): boolean {
  return lnb === 'institution_applications'
}
