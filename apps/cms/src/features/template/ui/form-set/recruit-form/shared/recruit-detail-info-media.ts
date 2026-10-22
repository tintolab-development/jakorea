/**
 * 모집 상세 정보(썸네일·첨부) overlay 키·생성 후 프로그램 바인딩.
 * 등록 중에는 ownerId=null draft 로 업로드하고, 생성 직후 실제 programId 에 연결한다.
 */

import { fileObjectIdFromAdminFileUrl, parseFileObjectId } from '@/shared/lib/admin-file-upload'
import { putProgramAttachments } from '@/features/program/shared/api/program-attachments'
import { putProgramThumbnail } from '@/features/program/shared/api/program-thumbnail'
import {
  putProgramRecruitmentAttachments,
  putProgramRecruitmentThumbnail,
} from '@/features/program/shared/api/program-recruitment-rows'
import type { Program } from '@/types/domain'
import { getGeneralRecruitOverlayRecord } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { RECRUIT_DETAIL_INFO_OVERLAY_PREFIX } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-overlay'

/**
 * 등록 전 썸네일·첨부 prepare owner.
 * 프로그램이 아직 없으므로 `ownerId`는 null. 가짜 programId(1)를 쓰지 않는다.
 */
export const RECRUIT_DETAIL_DRAFT_PROGRAM_OWNER_ID = null

let pendingRecruitDetailMediaUploads: Promise<unknown> = Promise.resolve()

/** 등록 저장 전에 썸네일·첨부 업로드가 끝나도록 추적 */
export function trackRecruitDetailMediaUpload(task: Promise<unknown>): void {
  pendingRecruitDetailMediaUploads = pendingRecruitDetailMediaUploads
    .then(() => task)
    .catch(() => undefined)
}

export async function awaitRecruitDetailMediaUploads(): Promise<void> {
  await pendingRecruitDetailMediaUploads
}

/** canonical + 유형별 참여자 상세 정보 prefix (general-recruit-overlay 별칭과 정렬) */
export const PARTICIPANT_DETAIL_INFO_PREFIXES = [
  RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.institution,
  RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.economy,
  RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.trainedTeachers,
  RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.ujatInstitution,
  RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.volunteer,
  'recruitInstructor.detailInfo',
  'geminiRecruit.detailInfo',
] as const

export function recruitDetailThumbFileObjectIdKey(prefix: string): string {
  return `${prefix}.thumbFileObjectId`
}

export function recruitDetailThumbContentUrlKey(prefix: string): string {
  return `${prefix}.thumbContentUrl`
}

export function recruitDetailThumbFileNameKey(prefix: string): string {
  return `${prefix}.thumbFileName`
}

export function recruitDetailThumbObjectUrlKey(prefix: string): string {
  return `${prefix}.thumbObjectUrl`
}

/** overlay에 남은 blob 주소는 세션이 끝나면 무효다. img src로 쓰지 않는다. */
export function isEphemeralThumbPreviewUrl(url: string | null | undefined): boolean {
  return Boolean(url?.trim().startsWith('blob:'))
}

export function recruitDetailAttachmentFileNamesKey(prefix: string): string {
  return `${prefix}.attachmentFileNames`
}

export function recruitDetailAttachmentFileObjectIdsKey(prefix: string): string {
  return `${prefix}.attachmentFileObjectIds`
}

function readFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value)
    if (Number.isFinite(n) && n > 0) return n
  }
  return undefined
}

/** overlay fileObjectId가 없으면 content URL에서 id를 읽는다. blob 주소는 무시. */
export function resolveRecruitDetailThumbFileObjectId(
  fileObjectId: unknown,
  contentUrl: unknown
): number | undefined {
  const fromId = readFiniteNumber(fileObjectId)
  if (fromId != null) return fromId
  if (typeof contentUrl !== 'string') return undefined
  const trimmed = contentUrl.trim()
  if (!trimmed || trimmed.startsWith('blob:')) return undefined
  return fileObjectIdFromAdminFileUrl(trimmed) ?? undefined
}

function readStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const out = value.map(String).map(s => s.trim()).filter(Boolean)
  return out.length > 0 ? out : undefined
}

function readNumberArray(value: unknown): number[] | undefined {
  if (!Array.isArray(value)) return undefined
  const out = value
    .map(readFiniteNumber)
    .filter((n): n is number => n != null)
  return out.length > 0 ? out : undefined
}

