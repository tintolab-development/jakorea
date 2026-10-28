/** 서버 `RichTextContentLimitPolicy.visibleLength` 와 같은 보이는 글자 수. */
export const RICH_TEXT_MAX_VISIBLE_CHARACTERS = 50_000
export const RICH_TEXT_VISIBLE_LENGTH_MESSAGE = '본문은 최대 50,000자까지 입력할 수 있습니다.'
export const RICH_TEXT_INLINE_IMAGE_MAX_BYTES = 20 * 1024 * 1024
export const RICH_TEXT_INLINE_IMAGE_SIZE_MESSAGE =
  '파일은 1개당 최대 20MB까지 첨부할 수 있습니다.'
export const RICH_TEXT_INLINE_IMAGE_TOTAL_MESSAGE =
  '한 번에 첨부할 수 있는 전체 용량은 최대 100MB입니다.'
export const RICH_TEXT_INLINE_IMAGE_COUNT_MESSAGE = '파일은 최대 10개까지 첨부할 수 있습니다.'

const HTML_COMMENT = /<!--[\s\S]*?-->/g
const HTML_TAG = /<[^>]*>/g
const CHARACTER_ENTITY = /&(?:#[xX][0-9a-fA-F]{1,6}|#[0-9]{1,7}|[A-Za-z][A-Za-z0-9]{1,31});/g
const INLINE_FILE_REFERENCE =
  /\/api\/(?:admin|portal\/public)\/files\/([0-9]{1,18})\/content|file-object:([0-9]{1,18})/g

export function countVisibleRichTextCharacters(content: string | null | undefined): number {
  if (content == null || content.length === 0) return 0
  const text = content.replace(HTML_COMMENT, '').replace(HTML_TAG, '').replace(CHARACTER_ENTITY, 'x')
  let count = 0
  for (const char of text) {
    const codePoint = char.codePointAt(0) ?? 0
    if (codePoint !== 0x0d && codePoint !== 0x0a) count += 1
  }
  return count
}

/** 저장된 파일 참조만. 외부 URL은 합산하지 않는다. */
export function referencedInlineFileIds(content: string | null | undefined): number[] {
  if (content == null || content.length === 0) return []
  const ids: number[] = []
  const seen = new Set<number>()
  for (const match of content.matchAll(INLINE_FILE_REFERENCE)) {
    const raw = match[1] ?? match[2]
    const id = Number(raw)
    if (!Number.isSafeInteger(id) || seen.has(id)) continue
    seen.add(id)
    ids.push(id)
  }
  return ids
}
