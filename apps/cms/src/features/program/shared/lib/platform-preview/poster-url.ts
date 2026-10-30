import { useEffect, useState } from 'react'
import type { Program } from '@/types/domain'
import { loadProgramThumbnailPreviewUrl } from '@/features/program/shared/api/program-thumbnail'
import { getApplicantRecruitInstitutionOverlayRecord } from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import { peekGeneralRecruitOverlayRecord } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { getRecruitDetailInfoRecord } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-form-rhf'
import {
  readRecruitDetailMediaFromOverlay,
  recruitDetailInfoPrefixesForPreviewAudience,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-media'
import {
  pickAudienceLiveOverlay,
  pickPreviewRecruitmentRow,
  previewCopyAudienceForTab,
  recruitmentPreviewCatalogCodes,
  type ProgramPreviewAudience,
} from '@/features/program/shared/lib/platform-preview/preview-audience'
import {
  collectOperationalOverlayForCatalogId,
  keyMatchesOperationalOverlayPrefixes,
  operationalOverlayKeyPrefixesForCatalogId,
} from '@/features/program/general/lib/registration-operational-form-drafts'

export type PreviewRecruitAudience = ProgramPreviewAudience
export { previewCopyAudienceForTab }

/** img src로 바로 쓸 수 있는 주소만. `/api/admin/files/…`는 인증 헤더가 필요해 제외 */
export function readablePosterUrl(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed || trimmed.includes('/api/admin/files/')) return undefined
  if (
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:') ||
    /^https?:\/\//i.test(trimmed)
  ) {
    return trimmed
  }
  return undefined
}

export function fileObjectIdFromAdminFileUrl(value: string | null | undefined): number | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  const match = trimmed.match(/\/(?:api\/admin\/)?files\/(\d+)/i)
  if (!match) return null
  const id = Number(match[1])
  return Number.isFinite(id) && id >= 1 ? id : null
}

export type PreviewPosterSeed = {
  displayUrl?: string
  fileObjectId?: number
}

export function resolvePreviewPosterSeed(input: {
  thumbObjectUrl?: string
  thumbFileObjectId?: number
  overlayKeyVisualImage?: string
  programKeyVisualImage?: string
}): PreviewPosterSeed {
  // overlay blob은 재진입 후 무효. fileObjectId 로드가 SSOT.
  const displayUrl = readablePosterUrl(input.programKeyVisualImage)
  const fileObjectId =
    input.thumbFileObjectId ??
    fileObjectIdFromAdminFileUrl(input.overlayKeyVisualImage) ??
    fileObjectIdFromAdminFileUrl(input.programKeyVisualImage) ??
    undefined
  return { displayUrl, fileObjectId }
}

function peekRecruitPreviewCatalogOverlays(
  catalogTemplateCodes: readonly string[]
): Record<string, unknown> {
  const merged: Record<string, unknown> = {}
  for (const catalogId of catalogTemplateCodes) {
    const collected = collectOperationalOverlayForCatalogId(catalogId)
    if (collected != null) {
      Object.assign(merged, collected)
      continue
    }
    const prefixes = operationalOverlayKeyPrefixesForCatalogId(catalogId)
    const peeked = peekGeneralRecruitOverlayRecord(catalogId)
    for (const [key, value] of Object.entries(peeked)) {
      if (keyMatchesOperationalOverlayPrefixes(key, prefixes)) merged[key] = value
    }
  }
  return merged
}

/** 모집 미리보기용 live overlay (catalog peek + registrationOverlay·기관 양식). */
export function liveRecruitPreviewOverlay(
  program: Program,
  audience: PreviewRecruitAudience,
  extraOverlay?: Record<string, unknown>
): Record<string, unknown> {
  const catalogOverlays = peekRecruitPreviewCatalogOverlays(
    recruitmentPreviewCatalogCodes(program, audience)
  )
  return pickAudienceLiveOverlay(
    {
      ...(program.registrationOverlay ?? {}),
      ...(audience === 'institutions' ? getApplicantRecruitInstitutionOverlayRecord() : {}),
      ...catalogOverlays,
      ...getRecruitDetailInfoRecord(),
      ...extraOverlay,
    },
    audience
  )
}

