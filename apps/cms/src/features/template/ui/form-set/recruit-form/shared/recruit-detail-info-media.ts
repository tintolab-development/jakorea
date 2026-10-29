/**
 * 모집 상세 정보(썸네일·첨부) overlay 키·생성 요청 미디어 필드.
 * 등록 중에는 ownerId=null draft(PROGRAM_THUMBNAIL·PROGRAM_DETAIL_ATTACHMENT)로 업로드하고,
 * 일반·UJAT 신규 등록은 POST recruitments[]에 fileObjectId를 실어 연결한다.
 * 1사1교·교육받은 교사 신규 등록과 기존 프로그램 수정은 기존 PUT을 유지한다.
 */

import {
  contentUrlForFileObjectId,
  fileObjectIdFromAdminFileUrl,
  parseFileObjectId,
} from '@/shared/lib/admin-file-upload'
import { putProgramAttachments } from '@/features/program/shared/api/program-attachments'
import { putProgramThumbnail } from '@/features/program/shared/api/program-thumbnail'
import {
  putProgramRecruitmentAttachments,
  putProgramRecruitmentThumbnail,
} from '@/features/program/shared/api/program-recruitment-rows'
import type { Program } from '@/types/domain'
import {
  getRecruitDetailInfoRecord,
  patchRecruitDetailInfo,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-form-rhf'
import { RECRUIT_DETAIL_INFO_OVERLAY_PREFIX } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-overlay'
import { isUjatTypedRecruitmentOverlayWritesBlocked } from '@/features/program/ujat/lib/ujat-typed-recruitment-overlay-write-block'

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

const GENERAL_ROW_DETAIL_INFO_PREFIX: Record<string, string> = {
  PARTICIPANT: RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.institution,
  INSTRUCTOR: 'recruitInstructor.detailInfo',
  VOLUNTEER: RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.volunteer,
}

/** 프로그램 상세 모집 탭의 활성 행 기준 상세정보 overlay prefix */
export function recruitDetailOverlayPrefixForProgram(program: Program): string {
  const row = (program.programRecruitments ?? []).find(
    item => item.id != null && item.id === program.activeRecruitmentId
  )
  const recruitmentType = (row?.recruitmentType ?? '').toUpperCase()
  if (recruitmentType === 'INSTRUCTOR') return GENERAL_ROW_DETAIL_INFO_PREFIX.INSTRUCTOR
  if (recruitmentType === 'VOLUNTEER') {
    if (row?.recruitTerm === 'FIRST_HALF') return 'recruitVolunteer.h1.detailInfo'
    if (row?.recruitTerm === 'SECOND_HALF') return 'recruitVolunteer.h2.detailInfo'
    return GENERAL_ROW_DETAIL_INFO_PREFIX.VOLUNTEER
  }
  const backend = program.backendProgramType?.trim().toUpperCase() ?? ''
  if (backend === 'COMPANY_SCHOOL' || backend.includes('ECONOMY')) {
    return RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.economy
  }
  if (backend === 'TRAINED_TEACHER' || backend.includes('TRAINED')) {
    return RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.trainedTeachers
  }
  const programId = String(program.id ?? '')
  if (
    backend === 'UJAT' ||
    programId.startsWith('ujat-local-') ||
    programId.startsWith('ujat-institution-recruit-template-preview')
  ) {
    return RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.ujatInstitution
  }
  if (backend.includes('GEMINI') || backend.includes('VISITING')) {
    return RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.gemini
  }
  return RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.institution
}

/** 상세 수정 중 썸네일 PUT 결과를 미리보기가 읽는 overlay에 바로 반영한다. */
export function applyLiveRecruitmentThumbnailOverlay(
  program: Program,
  fileObjectId: number | null,
  fileName?: string | null
): void {
  if (isUjatTypedRecruitmentOverlayWritesBlocked()) return
  const prefix = recruitDetailOverlayPrefixForProgram(program)
  if (fileObjectId != null && fileObjectId > 0) {
    patchRecruitDetailInfo({
      [recruitDetailThumbFileObjectIdKey(prefix)]: fileObjectId,
      [recruitDetailThumbContentUrlKey(prefix)]: contentUrlForFileObjectId(fileObjectId),
      [recruitDetailThumbObjectUrlKey(prefix)]: null,
      ...(fileName?.trim() ? { [recruitDetailThumbFileNameKey(prefix)]: fileName.trim() } : {}),
    })
    return
  }
  patchRecruitDetailInfo({
    [recruitDetailThumbFileObjectIdKey(prefix)]: null,
    [recruitDetailThumbContentUrlKey(prefix)]: null,
    [recruitDetailThumbObjectUrlKey(prefix)]: null,
    [recruitDetailThumbFileNameKey(prefix)]: null,
  })
}

export type RecruitmentCreateMediaFields = {
  thumbnailFileObjectId?: number | null
  attachmentFileObjectIds?: number[] | null
}

export type RecruitmentCreateMediaMatch = {
  recruitmentType?: string | null
  targetType?: string | null
  applicationType?: string | null
  recruitTerm?: string | null
}

export type RecruitmentCreateMediaVariant = 'general' | 'ujat'

function overlayPrefixesForRecruitmentCreateMedia(
  row: RecruitmentCreateMediaMatch,
  variant: RecruitmentCreateMediaVariant
): readonly string[] {
  const recruitmentType = (row.recruitmentType ?? '').toUpperCase()
  if (variant === 'ujat') {
    if (recruitmentType === 'PARTICIPANT') {
      return [RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.ujatInstitution]
    }
    if (recruitmentType === 'VOLUNTEER') {
      return row.recruitTerm === 'SECOND_HALF'
        ? ['recruitVolunteer.h2.detailInfo']
        : ['recruitVolunteer.h1.detailInfo']
    }
    return []
  }
  const prefix = GENERAL_ROW_DETAIL_INFO_PREFIX[recruitmentType]
  return prefix ? [prefix] : []
}

/** 업로드·confirm이 끝난 fileObjectId만 생성 요청에 싣는다. blob·미완료 id는 제외. */
export function recruitmentCreateMediaFieldsFromOverlay(
  overlay: Record<string, unknown>,
  row: RecruitmentCreateMediaMatch,
  variant: RecruitmentCreateMediaVariant
): RecruitmentCreateMediaFields {
  const prefixes = overlayPrefixesForRecruitmentCreateMedia(row, variant)
  if (prefixes.length === 0) return {}
  const media = readRecruitDetailMediaFromOverlay(overlay, prefixes)
  return {
    ...(media.thumbFileObjectId != null
      ? { thumbnailFileObjectId: media.thumbFileObjectId }
      : {}),
    ...(media.attachmentFileObjectIds != null
      ? { attachmentFileObjectIds: media.attachmentFileObjectIds }
      : {}),
  }
}

export function withRecruitmentCreateMedia<T extends RecruitmentCreateMediaMatch>(
  rows: T[] | undefined,
  overlay: Record<string, unknown>,
  variant: RecruitmentCreateMediaVariant
): Array<T & RecruitmentCreateMediaFields> | undefined {
  return rows?.map(row => {
    const fromOverlay = recruitmentCreateMediaFieldsFromOverlay(overlay, row, variant)
    const rowThumb = (row as { thumbnailFileObjectId?: number | null }).thumbnailFileObjectId
    const rowAttachments = (row as { attachments?: { fileObjectId?: number }[] }).attachments
    const rowAttachmentIds = rowAttachments
      ?.map(item => item.fileObjectId)
      .filter((id): id is number => typeof id === 'number' && id > 0)
    return {
      ...row,
      ...fromOverlay,
      ...(typeof rowThumb === 'number' && rowThumb > 0
        ? { thumbnailFileObjectId: rowThumb }
        : {}),
      ...(rowAttachmentIds && rowAttachmentIds.length > 0
        ? { attachmentFileObjectIds: rowAttachmentIds }
        : {}),
    }
  })
}

function isRecruitmentCreateMediaOverlayKey(key: string): boolean {
  return (
    key.endsWith('.thumbFileObjectId') ||
    key.endsWith('.attachmentFileObjectIds') ||
    key.endsWith('.thumbFileName') ||
    key.endsWith('.thumbContentUrl') ||
    key.endsWith('.attachmentFileNames')
  )
}

/** 생성 요청 매칭용 — blob 미리보기 키는 제외하고 confirm된 미디어 overlay만 남긴다. */
export function pickRecruitmentCreateMediaOverlay(
  overlay: Record<string, unknown> | undefined
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(overlay ?? {})) {
    if (!isRecruitmentCreateMediaOverlayKey(key)) continue
    if (typeof value === 'string' && value.startsWith('blob:')) continue
    out[key] = value
  }
  return out
}

