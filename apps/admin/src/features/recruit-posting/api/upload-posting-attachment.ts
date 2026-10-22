/**
 * CAREERS_POSTING_ATTACHMENT — prepare → PUT → confirm
 * `/api/admin/assets` · JA_NOTICE_ATTACHMENT · uploadToken 사용 금지
 */

import { getJAKoreaHomepageAdminAPICareersSubset } from '@/shared/api/generated/careers/careers-api'
import type { ConfirmRequest } from '@/shared/api/generated/careers/schemas/confirmRequest'
import { resolvePresignedUploadUrl } from '@/shared/lib/presigned-upload-url'

type PrepareRuntime = {
  assetId?: number
  version?: number
  method?: string
  uploadUrl?: string
  requiredHeaders?: Record<string, string>
}

/** OpenAPI ConfirmRequest 는 공개 첨부용 uploadToken 필수지만, Admin 전용 confirm 은 version만 받는다. */
type PostingConfirmBody = Pick<ConfirmRequest, 'version'>

function resolveContentType(file: File): string {
  if (file.type && file.type !== 'application/octet-stream') return file.type
  const name = file.name.toLowerCase()
  if (name.endsWith('.png')) return 'image/png'
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg'
  if (name.endsWith('.pdf')) return 'application/pdf'
  if (name.endsWith('.doc')) return 'application/msword'
  if (name.endsWith('.docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }
  if (name.endsWith('.xls')) return 'application/vnd.ms-excel'
  if (name.endsWith('.xlsx')) {
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  }
  throw new Error('지원하지 않는 첨부 파일 형식입니다.')
}

export async function uploadRecruitPostingAttachmentAsset(file: File): Promise<number> {
  const api = getJAKoreaHomepageAdminAPICareersSubset()
  const prepared = (await api.prepare3({
    originalName: file.name,
    contentType: resolveContentType(file),
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
    headers['Content-Type'] = resolveContentType(file)
  }

  const uploadRes = await fetch(resolvePresignedUploadUrl(uploadUrl), {
    method,
    headers,
    body: file,
  })
  if (!uploadRes.ok) {
    throw new Error(`첨부 파일 업로드에 실패했습니다. (${uploadRes.status})`)
  }

  await api.confirm3(assetId, { version } as PostingConfirmBody as ConfirmRequest)

  return assetId
}
