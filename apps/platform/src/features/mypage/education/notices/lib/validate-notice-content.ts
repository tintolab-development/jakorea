const IMAGE_TAG_RE = /<img\b[^>]*>/gi
const IMAGE_SRC_RE = /\bsrc\s*=\s*(['"])(.*?)\1/i
const FILE_OBJECT_SRC_RE = /^file-object:(\d+)$/

/** 회원 포털 안내사항 본문 이미지는 file-object 참조만 저장한다. */
export function collectNoticeInlineImageFileObjectIds(html: string): number[] | null {
  const ids: number[] = []
  const seen = new Set<number>()

  for (const match of html.matchAll(IMAGE_TAG_RE)) {
    const src = match[0].match(IMAGE_SRC_RE)?.[2]?.trim() ?? ''
    const id = Number(src.match(FILE_OBJECT_SRC_RE)?.[1])
    if (!Number.isSafeInteger(id) || id <= 0) return null
    if (!seen.has(id)) {
      seen.add(id)
      ids.push(id)
    }
  }

  return ids
}
