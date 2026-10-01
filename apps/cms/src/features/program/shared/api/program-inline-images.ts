import customInstance from '@/shared/api/orval-mutator'

const FILE_ID_RE =
  /\/api\/(?:admin|portal\/public)\/files\/(\d+)\/(?:content|download)/g

const IMAGE_MARKUP_RE = /<img\b|!\[[^\]]*\]\(/i

export function collectFileObjectIdsFromHtml(value: string): number[] {
  // 썸네일·첨부 content URL은 본문 이미지가 아니다. 그대로 바인딩하면 PURPOSE_MISMATCH.
  if (!IMAGE_MARKUP_RE.test(value)) return []
  const ids: number[] = []
  const seen = new Set<number>()
  FILE_ID_RE.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = FILE_ID_RE.exec(value))) {
    const id = Number(match[1])
    if (!Number.isInteger(id) || id < 1 || seen.has(id)) continue
    seen.add(id)
    ids.push(id)
  }
  return ids
}

export function collectFileObjectIdsFromUnknown(value: unknown): number[] {
  const seen = new Set<number>()
  const walk = (node: unknown) => {
    if (typeof node === 'string') {
      for (const id of collectFileObjectIdsFromHtml(node)) seen.add(id)
      return
    }
    if (Array.isArray(node)) {
      for (const item of node) walk(item)
      return
    }
    if (node && typeof node === 'object') {
      for (const item of Object.values(node)) walk(item)
    }
  }
  walk(value)
  return [...seen]
}

/** PUT /api/admin/programs/{programId}/inline-images — 공개 content 바인딩 */
export async function putProgramInlineImages(
  programId: string | number,
  fileObjectIds: number[]
): Promise<void> {
  await customInstance({
    url: `/api/admin/programs/${encodeURIComponent(String(programId))}/inline-images`,
    method: 'PUT',
    data: { fileObjectIds },
  })
}

export async function syncProgramInlineImages(
  programId: string | number,
  content: unknown
): Promise<void> {
  const fileObjectIds = collectFileObjectIdsFromUnknown(content)
  if (fileObjectIds.length === 0) return
  await putProgramInlineImages(programId, fileObjectIds)
}
