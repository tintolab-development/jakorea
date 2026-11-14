import {
  buildBulkDeleteGuideTitle,
  buildDeleteGuideOverflowHeadline,
  normalizeDeleteGuideEntityDisplayNames,
  objectParticleForLastKoreanWord,
} from '@/shared/ui/delete-guide-messages'

const SPONSOR_DELETE_IMPACT_LINE = '삭제 시 모든 정보가 삭제되며, 삭제된 정보는 되돌릴 수 없습니다.'

const SPONSOR_DELETE_HEADLINE_TAIL = ' 삭제하시겠습니까?'

/** 목록·상세 삭제 안내 카피 구분 (현재 목록·상세 문구 동일) */
export type SponsorDeleteMessagePreset = 'list' | 'detail'

/**
 * 후원사 단건·일괄 삭제 안내 본문.
 * 단건 `[이름]을/를 삭제하시겠습니까?` — 조사는 후원사명 마지막 음절 받침 기준.
 * 일괄 `[이름] 외 N개를 삭제하시겠습니까?`
 */
export function buildSponsorDeleteMessageLines(
  entityNames: string[],
  _preset: SponsorDeleteMessagePreset = 'detail'
): string[] {
  const trimmedNames = entityNames.map(name => name.trim()).filter(Boolean)
  const displayNames = normalizeDeleteGuideEntityDisplayNames(trimmedNames)
  if (displayNames.length === 0) return []

  const tail = [SPONSOR_DELETE_IMPACT_LINE]

  if (displayNames.length === 1) {
    const particle = objectParticleForLastKoreanWord(trimmedNames[0] ?? '')
    return [`[${displayNames[0]}]${particle}${SPONSOR_DELETE_HEADLINE_TAIL}`, ...tail]
  }

  return [
    buildDeleteGuideOverflowHeadline(
      displayNames[0],
      displayNames.length,
      `${objectParticleForLastKoreanWord('개')}${SPONSOR_DELETE_HEADLINE_TAIL}`
    ),
    ...tail,
  ]
}

export function resolveSponsorDeleteModalTitle(
  _preset: SponsorDeleteMessagePreset,
  entityNameCount: number
): string {
  return entityNameCount >= 2 ? buildBulkDeleteGuideTitle('후원사') : '후원사 삭제 안내'
}

/** 목록·상세 공통 확인 버튼 — 시안 「취소 · 삭제」 */
export function resolveSponsorDeleteModalConfirmText(_preset: SponsorDeleteMessagePreset): string {
  return '삭제'
}
