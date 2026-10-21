import { axiosClient } from '@/shared/api/axios-instance'
import { fetchPortalSignedDownloadBlob } from '@/shared/lib/portal-signed-download-fetch'
import { fetchPortalSignatureCurrent } from '../api/portal-consent-documents'

const DOWNLOAD_PURPOSE = '회원 마이페이지 동의서 전자서명 확인'

type SignatureFieldRef = {
  signed?: boolean
  signatureFileObjectId?: number
}

type FileDownload = {
  downloadUrl?: string
  requiredHeaders?: Record<string, string>
}

function unwrapEnvelope<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (record.success === true && 'data' in record) {
      return unwrapEnvelope<T>(record.data)
    }
  }
  return payload as T
}

function signatureFileObjectId(fields: SignatureFieldRef[] | undefined): number | undefined {
  const signed = fields?.find(field => field.signed === true && field.signatureFileObjectId != null)
  if (signed?.signatureFileObjectId != null) return signed.signatureFileObjectId
  return fields?.find(field => field.signatureFileObjectId != null)?.signatureFileObjectId
}

async function loadMemberFileObjectUrl(fileObjectId: number): Promise<string | null> {
  const res = await axiosClient.post(
    `/api/portal/me/files/${encodeURIComponent(String(fileObjectId))}/download-requests`,
    { purpose: DOWNLOAD_PURPOSE },
  )
  const body = unwrapEnvelope<FileDownload>(res.data)
  const url = body.downloadUrl?.trim()
  if (!url) return null
  const blob = await fetchPortalSignedDownloadBlob(url, body.requiredHeaders, {
    acceptAnyContent: true,
  })
  if (blob.size === 0) return null
  return URL.createObjectURL(blob)
}

export async function loadConsentPreviewSignature(input: {
  signatureFields?: SignatureFieldRef[]
  signal?: AbortSignal
}): Promise<{ displayName: string; imageSrc: string | null }> {
  let displayName = ''
  let currentFileId: number | undefined
  try {
    const profile = await fetchPortalSignatureCurrent(input.signal)
    displayName = profile.displayName?.trim() ?? ''
    currentFileId = profile.fileObjectId
  } catch {
    displayName = ''
  }

  const fileIds = [signatureFileObjectId(input.signatureFields), currentFileId].filter(
    (id): id is number => id != null,
  )
  const uniqueIds = [...new Set(fileIds)]
  for (const fileObjectId of uniqueIds) {
    try {
      const imageSrc = await loadMemberFileObjectUrl(fileObjectId)
      if (imageSrc) return { displayName, imageSrc }
    } catch {
      continue
    }
  }
  return { displayName, imageSrc: null }
}