/**
 * 모집 탭 미리보기 썸네일.
 * 해당 탭 overlay → 그 모집 행 `thumbnailFileObjectId`. 프로그램 공통 이미지로 채우지 않는다.
 */
export function resolveAudiencePreviewPosterSeed(input: {
  program: Program
  audience: PreviewRecruitAudience
  overlay?: Record<string, unknown>
}): PreviewPosterSeed {
  const prefixes = recruitDetailInfoPrefixesForPreviewAudience(input.audience)
  const media = readRecruitDetailMediaFromOverlay(
    liveRecruitPreviewOverlay(input.program, input.audience, input.overlay),
    prefixes
  )
  const row = pickPreviewRecruitmentRow(input.program, input.audience)
  const rowThumbId =
    typeof row?.thumbnailFileObjectId === 'number' && row.thumbnailFileObjectId > 0
      ? row.thumbnailFileObjectId
      : undefined
  return resolvePreviewPosterSeed({
    thumbObjectUrl: media.thumbObjectUrl,
    thumbFileObjectId: media.thumbFileObjectId ?? rowThumbId,
    overlayKeyVisualImage: media.keyVisualImage,
  })
}

export function resolveAudiencePreviewAttachmentNames(input: {
  program: Program
  audience: PreviewRecruitAudience
  overlay?: Record<string, unknown>
}): string[] {
  const prefixes = recruitDetailInfoPrefixesForPreviewAudience(input.audience)
  const media = readRecruitDetailMediaFromOverlay(
    liveRecruitPreviewOverlay(input.program, input.audience, input.overlay),
    prefixes
  )
  if (media.attachmentFileNames?.length) return media.attachmentFileNames
  const row = pickPreviewRecruitmentRow(input.program, input.audience)
  return (row?.attachments ?? [])
    .map(file => file.originalFileName?.trim())
    .filter((name): name is string => Boolean(name))
}

/** 모집 미리보기 포스터 — 해당 탭 overlay → 모집 행 썸네일 */
export function usePreviewPosterUrl(
  program: Program | null,
  enabled: boolean,
  audience: PreviewRecruitAudience = 'institutions',
  extraOverlay?: Record<string, unknown>
): string | undefined {
  const [posterUrl, setPosterUrl] = useState<string | undefined>()
  const programId = program?.id
  const seedFileId = program
    ? resolveAudiencePreviewPosterSeed({ program, audience, overlay: extraOverlay }).fileObjectId
    : undefined

  useEffect(() => {
    if (!enabled || program == null) {
      setPosterUrl(undefined)
      return
    }
    const seed = resolveAudiencePreviewPosterSeed({ program, audience, overlay: extraOverlay })
    setPosterUrl(seed.displayUrl)

    let cancelled = false
    let objectUrl: string | null = null

    const apply = (nextUrl: string) => {
      if (cancelled) {
        if (nextUrl.startsWith('blob:')) URL.revokeObjectURL(nextUrl)
        return
      }
      objectUrl = nextUrl.startsWith('blob:') ? nextUrl : null
      setPosterUrl(nextUrl)
    }

    void (async () => {
      try {
        if (seed.fileObjectId == null) return
        apply(await loadProgramThumbnailPreviewUrl(seed.fileObjectId))
      } catch {
        if (!cancelled) {
          setPosterUrl(seed.displayUrl?.startsWith('blob:') ? undefined : seed.displayUrl)
        }
      }
    })()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- program 객체 대신 식별 필드로 재조회
  }, [enabled, programId, audience, seedFileId])

  return posterUrl
}
