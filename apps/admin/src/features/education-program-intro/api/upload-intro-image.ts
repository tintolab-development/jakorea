/**
 * EDUCATION_PROGRAM_INTRO_IMAGE prepare → binary upload → confirm
 */

import { getJAKoreaHomepageAdminAPIAssetsSubset } from '@/shared/api/generated/assets/assets-api'
import { resolvePresignedUploadUrl } from '@/shared/lib/presigned-upload-url'

type PrepareRuntime = {
  assetId?: number
  version?: number
  method?: string
  uploadUrl?: string
  requiredHeaders?: Record<string, string>
  uploadToken?: string
}

export async function uploadEducationProgramIntroImage(file: File): Promise<number> {
  const assetsApi = getJAKoreaHomepageAdminAPIAssetsSubset()
  const prepared = (await assetsApi.prepareUpload({
    purpose: 'EDUCATION_PROGRAM_INTRO_IMAGE',
    originalName: file.name,
    contentType: file.type || 'image/jpeg',
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
    headers['Content-Type'] = file.type || 'image/jpeg'
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
