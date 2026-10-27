import { axiosClient } from '@/shared/api/axios-instance'
import { fetchPortalSignedDownloadBlob } from '@/shared/lib/portal-signed-download-fetch'

const DEFAULT_PURPOSE = '회원 마이페이지 파일 미리보기'

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

async function fetchMemberFileObjectBlob(
  fileObjectId: number,
  purpose: string,
): Promise<Blob> {
  const { data } = await axiosClient.post(
    `/api/portal/me/files/${encodeURIComponent(String(fileObjectId))}/download-requests`,
    { purpose },
  )
  const body = unwrapEnvelope<FileDownload>(data)
  const downloadUrl = body.downloadUrl?.trim()
  if (!downloadUrl) {
    throw new Error('download url missing')
  }
  const blob = await fetchPortalSignedDownloadBlob(downloadUrl, body.requiredHeaders, {
    acceptAnyContent: true,
  })
  if (blob.size === 0 || /\bjson\b/i.test(blob.type)) {
    throw new Error('empty file blob')
  }
  return blob
}

const imageSrcByFileObjectId = new Map<number, Promise<string>>()

/**
 * 회원 소유 파일(강의보고서 첨부 등) 미리보기 URL.
 * 공개 `/api/portal/public/files` 가 아닌 `/me/files/.../download-requests` 1회만 호출한다.
 * 동일 fileObjectId는 세션 내 Promise 캐시로 dedupe 한다.
 */
export async function resolvePortalMemberImageSrc(
  fileObjectId: number,
  purpose = DEFAULT_PURPOSE,
): Promise<string> {
  if (!Number.isSafeInteger(fileObjectId) || fileObjectId <= 0) {
    throw new Error('invalid fileObjectId')
  }

  const cached = imageSrcByFileObjectId.get(fileObjectId)
  if (cached) return cached

  const pending = fetchMemberFileObjectBlob(fileObjectId, purpose).then(blob =>
    URL.createObjectURL(blob),
  )
  imageSrcByFileObjectId.set(fileObjectId, pending)
  pending.catch(() => {
    imageSrcByFileObjectId.delete(fileObjectId)
  })
  return pending
}
