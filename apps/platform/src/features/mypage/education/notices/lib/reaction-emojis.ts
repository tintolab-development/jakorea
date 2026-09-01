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

export function getPlatformReactionEmojiIndex(emojiType: string): number | null {
  const index = (PLATFORM_REACTION_EMOJI_TYPES as readonly string[]).indexOf(emojiType)
  return index >= 0 ? index : null
}
