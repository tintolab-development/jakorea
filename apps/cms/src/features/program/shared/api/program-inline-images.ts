import customInstance from '@/shared/api/orval-mutator'
import {
  programInlineImageOwner,
  takeProgramInlineImageDraft,
} from '@/shared/lib/admin-file-upload/inline-image'
import { uploadAdminFileMaybeMock } from '@/shared/lib/admin-file-upload/upload-maybe-mock'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'

const FILE_ID_RE =
  /\/api\/(?:admin|portal\/public)\/files\/(\d+)\/(?:content|download)|file-object:(\d+)/g

const IMAGE_MARKUP_RE = /<img\b|!\[[^\]]*\]\(/i

const INLINE_IMAGE_HTML_PATCH_KEYS = [
  'description',
  'recruitmentGuide',
  'applicationMethod',
  'learningSupportContent',
  'additionalContentHtml',
  'otherMatters',
  'remarks',
  'serviceDetailJson',
] as const

const RECRUITMENT_INLINE_IMAGE_HTML_KEYS = [
  'programDescription',
  'recruitmentGuide',
  'applicationMethod',
  'learningSupportContent',
  'additionalContentHtml',
  'otherMatters',
  'remarks',
] as const

const INLINE_IMAGE_BIND_ERROR_RE =
  /INLINE_IMAGE|PURPOSE_MISMATCH|FILE_OWNER_MISMATCH|PUBLIC_FILE_NOT_FOUND/i

export function collectFileObjectIdsFromHtml(value: string): number[] {
  // 썸네일·첨부 content URL은 본문 이미지가 아니다. 그대로 바인딩하면 PURPOSE_MISMATCH.
  if (!IMAGE_MARKUP_RE.test(value)) return []
  const ids: number[] = []
  const seen = new Set<number>()
  FILE_ID_RE.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = FILE_ID_RE.exec(value))) {
    const id = Number(match[1] ?? match[2])
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
  'additionalContentMarkdown',
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

function replaceFileObjectIdsInString(value: string, idMap: Map<number, number>): string {
  FILE_ID_RE.lastIndex = 0
  return value.replace(FILE_ID_RE, (full, contentId, tokenId) => {
    const id = Number(contentId ?? tokenId)
    const next = idMap.get(id)
    if (next == null) return full
    return full.replace(String(id), String(next))
  })
}

export function rewriteFileObjectIdsInUnknown(
  value: unknown,
  idMap: Map<number, number>
): unknown {
  if (idMap.size === 0) return value
  if (typeof value === 'string') {
    const parsed = parseJsonObject(value)
    if (parsed != null && (value.startsWith('{') || value.startsWith('['))) {
      return JSON.stringify(rewriteFileObjectIdsInUnknown(parsed, idMap))
    }
    return replaceFileObjectIdsInString(value, idMap)
  }
  if (Array.isArray(value)) {
    return value.map(item => rewriteFileObjectIdsInUnknown(item, idMap))
  }
  if (value && typeof value === 'object') {
    const next: Record<string, unknown> = {}
    for (const [key, child] of Object.entries(value)) {
      next[key] = rewriteFileObjectIdsInUnknown(child, idMap)
    }
    return next
  }
  return value
}

function firstPayloadRecord(content: unknown): Record<string, unknown> | null {
  if (Array.isArray(content)) {
    for (const item of content) {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        return item as Record<string, unknown>
      }
    }
    return null
  }
  if (content && typeof content === 'object') return content as Record<string, unknown>
  return null
}

function valueHasInlineImages(value: unknown): boolean {
  if (typeof value === 'string') {
    if (IMAGE_MARKUP_RE.test(value) && collectFileObjectIdsFromHtml(value).length > 0) {
      return true
    }
    if (value.startsWith('{') || value.startsWith('[')) {
      return collectProgramInlineImageFileObjectIds({ serviceDetailJson: value }).length > 0
    }
    return false
  }
  return collectProgramInlineImageFileObjectIds(value).length > 0
}

function pickRecordInlineImageHtmlPatch(
  record: Record<string, unknown>,
  keys: readonly string[]
): Record<string, unknown> {
  const patch: Record<string, unknown> = {}
  for (const key of keys) {
    if (record[key] === undefined) continue
    if (!valueHasInlineImages(record[key])) continue
    patch[key] = record[key]
  }
  return patch
}

