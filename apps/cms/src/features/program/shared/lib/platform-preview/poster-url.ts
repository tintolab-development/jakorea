import { useEffect, useState } from 'react'
import type { Program } from '@/types/domain'
import { parseFileObjectId } from '@/shared/lib/admin-file-upload'
import {
  fetchProgramThumbnail,
  loadProgramThumbnailPreviewUrl,
} from '@/features/program/shared/api/program-thumbnail'
import { getApplicantRecruitInstitutionOverlayRecord } from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import { getGeneralRecruitOverlayRecord } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { readRecruitDetailMediaFromOverlay } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-media'

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
  // blob 은 즉시 placeholder 용. revoke 됐을 수 있으므로 fileObjectId 로드가 SSOT.
  const displayUrl =
    readablePosterUrl(input.thumbObjectUrl) ?? readablePosterUrl(input.programKeyVisualImage)
  const fileObjectId =
    input.thumbFileObjectId ??
    fileObjectIdFromAdminFileUrl(input.overlayKeyVisualImage) ??
    fileObjectIdFromAdminFileUrl(input.programKeyVisualImage) ??
    undefined
  return { displayUrl, fileObjectId }
}

function resolveProgramPosterSeed(program: Program): PreviewPosterSeed {
  const media = readRecruitDetailMediaFromOverlay({
    ...getApplicantRecruitInstitutionOverlayRecord(),
    ...getGeneralRecruitOverlayRecord(),
  })
  return resolvePreviewPosterSeed({
    thumbObjectUrl: media.thumbObjectUrl,
    thumbFileObjectId: media.thumbFileObjectId,
    overlayKeyVisualImage: media.keyVisualImage,
    programKeyVisualImage: program.keyVisualImage || program.posterImage,
  })
}

/** 모집 미리보기 포스터 — 편집 중 업로드(overlay) → 저장된 썸네일 순 */
export function usePreviewPosterUrl(program: Program | null, enabled: boolean): string | undefined {
  const [posterUrl, setPosterUrl] = useState<string | undefined>()
  const programId = program?.id
  const keyVisualImage = program?.keyVisualImage
  const posterImage = program?.posterImage

  useEffect(() => {
    if (!enabled || program == null) return
    const seed = resolveProgramPosterSeed(program)
    setPosterUrl(seed.displayUrl)
    const numericProgramId = parseFileObjectId(program.id)

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
        if (seed.fileObjectId != null) {
          apply(await loadProgramThumbnailPreviewUrl(seed.fileObjectId))
          return
        }
        if (seed.displayUrl || numericProgramId == null) return
        const thumbnail = await fetchProgramThumbnail(numericProgramId)
        if (cancelled || thumbnail.fileObjectId == null) return
        apply(await loadProgramThumbnailPreviewUrl(thumbnail.fileObjectId))
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
  }, [enabled, programId, keyVisualImage, posterImage])

  return posterUrl
}
