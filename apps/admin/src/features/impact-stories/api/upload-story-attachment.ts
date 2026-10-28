/**
 * 임팩트 스토리 asset prepare → binary upload → confirm
 * - 첨부: IMPACT_STORY_ATTACHMENT
 * - 본문 인라인: IMPACT_STORY_INLINE_IMAGE
 * - 섬네일: IMPACT_STORY_THUMBNAIL (Orval 재생 전이면 ATTACHMENT 확정 자산을 thumbnailAssetId로 저장)
 */

import { getJAKoreaHomepageAdminAPIAssetsSubset } from '@/shared/api/generated/assets/assets-api'
import { UploadPrepareRequestPurpose } from '@/shared/api/generated/assets/schemas/uploadPrepareRequestPurpose'
import { resolvePresignedUploadUrl } from '@/shared/lib/presigned-upload-url'

type PrepareRuntime = {
  assetId?: number
  version?: number
  method?: string
  uploadUrl?: string
  requiredHeaders?: Record<string, string>
  uploadToken?: string
}

function resolveThumbnailPurpose(): UploadPrepareRequestPurpose {
  const purposes = UploadPrepareRequestPurpose as Record<string, UploadPrepareRequestPurpose>
  return purposes.IMPACT_STORY_THUMBNAIL ?? UploadPrepareRequestPurpose.IMPACT_STORY_ATTACHMENT
}

async function uploadImpactStoryAsset(
  file: File,
  purpose: UploadPrepareRequestPurpose,
  label: string,
): Promise<number> {
  const assetsApi = getJAKoreaHomepageAdminAPIAssetsSubset()
  const prepared = (await assetsApi.prepareUpload({
    purpose,
    originalName: file.name,
    contentType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
  })) as PrepareRuntime

  const assetId = prepared.assetId
  const version = prepared.version
  const uploadUrl = prepared.uploadUrl
  if (assetId == null || version == null || !uploadUrl) {
    throw new Error(`${label} 업로드 준비에 실패했습니다.`)
  }

  const method = (prepared.method ?? 'PUT').toUpperCase()
  const headers: Record<string, string> = {
    ...(prepared.requiredHeaders ?? {}),
  }
  if (!headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = file.type || 'application/octet-stream'
  }

  const uploadRes = await fetch(resolvePresignedUploadUrl(uploadUrl), {
    method,
    headers,
    body: file,
  })
  if (!uploadRes.ok) {
    throw new Error(`${label} 업로드에 실패했습니다. (${uploadRes.status})`)
  }

  await assetsApi.confirmUpload(assetId, {
    version,
    uploadToken: prepared.uploadToken ?? '',
  })

  return assetId
}

export async function uploadImpactStoryAttachmentAsset(file: File): Promise<number> {
  return uploadImpactStoryAsset(
    file,
    UploadPrepareRequestPurpose.IMPACT_STORY_ATTACHMENT,
    '첨부 파일',
  )
}

export async function uploadImpactStoryThumbnailAsset(file: File): Promise<number> {
  return uploadImpactStoryAsset(file, resolveThumbnailPurpose(), '섬네일')
}

export async function uploadImpactStoryInlineImage(file: File): Promise<string> {
  const assetId = await uploadImpactStoryAsset(
    file,
    UploadPrepareRequestPurpose.IMPACT_STORY_INLINE_IMAGE,
    '이미지',
  )
  const assetsApi = getJAKoreaHomepageAdminAPIAssetsSubset()
  const asset = await assetsApi.getAsset(assetId)
  const url = asset.publicUrl?.trim()
  if (!url) {
    throw new Error('이미지 주소를 받지 못했습니다.')
  }
  return url
}