export function pickProgramInlineImageHtmlPatch(content: unknown): Record<string, unknown> {
  const record = firstPayloadRecord(content)
  if (record == null) return {}
  return pickRecordInlineImageHtmlPatch(record, INLINE_IMAGE_HTML_PATCH_KEYS)
}

function recruitmentNumericId(row: Record<string, unknown>): number | null {
  const id = Number(row.id)
  if (!Number.isInteger(id) || id < 1) return null
  return id
}

function recruitmentMatchKey(row: Record<string, unknown>): string {
  return [String(row.applicationType ?? ''), String(row.recruitTerm ?? ''), String(row.recruitmentType ?? '')].join(
    '|'
  )
}

function collectRecruitmentRows(content: unknown): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = []
  const visit = (node: unknown) => {
    if (Array.isArray(node)) {
      for (const item of node) visit(item)
      return
    }
    if (node && typeof node === 'object') {
      const rec = node as Record<string, unknown>
      if (Array.isArray(rec.recruitments)) {
        for (const row of rec.recruitments) {
          if (row && typeof row === 'object' && !Array.isArray(row)) {
            rows.push(row as Record<string, unknown>)
          }
        }
      }
    }
  }
  visit(content)
  return rows
}

function pickRecruitmentInlineImagePatches(
  content: unknown
): Array<{ recruitmentId: number; patch: Record<string, unknown> }> {
  const rows = collectRecruitmentRows(content)
  const idsByKey = new Map<string, number[]>()
  for (const row of rows) {
    const id = recruitmentNumericId(row)
    if (id == null) continue
    const key = recruitmentMatchKey(row)
    const list = idsByKey.get(key) ?? []
    list.push(id)
    idsByKey.set(key, list)
  }
  const byId = new Map<number, Record<string, unknown>>()
  for (const row of rows) {
    const patch = pickRecordInlineImageHtmlPatch(row, RECRUITMENT_INLINE_IMAGE_HTML_KEYS)
    if (Object.keys(patch).length === 0) continue
    const id = recruitmentNumericId(row) ?? idsByKey.get(recruitmentMatchKey(row))?.shift()
    if (id == null || byId.has(id)) continue
    byId.set(id, patch)
  }
  return [...byId.entries()].map(([recruitmentId, patch]) => ({ recruitmentId, patch }))
}

function parseProgramNumericId(programId: string | number): number | null {
  const numericId = typeof programId === 'number' ? programId : Number(programId)
  if (!Number.isFinite(numericId) || numericId < 1) return null
  return numericId
}

function unwrapApiData(payload: unknown): unknown {
  if (payload != null && typeof payload === 'object') {
    const body = payload as Record<string, unknown>
    if (body.success === true && 'data' in body) {
      return unwrapApiData(body.data)
    }
  }
  return payload
}

function uniqueFileObjectIds(...groups: number[][]): number[] {
  const seen = new Set<number>()
  const out: number[] = []
  for (const group of groups) {
    for (const id of group) {
      if (!Number.isInteger(id) || id < 1 || seen.has(id)) continue
      seen.add(id)
      out.push(id)
    }
  }
  return out
}

