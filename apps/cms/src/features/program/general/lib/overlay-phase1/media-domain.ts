/**
 * 일반 프로그램 미디어 Independent 도메인 계산.
 * overlay store / 실제 미디어 PUT 를 호출하지 않는다.
 */
import { parseFileObjectId } from '@/shared/lib/admin-file-upload'
import {
  isEphemeralThumbPreviewUrl,
  PARTICIPANT_DETAIL_INFO_PREFIXES,
  recruitDetailAttachmentFileNamesKey,
  recruitDetailAttachmentFileObjectIdsKey,
  recruitDetailThumbContentUrlKey,
  recruitDetailThumbFileNameKey,
  recruitDetailThumbFileObjectIdKey,
  recruitDetailThumbObjectUrlKey,
  resolveRecruitDetailThumbFileObjectId,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-media'
import { RECRUIT_DETAIL_INFO_OVERLAY_PREFIX } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-overlay'
import type { Program } from '@/types/domain'
import { orderOverlayKeys } from './common-info-domain'
import type {
  IndependentMediaAttachmentValues,
  IndependentMediaAssetValues,
  IndependentMediaFormValues,
  IndependentMediaPrefixValues,
} from './media-form-values'
import type { MediaBindCall, MediaFileOrigin, MediaSidecarState } from './program-edit-snapshot.types'

export const GENERAL_MEDIA_ROW_PREFIX: Record<string, string> = {
  PARTICIPANT: RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.institution,
  INSTRUCTOR: 'recruitInstructor.detailInfo',
  VOLUNTEER: RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.volunteer,
}

function readFiniteNumber(value: unknown): number | undefined {
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
  const out = value.map(readFiniteNumber).filter((n): n is number => n != null)
  return out.length > 0 ? out : undefined
}

export function readIndependentMediaPrefixValues(
  overlay: Record<string, unknown>,
  prefix: string
): IndependentMediaPrefixValues {
  const contentUrlRaw = overlay[recruitDetailThumbContentUrlKey(prefix)]
  const contentUrl =
    typeof contentUrlRaw === 'string' && contentUrlRaw.trim() ? contentUrlRaw.trim() : undefined
  const objectUrlRaw = overlay[recruitDetailThumbObjectUrlKey(prefix)]
  const objectUrl =
    typeof objectUrlRaw === 'string' && objectUrlRaw.startsWith('blob:') ? objectUrlRaw : undefined
  const fileNameRaw = overlay[recruitDetailThumbFileNameKey(prefix)]
  const fileName =
    typeof fileNameRaw === 'string' && fileNameRaw.trim() ? fileNameRaw.trim() : undefined
  const fileObjectId = resolveRecruitDetailThumbFileObjectId(
    overlay[recruitDetailThumbFileObjectIdKey(prefix)],
    overlay[recruitDetailThumbContentUrlKey(prefix)]
  )
  const fileNames = readStringArray(overlay[recruitDetailAttachmentFileNamesKey(prefix)])
  const fileObjectIds = readNumberArray(overlay[recruitDetailAttachmentFileObjectIdsKey(prefix)])
  const thumbnail: IndependentMediaAssetValues | undefined =
    fileObjectId != null || fileName || contentUrl || objectUrl
      ? {
          ...(fileObjectId != null ? { fileObjectId } : {}),
          ...(fileName ? { fileName } : {}),
          ...(contentUrl ? { contentUrl } : {}),
          ...(objectUrl ? { objectUrl } : {}),
        }
      : undefined
  const attachments: IndependentMediaAttachmentValues | undefined =
    fileNames || fileObjectIds
      ? {
          ...(fileObjectIds ? { fileObjectIds } : {}),
          ...(fileNames ? { fileNames } : {}),
        }
      : undefined
  return { prefix, thumbnail, attachments }
}

/** overlay KV → canonical 미디어. 테스트 어댑터용. Builder는 formValues만 받는다. */
export function readIndependentMediaCanonicalFromOverlay(
  overlay: Record<string, unknown>,
  prefixes: readonly string[] = PARTICIPANT_DETAIL_INFO_PREFIXES
): Pick<IndependentMediaFormValues, 'thumbnail' | 'attachments'> {
  let keyVisualImage: string | undefined
  let thumbFileObjectId: number | undefined
  let thumbFileName: string | undefined
  let thumbObjectUrl: string | undefined
  let attachmentFileNames: string[] | undefined
  let attachmentFileObjectIds: number[] | undefined
  let thumbContentUrl: string | undefined

  for (const prefix of prefixes) {
    if (!keyVisualImage) {
      const url = overlay[recruitDetailThumbContentUrlKey(prefix)]
      if (typeof url === 'string' && url.trim() && !url.startsWith('blob:')) {
        keyVisualImage = url.trim()
      }
    }
    if (!thumbContentUrl) {
      const url = overlay[recruitDetailThumbContentUrlKey(prefix)]
      if (typeof url === 'string' && url.trim()) thumbContentUrl = url.trim()
    }
    if (!thumbObjectUrl) {
      const blob = overlay[recruitDetailThumbObjectUrlKey(prefix)]
      if (typeof blob === 'string' && blob.startsWith('blob:')) {
        thumbObjectUrl = blob
      }
    }
    if (thumbFileObjectId == null) {
      thumbFileObjectId = resolveRecruitDetailThumbFileObjectId(
        overlay[recruitDetailThumbFileObjectIdKey(prefix)],
        overlay[recruitDetailThumbContentUrlKey(prefix)]
      )
    }
    if (!thumbFileName) {
      const name = overlay[recruitDetailThumbFileNameKey(prefix)]
      if (typeof name === 'string' && name.trim()) thumbFileName = name.trim()
    }
    if (!attachmentFileNames) {
      attachmentFileNames = readStringArray(overlay[recruitDetailAttachmentFileNamesKey(prefix)])
    }
    if (!attachmentFileObjectIds) {
      attachmentFileObjectIds = readNumberArray(
        overlay[recruitDetailAttachmentFileObjectIdsKey(prefix)]
      )
    }
  }

  const thumbnail: IndependentMediaAssetValues | undefined =
    thumbFileObjectId != null || thumbFileName || thumbContentUrl || thumbObjectUrl
      ? {
          ...(thumbFileObjectId != null ? { fileObjectId: thumbFileObjectId } : {}),
          ...(thumbFileName ? { fileName: thumbFileName } : {}),
          ...((keyVisualImage ?? thumbContentUrl)
            ? { contentUrl: keyVisualImage ?? thumbContentUrl }
            : {}),
          ...(thumbObjectUrl ? { objectUrl: thumbObjectUrl } : {}),
        }
      : undefined
  const attachments: IndependentMediaAttachmentValues | undefined =
    attachmentFileNames || attachmentFileObjectIds
      ? {
          ...(attachmentFileObjectIds ? { fileObjectIds: attachmentFileObjectIds } : {}),
          ...(attachmentFileNames ? { fileNames: attachmentFileNames } : {}),
        }
      : undefined
  return { thumbnail, attachments }
}

export function independentMediaOrigin(state: {
  fileObjectId?: number
  objectUrl?: string
}): MediaFileOrigin {
  if (state.fileObjectId != null) return 'uploaded-object-id'
  if (isEphemeralThumbPreviewUrl(state.objectUrl)) return 'ephemeral-blob'
  return 'empty'
}

export function independentMediaStateFromFormValues(
  formValues: IndependentMediaFormValues
): MediaSidecarState {
  const thumb = formValues.thumbnail
  const contentUrl = thumb?.contentUrl?.trim()
  const keyVisualImage =
    contentUrl && !contentUrl.startsWith('blob:') ? contentUrl : undefined
  const origin = independentMediaOrigin({
    fileObjectId: thumb?.fileObjectId,
    objectUrl: thumb?.objectUrl,
  })
  return {
    origin,
    ...(thumb?.fileObjectId != null ? { thumbFileObjectId: thumb.fileObjectId } : {}),
    ...(thumb?.fileName ? { thumbFileName: thumb.fileName } : {}),
    ...(thumb?.objectUrl ? { thumbObjectUrl: thumb.objectUrl } : {}),
    ...(formValues.attachments?.fileObjectIds
      ? { attachmentFileObjectIds: [...formValues.attachments.fileObjectIds] }
      : {}),
    ...(formValues.attachments?.fileNames
      ? { attachmentFileNames: [...formValues.attachments.fileNames] }
      : {}),
    ...(keyVisualImage ? { keyVisualImage } : {}),
  }
}

function bindCallsFromMedia(
  programId: number,
  media: Pick<IndependentMediaFormValues, 'thumbnail' | 'attachments'>,
  recruitmentId?: number
): MediaBindCall[] {
  const calls: MediaBindCall[] = []
  if (media.thumbnail?.fileObjectId != null) {
    calls.push(
      recruitmentId != null
        ? {
            kind: 'putProgramRecruitmentThumbnail',
            programId,
            recruitmentId,
            fileObjectId: media.thumbnail.fileObjectId,
          }
        : {
            kind: 'putProgramThumbnail',
            programId,
            fileObjectId: media.thumbnail.fileObjectId,
          }
    )
  }
  const attachmentIds = media.attachments?.fileObjectIds ?? []
  if (attachmentIds.length > 0) {
    calls.push(
      recruitmentId != null
        ? {
            kind: 'putProgramRecruitmentAttachments',
            programId,
            recruitmentId,
            fileObjectIds: attachmentIds,
          }
        : {
            kind: 'putProgramAttachments',
            programId,
            fileObjectIds: attachmentIds,
          }
    )
  }
  return calls
}

export function independentMediaBindCalls(
  formValues: IndependentMediaFormValues,
  created?: Pick<Program, 'id' | 'programRecruitments'>
): MediaBindCall[] {
  if (!created) return []
  const programId = parseFileObjectId(created.id)
  if (programId == null) return []
  const rows = (created.programRecruitments ?? []).filter(row => row.id != null)
  if (rows.length === 0) {
    return bindCallsFromMedia(programId, formValues)
  }
  const byPrefix = new Map((formValues.byPrefix ?? []).map(item => [item.prefix, item]))
  const calls: MediaBindCall[] = []
  for (const row of rows) {
    const prefix = GENERAL_MEDIA_ROW_PREFIX[(row.recruitmentType ?? '').toUpperCase()]
    if (!prefix) continue
    const scoped = byPrefix.get(prefix)
    calls.push(
      ...bindCallsFromMedia(
        programId,
        { thumbnail: scoped?.thumbnail, attachments: scoped?.attachments },
        row.id
      )
    )
  }
  return calls
}

export function persistIndependentMediaOverlay(
  unownedOverlay: Record<string, unknown> | undefined,
  keyOrder?: readonly string[]
): Record<string, unknown> {
  return orderOverlayKeys({ ...(unownedOverlay ?? {}) }, keyOrder)
}

export const GENERAL_MEDIA_READ_PREFIXES = PARTICIPANT_DETAIL_INFO_PREFIXES