/**
 * 1사1교·교육받은 교사 생성 직후 — ownerId=null draft 파일을 실제 programId 에 연결.
 * 첨부는 PUT /programs/{id}/attachments.
 * 일반·UJAT 신규 등록은 생성 요청 recruitments[] 미디어 필드를 쓰고 이 후속 PUT을 호출하지 않는다.
 * 실패하면 호출부가 방금 만든 프로그램을 삭제하고 등록을 완료하지 않는다.
 */
export async function bindRecruitDetailMediaAfterProgramCreate(
  programId: string,
  overlay: Record<string, unknown> = getRecruitDetailInfoRecord()
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

/** 모집 미리보기·탭별 미디어 — 다른 탭 overlay를 섞지 않는다. */
export function recruitDetailInfoPrefixesForPreviewAudience(
  audience: 'institutions' | 'individuals' | 'instructors' | 'volunteers'
): readonly string[] {
  if (audience === 'instructors') return [GENERAL_ROW_DETAIL_INFO_PREFIX.INSTRUCTOR]
  if (audience === 'volunteers') {
    return [
      GENERAL_ROW_DETAIL_INFO_PREFIX.VOLUNTEER,
      'recruitVolunteer.h1.detailInfo',
      'recruitVolunteer.h2.detailInfo',
    ]
  }
  return [
    RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.institution,
    RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.economy,
    RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.trainedTeachers,
    RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.ujatInstitution,
    RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.gemini,
  ]
}

const UJAT_ROW_DETAIL_INFO_BINDINGS = [
  {
    recruitmentType: 'PARTICIPANT',
    applicationType: 'ORGANIZATION',
    prefix: RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.ujatInstitution,
  },
  {
    recruitmentType: 'VOLUNTEER',
    recruitTerm: 'FIRST_HALF',
    prefix: 'recruitVolunteer.h1.detailInfo',
  },
  {
    recruitmentType: 'VOLUNTEER',
    recruitTerm: 'SECOND_HALF',
    prefix: 'recruitVolunteer.h2.detailInfo',
  },
] as const

/**
 * 일반 프로그램 모집 행 PUT. 신규 등록은 withRecruitmentCreateMedia를 쓰고 호출하지 않는다.
 * 기존 프로그램 수정 화면의 PUT은 program-media-target을 쓴다.
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

/**
 * UJAT 모집 행 PUT. 신규 등록은 withRecruitmentCreateMedia를 쓰고 호출하지 않는다.
 * 봉사자 행은 날짜 정렬이 아니라 `recruitTerm`을 SSOT로 사용한다.
 */
export async function bindUjatRecruitDetailMediaToRows(
  created: Pick<Program, 'id' | 'programRecruitments'>,
  overlay: Record<string, unknown>
): Promise<void> {
  const numericId = parseFileObjectId(created.id)
  if (numericId == null) return

  const rows = (created.programRecruitments ?? []).filter(row => row.id != null)
  for (const binding of UJAT_ROW_DETAIL_INFO_BINDINGS) {
    const media = readRecruitDetailMediaFromOverlay(overlay, [binding.prefix])
    const hasMedia =
      media.thumbFileObjectId != null || (media.attachmentFileObjectIds?.length ?? 0) > 0
    if (!hasMedia) continue

    const row = rows.find(candidate => {
      if ((candidate.recruitmentType ?? '').toUpperCase() !== binding.recruitmentType) {
        return false
      }
      if (
        'applicationType' in binding &&
        (candidate.applicationType ?? '').toUpperCase() !== binding.applicationType
      ) {
        return false
      }
      return !('recruitTerm' in binding) || candidate.recruitTerm === binding.recruitTerm
    })
    if (row?.id == null) {
      throw new Error(`UJAT 모집 행을 찾을 수 없어 미디어를 연결할 수 없습니다: ${binding.prefix}`)
    }

    if (media.thumbFileObjectId != null) {
      await putProgramRecruitmentThumbnail(numericId, row.id, media.thumbFileObjectId)
    }
    const attachmentIds = media.attachmentFileObjectIds ?? []
    if (attachmentIds.length > 0) {
      await putProgramRecruitmentAttachments(numericId, row.id, attachmentIds)
    }
  }
}
