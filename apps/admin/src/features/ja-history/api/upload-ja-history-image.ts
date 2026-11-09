/**
 * JA History 교체 가능 이미지 — prepare → binary upload → confirm
 * purpose: JA_HISTORY_HERO_IMAGE | JA_HISTORY_WORLD_TIMELINE_IMAGE | JA_HISTORY_KOREA_TIMELINE_IMAGE | JA_HISTORY_PHILOSOPHY_CARD_IMAGE | JA_HISTORY_CTA_IMAGE
 * JA_HISTORY_LOCKED_MEDIA 는 호출하지 않는다 (prepareUpload 400).
 */

import { getJAKoreaHomepageAdminAPIAssetsSubset } from '@/shared/api/generated/assets/assets-api'
import { resolvePresignedUploadUrl } from '@/shared/lib/presigned-upload-url'

export type JaHistoryUploadPurpose =
  | 'JA_HISTORY_HERO_IMAGE'
  | 'JA_HISTORY_WORLD_TIMELINE_IMAGE'
  | 'JA_HISTORY_KOREA_TIMELINE_IMAGE'
  | 'JA_HISTORY_PHILOSOPHY_CARD_IMAGE'
  | 'JA_HISTORY_CTA_IMAGE'

type PrepareRuntime = {
  assetId?: number
  version?: number
  method?: string
  uploadUrl?: string
  requiredHeaders?: Record<string, string>
  uploadToken?: string
}

export async function uploadJaHistoryImageAsset(
  file: File,
  purpose: JaHistoryUploadPurpose,
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
    throw new Error('이미지 업로드 준비에 실패했습니다.')
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
    throw new Error(`이미지 업로드에 실패했습니다. (${uploadRes.status})`)
  }

  const uploadToken = prepared.uploadToken ?? ''
  await assetsApi.confirmUpload(assetId, {
    version,
    uploadToken,
  })

  return assetId
}
