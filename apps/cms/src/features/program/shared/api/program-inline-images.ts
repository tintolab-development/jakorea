import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import { getApiErrorCode, getApiErrorHttpStatus } from '@/shared/lib/extract-api-error-message'

const FILE_SRC_RE =
  /file-object:(\d+)|\/api\/(?:admin|portal\/public)\/files\/(\d+)\/(?:content|download)/i
const IMG_TAG_RE = /<img\b[^>]*>/gi
const IMG_SRC_ATTR_RE = /\bsrc\s*=\s*(["'])(.*?)\1/i
const MARKDOWN_IMAGE_RE = /!\[[^\]]*\]\(([^)]+)\)/g

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

function isPositiveIntegerId(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1
}

function readBoundFileObjectIds(payload: unknown): number[] | null {
  const body = unwrapApiBody<unknown>(payload)
  if (Array.isArray(body)) {
    return body.filter(isPositiveIntegerId)
  }
  if (body && typeof body === 'object' && Array.isArray((body as { fileObjectIds?: unknown }).fileObjectIds)) {
    return (body as { fileObjectIds: unknown[] }).fileObjectIds.filter(isPositiveIntegerId)
  }
  return null
}

function sameFileObjectIds(left: number[], right: number[]): boolean {
  if (left.length !== right.length) return false
  return left.every((id, index) => id === right[index])
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
  fileObjectIds: number[]
): Promise<void> {
  try {
    const bound = await getProgramInlineImages(programId)
    if (bound == null) return
    if (!sameFileObjectIds(bound, fileObjectIds)) {
      throw new Error('본문 이미지 연결 결과가 저장한 ID와 일치하지 않습니다.')
    }
  } catch (error) {
    if (getApiErrorHttpStatus(error) === 404) return
    throw error
  }
}

async function putAndConfirmProgramInlineImages(
  programId: string | number,
  fileObjectIds: number[]
): Promise<void> {
  await putProgramInlineImages(programId, fileObjectIds)
  await confirmProgramInlineImagesBound(programId, fileObjectIds)
}

export async function syncProgramInlineImages(
  programId: string | number,
  content: unknown
): Promise<void> {
  const { fileObjectIds, shouldPut } = resolveProgramInlineImagePut(content, 'update')
  if (!shouldPut) return
  try {
    await putAndConfirmProgramInlineImages(programId, fileObjectIds)
  } catch (error) {
    throw new ProgramInlineImageBindError({
      programId,
      fileObjectIds,
      stage: 'update',
      cause: error,
    })
  }
}

export async function syncProgramInlineImagesKeepProgram(
  programId: string | number,
  content: unknown
): Promise<'ok' | 'skipped'> {
  const { fileObjectIds, shouldPut } = resolveProgramInlineImagePut(content, 'create')
  if (!shouldPut) return 'skipped'
  try {
    await putAndConfirmProgramInlineImages(programId, fileObjectIds)
    return 'ok'
  } catch (error) {
    throw new ProgramInlineImageBindError({
      programId,
      fileObjectIds,
      stage: 'create',
      cause: error,
    })
  }
}
