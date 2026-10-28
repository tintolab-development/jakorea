import { fileObjectIdFromStoredFileUrl } from '@/shared/lib/portal-public-file-url'

const IMAGE_TAG_RE = /<img\b[^>]*>/gi
const IMAGE_SRC_RE = /\bsrc\s*=\s*(['"])(.*?)\1/i
const IMAGE_PERSIST_SRC_RE = /\bdata-persist-src\s*=\s*(['"])(.*?)\1/i

/** 회원 포털 안내사항 본문 이미지는 file-object 참조만 저장한다. */
export function collectNoticeInlineImageFileObjectIds(html: string): number[] | null {
  const ids: number[] = []
  const seen = new Set<number>()

  for (const match of html.matchAll(IMAGE_TAG_RE)) {
    const imageTag = match[0]
    // 편집 직후에는 data-persist-src가 canonical token이고, 재조회된
    // 본문은 src에 file-object 또는 저장 파일 URL이 들어올 수 있다.
    const src =
      imageTag.match(IMAGE_PERSIST_SRC_RE)?.[2]?.trim() ??
      imageTag.match(IMAGE_SRC_RE)?.[2]?.trim() ??
      ''
    const id = fileObjectIdFromStoredFileUrl(src)
    if (id == null) return null
    if (!seen.has(id)) {
      seen.add(id)
      ids.push(id)
    }
  }

  return ids
}
