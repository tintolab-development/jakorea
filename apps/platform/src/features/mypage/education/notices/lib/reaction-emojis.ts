import { getReactionEmojiItemByType, type ReactionEmojiItem } from '@jakorea/ui'

/** 사용자 홈페이지 안내사항 반응 — 스크린샷 6종 순서 */
export const PLATFORM_REACTION_EMOJI_TYPES = [
  'smile',
  'laugh',
  'heart',
  'clap',
  'check',
  'scream',
] as const

export type PlatformReactionEmojiType = (typeof PLATFORM_REACTION_EMOJI_TYPES)[number]

export const PLATFORM_REACTION_EMOJI_ITEMS: readonly ReactionEmojiItem[] =
  PLATFORM_REACTION_EMOJI_TYPES.map(type => getReactionEmojiItemByType(type)).filter(
    (item): item is ReactionEmojiItem => item != null,
  )

export function getPlatformReactionEmojiTypeForIndex(index: number): string | undefined {
  if (!Number.isInteger(index) || index < 0 || index >= PLATFORM_REACTION_EMOJI_TYPES.length) {
    return undefined
  }
  return PLATFORM_REACTION_EMOJI_TYPES[index]
}

/** BE 정규화 값(`SMILE`)도 받는다 — 6종은 모두 한 단어라 소문자 비교로 충분 */
export function getPlatformReactionEmojiIndex(emojiType: string): number | null {
  const normalized = emojiType.trim().toLowerCase()
  const index = (PLATFORM_REACTION_EMOJI_TYPES as readonly string[]).indexOf(normalized)
  return index >= 0 ? index : null
}