/** PATCH 본문에 없는 모집 행 HTML 이미지가 PUT에서 빠지지 않게 현재 프로그램을 한 번 더 읽는다. */
async function fetchCurrentProgramInlineImageFileObjectIds(
  programId: string | number
): Promise<number[]> {
  try {
    const payload = await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(String(programId))}`,
      method: 'GET',
    })
    return collectProgramInlineImageFileObjectIds(unwrapApiData(payload))
  } catch {
    return []
  }
}

async function resolveProgramInlineImageBindIds(
  programId: string | number,
  contentIds: number[]
): Promise<number[]> {
  const currentIds = await fetchCurrentProgramInlineImageFileObjectIds(programId)
  return uniqueFileObjectIds(currentIds, contentIds)
}

export async function prepareProgramInlineImageBind(
  programId: string | number,
  content: unknown
): Promise<{ rewritten: unknown; fileObjectIds: number[]; didAdopt: boolean }> {
  const collected = collectProgramInlineImageFileObjectIds(content)
  if (collected.length === 0) {
    return { rewritten: content, fileObjectIds: [], didAdopt: false }
  }
  const numericId = parseProgramNumericId(programId)
  if (numericId == null) {
    return { rewritten: content, fileObjectIds: collected, didAdopt: false }
  }
  const idMap = new Map<number, number>()
  for (const id of collected) {
    const file = takeProgramInlineImageDraft(id)
    if (file == null) continue
    const uploaded = await uploadAdminFileMaybeMock({
      file,
      owner: programInlineImageOwner(numericId),
      waitUntilAvailable: true,
    })
    idMap.set(id, uploaded.fileObjectId)
  }
  if (idMap.size === 0) {
    return { rewritten: content, fileObjectIds: collected, didAdopt: false }
  }
  const rewritten = rewriteFileObjectIdsInUnknown(content, idMap)
  const fileObjectIds = [...new Set(collected.map(id => idMap.get(id) ?? id))]
  return { rewritten, fileObjectIds, didAdopt: true }
}

async function persistRewrittenProgramInlineImageHtml(
  programId: string | number,
  rewritten: unknown
): Promise<void> {
  const patch = pickProgramInlineImageHtmlPatch(rewritten)
  if (Object.keys(patch).length > 0) {
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(String(programId))}`,
      method: 'PATCH',
      data: patch,
    })
  }
  for (const row of pickRecruitmentInlineImagePatches(rewritten)) {
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(String(programId))}/recruitments/${row.recruitmentId}`,
      method: 'PATCH',
      data: row.patch,
    })
  }
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
  content: unknown,
  persistRewritten?: (rewritten: unknown) => Promise<void>
): Promise<void> {
  const { rewritten, fileObjectIds: preparedIds, didAdopt } = await prepareProgramInlineImageBind(
    programId,
    content
  )
  if (didAdopt) {
    if (persistRewritten) await persistRewritten(rewritten)
    else await persistRewrittenProgramInlineImageHtml(programId, rewritten)
  }
  if (preparedIds.length === 0) return
  const fileObjectIds = await resolveProgramInlineImageBindIds(programId, preparedIds)
  if (fileObjectIds.length === 0) return
  await putProgramInlineImages(programId, fileObjectIds)
}

type PendingInlineImageBind = {
  programId: string
  fileObjectIds: number[]
}

let pendingInlineImageBind: PendingInlineImageBind | null = null

function readApiErrorCode(error: unknown): string {
  if (error && typeof error === 'object') {
    const data = (error as { response?: { data?: { error?: { code?: string } } } }).response?.data
      ?.error
    return data?.code?.trim() ?? ''
  }
  return ''
}

function isInlineImageBindError(error: unknown): boolean {
  const code = readApiErrorCode(error)
  if (code) return INLINE_IMAGE_BIND_ERROR_RE.test(code)
  const url =
    error && typeof error === 'object'
      ? (error as { config?: { url?: string } }).config?.url
      : undefined
  return typeof url === 'string' && url.includes('/inline-images')
}

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
  content: unknown,
  persistRewritten?: (rewritten: unknown) => Promise<void>
): Promise<'ok' | 'skipped' | 'failed'> {
  const { rewritten, fileObjectIds: preparedIds, didAdopt } = await prepareProgramInlineImageBind(
    programId,
    content
  )
  if (didAdopt) {
    try {
      if (persistRewritten) await persistRewritten(rewritten)
      else await persistRewrittenProgramInlineImageHtml(programId, rewritten)
    } catch (error) {
      if (isInlineImageBindError(error)) {
        showProgramInlineImageBindFailureAlert(programId, preparedIds, error)
        return 'failed'
      }
    }
  }
  if (preparedIds.length === 0) return 'skipped'
  const fileObjectIds = await resolveProgramInlineImageBindIds(programId, preparedIds)
  if (fileObjectIds.length === 0) return 'skipped'
  try {
    await putProgramInlineImages(programId, fileObjectIds)
    return 'ok'
  } catch (error) {
    if (!isInlineImageBindError(error)) return 'skipped'
    showProgramInlineImageBindFailureAlert(programId, fileObjectIds, error)
    return 'failed'
  }
}