export type RecruitDetailMediaFromOverlay = {
  keyVisualImage?: string
  thumbFileObjectId?: number
  thumbFileName?: string
  /** 등록 중 미리보기용 blob. create payload에는 넣지 않는다. */
  thumbObjectUrl?: string
  attachmentFileNames?: string[]
  attachmentFileObjectIds?: number[]
}

/** canonical `recruit.detailInfo.*` + 유형별 prefix 별칭에서 미디어 필드 수집 */
export function readRecruitDetailMediaFromOverlay(
  overlay: Record<string, unknown>,
  prefixes: readonly string[] = PARTICIPANT_DETAIL_INFO_PREFIXES
): RecruitDetailMediaFromOverlay {
  let keyVisualImage: string | undefined
  let thumbFileObjectId: number | undefined
  let thumbFileName: string | undefined
  let thumbObjectUrl: string | undefined
  let attachmentFileNames: string[] | undefined
  let attachmentFileObjectIds: number[] | undefined

  for (const prefix of prefixes) {
    if (!keyVisualImage) {
      const url = overlay[recruitDetailThumbContentUrlKey(prefix)]
      if (typeof url === 'string' && url.trim() && !url.startsWith('blob:')) {
        keyVisualImage = url.trim()
      }
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

  return {
    ...(keyVisualImage ? { keyVisualImage } : {}),
    ...(thumbFileObjectId != null ? { thumbFileObjectId } : {}),
    ...(thumbFileName ? { thumbFileName } : {}),
    ...(thumbObjectUrl ? { thumbObjectUrl } : {}),
    ...(attachmentFileNames ? { attachmentFileNames } : {}),
    ...(attachmentFileObjectIds ? { attachmentFileObjectIds } : {}),
  }
}

/**
 * 프로그램 생성 직후 — ownerId=null draft 파일을 실제 programId 에 연결.
 * 첨부는 PUT /programs/{id}/attachments (포털 GENERAL 첨부 SSOT).
 * 실패하면 호출부가 방금 만든 프로그램을 삭제하고 등록을 완료하지 않는다.
 */
export async function bindRecruitDetailMediaAfterProgramCreate(
  programId: string,
  overlay: Record<string, unknown> = getGeneralRecruitOverlayRecord()
): Promise<void> {
  const numericId = parseFileObjectId(programId)
  if (numericId == null) return

  const media = readRecruitDetailMediaFromOverlay(overlay)
  if (media.thumbFileObjectId != null) {
    await putProgramThumbnail(numericId, media.thumbFileObjectId)
  }

  const attachmentIds = media.attachmentFileObjectIds ?? []
  if (attachmentIds.length === 0) return
  await putProgramAttachments(numericId, attachmentIds)
}

const GENERAL_ROW_DETAIL_INFO_PREFIX: Record<string, string> = {
  PARTICIPANT: RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.institution,
  INSTRUCTOR: 'recruitInstructor.detailInfo',
  VOLUNTEER: RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.volunteer,
}

/**
 * 일반 프로그램 생성 직후 — 모집 양식별 썸네일·첨부를 해당 모집 행에 연결한다.
 * 같은 유형 행이 여럿이면(기관·개인 참여자) 같은 양식 파일을 각 행에 넣는다.
 * 행 id가 없으면 프로그램 단위로 연결한다.
 */
export async function bindGeneralRecruitDetailMediaToRows(
  created: Pick<Program, 'id' | 'programRecruitments'>,
  overlay: Record<string, unknown>
): Promise<void> {
  const numericId = parseFileObjectId(created.id)
  if (numericId == null) return
  const rows = (created.programRecruitments ?? []).filter(row => row.id != null)
  if (rows.length === 0) {
    await bindRecruitDetailMediaAfterProgramCreate(created.id, overlay)
    return
  }
  for (const row of rows) {
    const prefix = GENERAL_ROW_DETAIL_INFO_PREFIX[(row.recruitmentType ?? '').toUpperCase()]
    if (!prefix) continue
    const media = readRecruitDetailMediaFromOverlay(overlay, [prefix])
    if (media.thumbFileObjectId != null) {
      await putProgramRecruitmentThumbnail(numericId, row.id!, media.thumbFileObjectId)
    }
    const attachmentIds = media.attachmentFileObjectIds ?? []
    if (attachmentIds.length > 0) {
      await putProgramRecruitmentAttachments(numericId, row.id!, attachmentIds)
    }
  }
}
