import customInstance from '@/shared/api/orval-mutator'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'

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

type PendingInlineImageBind = {
  programId: string
  fileObjectIds: number[]
}

let pendingInlineImageBind: PendingInlineImageBind | null = null

function inlineImageBindErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const data = (error as { response?: { data?: { error?: { code?: string; message?: string } } } })
      .response?.data?.error
    const code = data?.code?.trim()
    const message = data?.message?.trim()
    if (code && message) return `${message} (${code})`
    if (message) return message
    if (code) return code
  }
  if (error instanceof Error && error.message.trim()) return error.message
  return '본문 이미지 연결에 실패했습니다.'
}

async function retryPendingProgramInlineImageBind(): Promise<void> {
  const pending = pendingInlineImageBind
  if (pending == null) return
  try {
    await putProgramInlineImages(pending.programId, pending.fileObjectIds)
    pendingInlineImageBind = null
    cmsAlertModal.show({
      title: '이미지 연결',
      content: '본문 이미지 연결을 완료했습니다.',
    })
  } catch (error) {
    showProgramInlineImageBindFailureAlert(pending.programId, pending.fileObjectIds, error)
  }
}

export function showProgramInlineImageBindFailureAlert(
  programId: string | number,
  fileObjectIds: number[],
  error: unknown
): void {
  pendingInlineImageBind = {
    programId: String(programId),
    fileObjectIds: [...fileObjectIds],
  }
  cmsAlertModal.show({
    title: '이미지 연결 실패',
    content: `프로그램은 저장되었지만 본문 이미지를 연결하지 못했습니다.\n${inlineImageBindErrorMessage(error)}\n다시 시도하거나, 프로그램 상세에서 이미지를 다시 저장하세요.`,
    confirmLabel: '다시 시도',
    onConfirm: () => {
      void retryPendingProgramInlineImageBind()
    },
  })
}

/** CREATE 직후 바인딩 실패 시 프로그램을 지우지 않고 안내·재시도만 한다. */
export async function syncProgramInlineImagesKeepProgram(
  programId: string | number,
  content: unknown
): Promise<'ok' | 'skipped' | 'failed'> {
  const fileObjectIds = collectProgramInlineImageFileObjectIds(content)
  if (fileObjectIds.length === 0) return 'skipped'
  try {
    await putProgramInlineImages(programId, fileObjectIds)
    return 'ok'
  } catch (error) {
    showProgramInlineImageBindFailureAlert(programId, fileObjectIds, error)
    return 'failed'
  }
}
