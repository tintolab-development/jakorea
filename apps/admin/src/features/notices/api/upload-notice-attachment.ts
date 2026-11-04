/**
 * JA_NOTICE_ATTACHMENT asset prepare → binary upload → confirm
 */

import { getJAKoreaHomepageAdminAPIAssetsSubset } from '@/shared/api/generated/assets/assets-api'
import { contentTypeForAttachmentUpload } from '@/shared/lib/attachment-policy'
import { resolvePresignedUploadUrl } from '@/shared/lib/presigned-upload-url'

type PrepareRuntime = {
  assetId?: number
  version?: number
  method?: string
  uploadUrl?: string
  requiredHeaders?: Record<string, string>
  uploadToken?: string
}

export async function uploadNoticeAttachmentAsset(file: File): Promise<number> {
  const assetsApi = getJAKoreaHomepageAdminAPIAssetsSubset()
  const prepared = (await assetsApi.prepareUpload({
    purpose: 'JA_NOTICE_ATTACHMENT',
    originalName: file.name,
    contentType: contentTypeForAttachmentUpload(file),
    sizeBytes: file.size,
  })) as PrepareRuntime

  const assetId = prepared.assetId
  const version = prepared.version
  const uploadUrl = prepared.uploadUrl
  if (assetId == null || version == null || !uploadUrl) {
    throw new Error('첨부 파일 업로드 준비에 실패했습니다.')
  }

  const method = (prepared.method ?? 'PUT').toUpperCase()
  const headers: Record<string, string> = {
    ...(prepared.requiredHeaders ?? {}),
  }
  if (!headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = contentTypeForAttachmentUpload(file)
  }

  const uploadRes = await fetch(resolvePresignedUploadUrl(uploadUrl), {
    method,
    headers,
    body: file,
  })
  if (!uploadRes.ok) {
    throw new Error(`첨부 파일 업로드에 실패했습니다. (${uploadRes.status})`)
  }

  const uploadToken = prepared.uploadToken ?? ''
  await assetsApi.confirmUpload(assetId, {
    version,
    uploadToken,
  })

  return assetId
}

export async function uploadNoticeInlineImage(file: File): Promise<string> {
  const assetId = await uploadNoticeAttachmentAsset(file)
  const assetsApi = getJAKoreaHomepageAdminAPIAssetsSubset()
  const asset = await assetsApi.getAsset(assetId)
  const url = asset.publicUrl?.trim()
  if (!url) {
    throw new Error('이미지 주소를 받지 못했습니다.')
  }
  return url
}
