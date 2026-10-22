/**
 * 등록 위저드 새로고침용 draft 미디어 ID.
 * blob은 저장하지 않고 fileObjectId·파일명만 sessionStorage에 둔다.
 * 「임시 저장」 localStorage 초안과 키를 섞지 않는다.
 */

import { contentUrlForFileObjectId } from '@/shared/lib/admin-file-upload'
import { peekGeneralRecruitOverlayRecord } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import {
  recruitDetailAttachmentFileNamesKey,
  recruitDetailAttachmentFileObjectIdsKey,
  recruitDetailThumbContentUrlKey,
  recruitDetailThumbFileNameKey,
  recruitDetailThumbFileObjectIdKey,
  resolveRecruitDetailThumbFileObjectId,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-media'

export const RECRUIT_DETAIL_DRAFT_MEDIA_SESSION_KEY = 'cms.jakorea.recruitDetailDraftMedia.v1'

export type RecruitDetailDraftMediaSidecar = {
  thumbFileObjectId?: number
  thumbFileName?: string | null
  attachmentFileObjectIds?: number[]
  attachmentFileNames?: string[]
}

type DraftMediaStore = Record<string, RecruitDetailDraftMediaSidecar>

type SessionLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

let sessionStoreOverride: SessionLike | null | undefined

export function setRecruitDetailDraftMediaSessionStoreForTests(
  store: SessionLike | null | undefined
): void {
  sessionStoreOverride = store
}

function sessionStore(): SessionLike | null {
  if (sessionStoreOverride !== undefined) return sessionStoreOverride
  try {
    return globalThis.sessionStorage
  } catch {
    return null
  }
}

function bucketKey(scope: string, prefix: string): string {
  return `${scope}::${prefix}`
}

function readStore(): DraftMediaStore {
  const storage = sessionStore()
  if (storage == null) return {}
  try {
    const raw = storage.getItem(RECRUIT_DETAIL_DRAFT_MEDIA_SESSION_KEY)
    if (!raw?.trim()) return {}
    const parsed = JSON.parse(raw) as unknown
    if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return parsed as DraftMediaStore
  } catch {
    return {}
  }
}

function writeStore(next: DraftMediaStore): void {
  const storage = sessionStore()
  if (storage == null) return
  if (Object.keys(next).length === 0) {
    storage.removeItem(RECRUIT_DETAIL_DRAFT_MEDIA_SESSION_KEY)
    return
  }
  storage.setItem(RECRUIT_DETAIL_DRAFT_MEDIA_SESSION_KEY, JSON.stringify(next))
}

function readFiniteId(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value)
    if (Number.isFinite(n) && n > 0) return n
  }
  return undefined
}

function readStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const out = value.map(String).map(s => s.trim()).filter(Boolean)
  return out.length > 0 ? out : undefined
}

function readNumberArray(value: unknown): number[] | undefined {
  if (!Array.isArray(value)) return undefined
  const out = value.map(readFiniteId).filter((n): n is number => n != null)
  return out.length > 0 ? out : undefined
}

export function peekRecruitDetailDraftMedia(
  scope: string,
  prefix: string
): RecruitDetailDraftMediaSidecar | null {
  const entry = readStore()[bucketKey(scope, prefix)]
  if (entry == null) return null
  return entry
}

export function persistRecruitDetailDraftMedia(
  scope: string,
  prefix: string,
  sidecar: RecruitDetailDraftMediaSidecar
): void {
  const next = { ...readStore() }
  const key = bucketKey(scope, prefix)
  const thumbId = readFiniteId(sidecar.thumbFileObjectId)
  const attachmentIds = readNumberArray(sidecar.attachmentFileObjectIds)
  const names = readStringArray(sidecar.attachmentFileNames)
  const empty =
    thumbId == null &&
    !sidecar.thumbFileName?.trim() &&
    (attachmentIds == null || attachmentIds.length === 0) &&
    (names == null || names.length === 0)
  if (empty) {
    delete next[key]
    writeStore(next)
    return
  }
  next[key] = {
    ...(thumbId != null ? { thumbFileObjectId: thumbId } : {}),
    ...(sidecar.thumbFileName?.trim() ? { thumbFileName: sidecar.thumbFileName.trim() } : {}),
    ...(attachmentIds ? { attachmentFileObjectIds: attachmentIds } : {}),
    ...(names ? { attachmentFileNames: names } : {}),
  }
  writeStore(next)
}

export function persistRecruitDetailDraftMediaFromOverlay(
  scope: string,
  prefix: string,
  overlay: Record<string, unknown> = peekGeneralRecruitOverlayRecord(scope)
): void {
  persistRecruitDetailDraftMedia(scope, prefix, {
    thumbFileObjectId: resolveRecruitDetailThumbFileObjectId(
      overlay[recruitDetailThumbFileObjectIdKey(prefix)],
      overlay[recruitDetailThumbContentUrlKey(prefix)]
    ),
    thumbFileName:
      typeof overlay[recruitDetailThumbFileNameKey(prefix)] === 'string'
        ? (overlay[recruitDetailThumbFileNameKey(prefix)] as string)
        : null,
    attachmentFileObjectIds: readNumberArray(overlay[recruitDetailAttachmentFileObjectIdsKey(prefix)]),
    attachmentFileNames: readStringArray(overlay[recruitDetailAttachmentFileNamesKey(prefix)]),
  })
}

export function clearRecruitDetailDraftMedia(scope: string, prefix: string): void {
  const next = { ...readStore() }
  delete next[bucketKey(scope, prefix)]
  writeStore(next)
}

export function clearAllRecruitDetailDraftMedia(): void {
  writeStore({})
}

/** overlay에 미디어 ID가 없을 때만 session sidecar를 얹는다. */
export function recruitDetailDraftMediaRestorePatch(
  scope: string,
  prefix: string,
  overlay: Record<string, unknown> = peekGeneralRecruitOverlayRecord(scope)
): Record<string, unknown> | null {
  const stored = peekRecruitDetailDraftMedia(scope, prefix)
  if (stored == null) return null
  const patch: Record<string, unknown> = {}
  const liveThumbId = resolveRecruitDetailThumbFileObjectId(
    overlay[recruitDetailThumbFileObjectIdKey(prefix)],
    overlay[recruitDetailThumbContentUrlKey(prefix)]
  )
  if (liveThumbId == null && stored.thumbFileObjectId != null) {
    patch[recruitDetailThumbFileObjectIdKey(prefix)] = stored.thumbFileObjectId
    patch[recruitDetailThumbContentUrlKey(prefix)] = contentUrlForFileObjectId(
      stored.thumbFileObjectId
    )
    if (stored.thumbFileName?.trim()) {
      patch[recruitDetailThumbFileNameKey(prefix)] = stored.thumbFileName.trim()
    }
  }
  const liveIds = readNumberArray(overlay[recruitDetailAttachmentFileObjectIdsKey(prefix)])
  if ((liveIds == null || liveIds.length === 0) && stored.attachmentFileObjectIds?.length) {
    patch[recruitDetailAttachmentFileObjectIdsKey(prefix)] = stored.attachmentFileObjectIds
    if (stored.attachmentFileNames?.length) {
      patch[recruitDetailAttachmentFileNamesKey(prefix)] = stored.attachmentFileNames
    }
  }
  return Object.keys(patch).length > 0 ? patch : null
}
