import {
  buildBulkDeleteGuideTitle,
  buildDeleteGuideOverflowHeadline,
  normalizeDeleteGuideEntityDisplayNames,
} from '@/shared/ui/delete-guide-messages'

const SPONSOR_DELETE_IMPACT_LINE = '삭제 시 모든 정보가 삭제되며, 삭제된 정보는 되돌릴 수 없습니다.'

/** 목록·상세 삭제 안내 카피 구분 */
export type SponsorDeleteMessagePreset = 'list' | 'detail'

function resolveHeadlineSuffix(preset: SponsorDeleteMessagePreset): string {
  return preset === 'list' ? '를 삭제하시겠습니까?' : '를 후원사에서 삭제하시겠습니까?'
}

/** 후원사 단건·일괄 삭제 안내 본문 */
export function buildSponsorDeleteMessageLines(
  entityNames: string[],
  preset: SponsorDeleteMessagePreset = 'detail'
): string[] {
  const displayNames = normalizeDeleteGuideEntityDisplayNames(entityNames)
  if (displayNames.length === 0) return []

  const suffix = resolveHeadlineSuffix(preset)
  const tail = [SPONSOR_DELETE_IMPACT_LINE]

  if (displayNames.length === 1) {
    return [`[${displayNames[0]}]${suffix}`, ...tail]
  }

  return [
    buildDeleteGuideOverflowHeadline(displayNames[0], displayNames.length, suffix),
    ...tail,
  ]
}

export function resolveSponsorDeleteModalTitle(
  preset: SponsorDeleteMessagePreset,
  entityNameCount: number
): string {
  const isBulk = entityNameCount >= 2
  if (preset === 'list') {
    return isBulk ? buildBulkDeleteGuideTitle('후원사') : '후원사 삭제 안내'
  }
  return isBulk ? buildBulkDeleteGuideTitle('후원사') : '후원사 삭제 안내'
}

export function resolveSponsorDeleteModalConfirmText(
  preset: SponsorDeleteMessagePreset
): string {
  return preset === 'list' ? '삭제' : '후원사 삭제'
}
