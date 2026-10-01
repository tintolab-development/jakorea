import customInstance from '@/shared/api/orval-mutator'

const FILE_ID_RE =
  /\/api\/(?:admin|portal\/public)\/files\/(\d+)\/(?:content|download)/g

export function collectFileObjectIdsFromHtml(value: string): number[] {
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

const PROGRAM_INLINE_IMAGE_CONTENT_KEYS = new Set([
  'description',
  'programDescription',
  'recruitmentGuide',
  'applicationMethod',
  'learningSupportContent',
  'additionalContentHtml',
  'otherMatters',
  'otherNotes',
  'remarks',
])

function isProgramInlineImageContentKey(key: string | undefined): boolean {
  if (!key) return false
  const lastSegment = key.split('.').pop()
  return lastSegment != null && PROGRAM_INLINE_IMAGE_CONTENT_KEYS.has(lastSegment)
}

function parseJsonObject(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return undefined
  }
}

export function collectProgramInlineImageFileObjectIds(value: unknown): number[] {
  const seen = new Set<number>()
  const walk = (node: unknown, key?: string) => {
    if (typeof node === 'string') {
      if (isProgramInlineImageContentKey(key)) {
        for (const id of collectFileObjectIdsFromHtml(node)) seen.add(id)
        return
      }
      if (key === 'serviceDetailJson') {
        const parsed = parseJsonObject(node)
        if (parsed != null) walk(parsed)
      }
      return
    }
    if (Array.isArray(node)) {
      for (const item of node) walk(item)
      return
    }
    if (node && typeof node === 'object') {
      for (const [childKey, childValue] of Object.entries(node)) {
        walk(childValue, childKey)
      }
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
  const fileObjectIds = collectProgramInlineImageFileObjectIds(content)
  if (fileObjectIds.length === 0) return
  await putProgramInlineImages(programId, fileObjectIds)
}
