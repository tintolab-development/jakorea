import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import {
  programInlineImageOwner,
  takeProgramInlineImageDraft,
} from '@/shared/lib/admin-file-upload/inline-image'
import { uploadAdminFileMaybeMock } from '@/shared/lib/admin-file-upload/upload-maybe-mock'
import { getApiErrorCode, getApiErrorHttpStatus } from '@/shared/lib/extract-api-error-message'

const FILE_SRC_RE =
  /file-object:(\d+)|\/api\/(?:admin|portal\/public)\/files\/(\d+)\/(?:content|download)/i
const IMG_TAG_RE = /<img\b[^>]*>/gi
const IMG_SRC_ATTR_RE = /\bsrc\s*=\s*(["'])(.*?)\1/i
const MARKDOWN_IMAGE_RE = /!\[[^\]]*\]\(([^)]+)\)/g

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

const AUXILIARY_PATCH_KEYS = new Set(['serviceDetailJson', 'targetLevels', 'targetLevel'])

export const PROGRAM_INLINE_IMAGE_ERROR_MESSAGES: Record<string, string> = {
  INLINE_IMAGE_FILE_OWNER_MISMATCH:
    '본문 이미지에 대한 권한이 없습니다. 다른 프로그램 또는 다른 관리자의 초안 이미지는 연결할 수 없습니다.',
  INLINE_IMAGE_FILE_NOT_FOUND: '본문 이미지를 찾을 수 없습니다.',
  INLINE_IMAGE_FILE_NOT_AVAILABLE:
    '본문 이미지가 아직 사용할 수 없는 상태입니다. 파일이 AVAILABLE·CLEAN인지 확인한 뒤 다시 저장해 주세요.',
  INLINE_IMAGE_FILE_PURPOSE_MISMATCH: '본문 이미지 용도가 올바르지 않습니다.',
  INLINE_IMAGE_CONTENT_TYPE_REQUIRED: '본문 이미지 파일 형식이 필요합니다.',
  INLINE_IMAGE_FILE_ID_REQUIRED: '본문 이미지 ID가 필요합니다.',
  INLINE_IMAGE_DUPLICATED: '같은 본문 이미지가 중복되어 있습니다.',
}

export class ProgramInlineImageBindError extends Error {
  readonly programId: string
  readonly fileObjectIds: number[]
  readonly stage: 'create' | 'update'
  readonly cause: unknown

  constructor(input: {
    programId: string | number
    fileObjectIds: number[]
    stage: 'create' | 'update'
    cause: unknown
  }) {
    super(programInlineImageBindUserMessage(input.stage, input.cause))
    this.name = 'ProgramInlineImageBindError'
    this.programId = String(input.programId)
    this.fileObjectIds = [...input.fileObjectIds]
    this.stage = input.stage
    this.cause = input.cause
  }
}

export function isProgramInlineImageBindError(error: unknown): error is ProgramInlineImageBindError {
  return error instanceof ProgramInlineImageBindError ||
    (error instanceof Error && error.name === 'ProgramInlineImageBindError')
}

function parseFileObjectIdFromSrc(src: string): number | null {
  const match = FILE_SRC_RE.exec(src)
  if (!match) return null
  const id = Number(match[1] ?? match[2])
  if (!Number.isInteger(id) || id < 1) return null
  return id
}

function pushUniqueId(ids: number[], seen: Set<number>, id: number | null): void {
  if (id == null || seen.has(id)) return
  seen.add(id)
  ids.push(id)
}

/** 최종 본문 HTML의 이미지 표시 순서. 썸네일·첨부 URL은 img/markdown 밖에 있으면 제외한다. */
export function collectFileObjectIdsFromHtml(value: string): number[] {
  const ids: number[] = []
  const seen = new Set<number>()

  IMG_TAG_RE.lastIndex = 0
  let imgTag: RegExpExecArray | null
  while ((imgTag = IMG_TAG_RE.exec(value))) {
    const src = IMG_SRC_ATTR_RE.exec(imgTag[0])?.[2]
    if (src) pushUniqueId(ids, seen, parseFileObjectIdFromSrc(src))
  }

  MARKDOWN_IMAGE_RE.lastIndex = 0
  let markdown: RegExpExecArray | null
  while ((markdown = MARKDOWN_IMAGE_RE.exec(value))) {
    pushUniqueId(ids, seen, parseFileObjectIdFromSrc(markdown[1] ?? ''))
  }

  return ids
}

