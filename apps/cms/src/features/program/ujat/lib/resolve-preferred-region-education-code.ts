import {
  findUjatEducationRegionKeyByCode,
  findUjatEducationRegionKeyByLabel,
} from '@/features/program/ujat/lib/ujat-education-regions'

export type PreferredRegionEducationOption = {
  key: string
  label: string
}

/**
 * 희망 교육 활동 지역 셀렉트 값(라벨 또는 regionKey) → PATCH `educationRegionCode`.
 * 매칭 실패 시 null (저장하지 않음).
 */
export function resolvePreferredRegionEducationCode(
  draft: string,
  regions: readonly PreferredRegionEducationOption[]
): string | null {
  const trimmed = draft.trim()
  if (!trimmed) return null

  const normalized = trimmed.toLowerCase()
  const fromOptionsKey = regions.find(row => row.key.toLowerCase() === normalized)
  if (fromOptionsKey) return fromOptionsKey.key

  const fromOptionsLabel = regions.find(row => row.label === trimmed)
  if (fromOptionsLabel) return fromOptionsLabel.key

  const fromCode = findUjatEducationRegionKeyByCode(trimmed)
  if (fromCode) return fromCode

  const fromLabel = findUjatEducationRegionKeyByLabel(trimmed)
  return fromLabel ?? null
}
