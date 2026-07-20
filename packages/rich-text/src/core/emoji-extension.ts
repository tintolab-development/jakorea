import Emoji, { emojis, type EmojiItem } from '@tiptap/extension-emoji'
import { EMOJI_QUICK_PICK_NAMES } from './toolbar-constants'

export { emojis, type EmojiItem }

/** Markdown 직렬화 포함 Emoji extension */
export const RichTextEmoji = Emoji.configure({
  emojis,
  enableEmoticons: true,
  forceFallbackImages: false,
}).extend({
  renderMarkdown: (node, _helpers) => {
    const name = (node.attrs as { name?: string } | undefined)?.name ?? ''
    const item = emojis.find(emoji => emoji.name === name)
    if (item?.emoji) {
      return item.emoji
    }
    if (name) {
      return `:${name}:`
    }
    return ''
  },
})

export function findEmojiByName(name: string): EmojiItem | undefined {
  return emojis.find(emoji => emoji.name === name)
}

export function filterEmojis(query: string, limit = 48): EmojiItem[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return emojis.slice(0, limit)
  }
  return emojis
    .filter(emoji => {
      if (emoji.name.includes(normalized)) return true
      if (emoji.shortcodes?.some(code => code.includes(normalized))) return true
      if (emoji.tags?.some(tag => tag.includes(normalized))) return true
      return false
    })
    .slice(0, limit)
}

export function getEmojiQuickPickItems(): EmojiItem[] {
  return EMOJI_QUICK_PICK_NAMES.map(name => findEmojiByName(name)).filter(
    (item): item is EmojiItem => item != null
  )
}