export function collectFileObjectIdsFromUnknown(value: unknown): number[] {
  const seen = new Set<number>()
  const ids: number[] = []
  const walk = (node: unknown) => {
    if (typeof node === 'string') {
      for (const id of collectFileObjectIdsFromHtml(node)) {
        if (seen.has(id)) continue
        seen.add(id)
        ids.push(id)
      }
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
  return ids
}

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
  const ids: number[] = []
  const walk = (node: unknown, key?: string) => {
    if (typeof node === 'string') {
      if (isProgramInlineImageContentKey(key)) {
        for (const id of collectFileObjectIdsFromHtml(node)) {
          if (seen.has(id)) continue
          seen.add(id)
          ids.push(id)
        }
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
  return ids
}

export function hasProgramInlineImageContent(value: unknown): boolean {
  let found = false
  const walk = (node: unknown, key?: string) => {
    if (found) return
    if (typeof node === 'string') {
      if (isProgramInlineImageContentKey(key)) {
        found = true
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
  return found
}

export function isProgramInlineImageAuxiliaryPatch(content: unknown): boolean {
  if (!content || typeof content !== 'object' || Array.isArray(content)) return false
  const keys = Object.keys(content).filter(
    key => (content as Record<string, unknown>)[key] !== undefined
  )
  return keys.length > 0 && keys.every(key => AUXILIARY_PATCH_KEYS.has(key))
}

export function resolveProgramInlineImagePut(
  content: unknown,
  mode: 'create' | 'update'
): { fileObjectIds: number[]; shouldPut: boolean } {
  const fileObjectIds = collectProgramInlineImageFileObjectIds(content)
  if (mode === 'create') {
    return { fileObjectIds, shouldPut: fileObjectIds.length > 0 }
  }
  if (isProgramInlineImageAuxiliaryPatch(content)) {
    return { fileObjectIds, shouldPut: false }
  }
  if (!hasProgramInlineImageContent(content)) {
    return { fileObjectIds, shouldPut: false }
  }
  return { fileObjectIds, shouldPut: true }
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

export function programInlineImageErrorMessage(error: unknown): string {
  const code = getApiErrorCode(error)?.trim()
  if (code && PROGRAM_INLINE_IMAGE_ERROR_MESSAGES[code]) {
    return PROGRAM_INLINE_IMAGE_ERROR_MESSAGES[code]
  }
  if (error instanceof Error && error.message.trim()) return error.message
  return '본문 이미지 연결에 실패했습니다.'
}

function programInlineImageBindUserMessage(stage: 'create' | 'update', cause: unknown): string {
  const detail = programInlineImageErrorMessage(cause)
  if (stage === 'create') {
    return `프로그램은 생성되었지만 본문 이미지를 연결하지 못했습니다.\n${detail}\n전체 저장은 완료되지 않았습니다. 프로그램 상세에서 본문을 다시 저장해 주세요.`
  }
  return `프로그램 본문은 저장되었지만 본문 이미지 연결이 실패했습니다.\n${detail}\n전체 저장은 완료되지 않았습니다. 다시 저장해 주세요.`
}

function inlineImagesPath(programId: string | number): string {
  return `/api/admin/programs/${encodeURIComponent(String(programId))}/inline-images`
}

function toPositiveIntegerId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 1) return value
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const parsed = Number(value.trim())
    if (Number.isInteger(parsed) && parsed >= 1) return parsed
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return toPositiveIntegerId((value as { fileObjectId?: unknown }).fileObjectId)
  }
  return null
}

function readBoundFileObjectIds(payload: unknown): number[] | null {
  const body = unwrapApiBody<unknown>(payload)
  if (Array.isArray(body)) {
    const ids = body.map(toPositiveIntegerId).filter((id): id is number => id != null)
    return ids
  }
  if (body && typeof body === 'object' && Array.isArray((body as { fileObjectIds?: unknown }).fileObjectIds)) {
    return (body as { fileObjectIds: unknown[] }).fileObjectIds
      .map(toPositiveIntegerId)
      .filter((id): id is number => id != null)
  }
  return null
}

function uniqueSortedIds(ids: number[]): number[] {
  return [...new Set(ids)].sort((left, right) => left - right)
}

/** 순서·중복은 무시하고, 한쪽이 다른 쪽의 부분집합이면 연결이 반영된 것으로 본다. */
function boundCompatibleWithPut(bound: number[], put: number[]): boolean {
  const boundIds = uniqueSortedIds(bound)
  const putIds = uniqueSortedIds(put)
  if (boundIds.length === putIds.length && boundIds.every((id, index) => id === putIds[index])) {
    return true
  }
  const putSet = new Set(putIds)
  const boundSet = new Set(boundIds)
  if (boundIds.length > 0 && boundIds.every(id => putSet.has(id))) return true
  if (putIds.length > 0 && putIds.every(id => boundSet.has(id))) return true
  return false
}

/** PUT /api/admin/programs/{programId}/inline-images — 공개 content 바인딩 */
export async function putProgramInlineImages(
  programId: string | number,
  fileObjectIds: number[]
): Promise<void> {
  await customInstance({
    url: inlineImagesPath(programId),
    method: 'PUT',
    data: { fileObjectIds },
  })
}

export async function getProgramInlineImages(programId: string | number): Promise<number[] | null> {
  const payload = await customInstance({
    url: inlineImagesPath(programId),
    method: 'GET',
  })
  return readBoundFileObjectIds(payload)
}

async function confirmProgramInlineImagesBound(
  programId: string | number,
  fileObjectIds: number[],
  stage: 'create' | 'update'
): Promise<void> {
  try {
    const bound = await getProgramInlineImages(programId)
    if (bound == null) return
    if (boundCompatibleWithPut(bound, fileObjectIds)) return
    // 생성은 PUT 성공이 본문 연결 SSOT. GET echo 순서·부분집합 차이는 등록을 되돌리지 않는다.
    if (stage === 'create') return
    throw new Error('본문 이미지 연결 결과가 저장한 ID와 일치하지 않습니다.')
  } catch (error) {
    if (getApiErrorHttpStatus(error) === 404) return
    throw error
  }
}

async function putAndConfirmProgramInlineImages(
  programId: string | number,
  fileObjectIds: number[],
  stage: 'create' | 'update'
): Promise<void> {
  await putProgramInlineImages(programId, fileObjectIds)
  await confirmProgramInlineImagesBound(programId, fileObjectIds, stage)
}

/** 바인딩 PUT 실패 중 본문 이미지와 무관한 API 오류 코드(예: UJAT_RECRUIT_TERM_DUPLICATE)인지. */
function isUnrelatedApiError(error: unknown): boolean {
  const code = getApiErrorCode(error)?.trim()
  return Boolean(code) && !INLINE_IMAGE_BIND_ERROR_RE.test(code as string)
}

async function persistRewrittenInlineImageContent(
  programId: string | number,
  rewritten: unknown,
  persistRewritten?: (rewritten: unknown) => Promise<void>
): Promise<void> {
  if (persistRewritten) await persistRewritten(rewritten)
  else await persistRewrittenProgramInlineImageHtml(programId, rewritten)
}

/**
 * UPDATE 후 본문 이미지 바인딩.
 * 등록 draft 이미지는 프로그램 owner로 다시 올려 본문을 갱신하고, 현재 프로그램(모집 행 포함) id와 합쳐 PUT·확인한다.
 * 실패는 ProgramInlineImageBindError로 저장 오류에 전달한다.
 */
export async function syncProgramInlineImages(
  programId: string | number,
  content: unknown,
  persistRewritten?: (rewritten: unknown) => Promise<void>
): Promise<void> {
  const { rewritten, fileObjectIds: preparedIds, didAdopt } = await prepareProgramInlineImageBind(
    programId,
    content
  )
  if (didAdopt) await persistRewrittenInlineImageContent(programId, rewritten, persistRewritten)
  const { shouldPut } = resolveProgramInlineImagePut(didAdopt ? rewritten : content, 'update')
  if (!shouldPut) return
  let fileObjectIds = preparedIds
  try {
    fileObjectIds = await resolveProgramInlineImageBindIds(programId, preparedIds)
    await putAndConfirmProgramInlineImages(programId, fileObjectIds, 'update')
  } catch (error) {
    throw new ProgramInlineImageBindError({
      programId,
      fileObjectIds,
      stage: 'update',
      cause: error,
    })
  }
}

/**
 * CREATE 직후 본문 이미지 바인딩. 프로그램은 지우지 않는다.
 * 본문 이미지 바인딩 실패는 ProgramInlineImageBindError로 throw해 저장 오류로 안내한다.
 */
export async function syncProgramInlineImagesKeepProgram(
  programId: string | number,
  content: unknown,
  persistRewritten?: (rewritten: unknown) => Promise<void>
): Promise<'ok' | 'skipped'> {
  const { rewritten, fileObjectIds: preparedIds, didAdopt } = await prepareProgramInlineImageBind(
    programId,
    content
  )
  if (didAdopt) {
    try {
      await persistRewrittenInlineImageContent(programId, rewritten, persistRewritten)
    } catch (error) {
      if (!isUnrelatedApiError(error)) {
        throw new ProgramInlineImageBindError({
          programId,
          fileObjectIds: preparedIds,
          stage: 'create',
          cause: error,
        })
      }
    }
  }
  const { shouldPut } = resolveProgramInlineImagePut(didAdopt ? rewritten : content, 'create')
  if (!shouldPut || preparedIds.length === 0) return 'skipped'
  const fileObjectIds = await resolveProgramInlineImageBindIds(programId, preparedIds)
  if (fileObjectIds.length === 0) return 'skipped'
  try {
    await putAndConfirmProgramInlineImages(programId, fileObjectIds, 'create')
    return 'ok'
  } catch (error) {
    if (isUnrelatedApiError(error)) return 'skipped'
    throw new ProgramInlineImageBindError({
      programId,
      fileObjectIds,
      stage: 'create',
      cause: error,
    })
  }
}
