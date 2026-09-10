import { getFileDownload } from '@/shared/lib/admin-file-upload'
import { downloadFile } from '@/shared/lib/file-download'
import type { SmsSendHistoryAttachment } from '@/features/notifications/model/sms-send-history/types'

function parseFileObjectIdFromDownloadHint(hint?: string): number | null {
  const match = /\/files\/(\d+)\/download(?:\?|$)/.exec(hint?.trim() ?? '')
  if (!match) return null
  const id = Number(match[1])
  return Number.isFinite(id) && id >= 1 ? id : null
}

/** 문자 발송 상세 첨부 다운로드 (MMS) */
export async function downloadSmsSendHistoryAttachment(
  attachment: SmsSendHistoryAttachment
): Promise<void> {
  const fileName = attachment.fileName.trim() || 'attachment.bin'
  const fileObjectId =
    attachment.fileObjectId ?? parseFileObjectIdFromDownloadHint(attachment.downloadHint)

  if (fileObjectId == null) {
    const blob = new Blob(
      [`[JA Korea CMS] 문자 첨부 mock 파일입니다.\n파일명: ${fileName}\n`],
      { type: 'application/octet-stream' }
    )
    const objectUrl = URL.createObjectURL(blob)
    try {
      await downloadFile(fileName, objectUrl)
    } finally {
      URL.revokeObjectURL(objectUrl)
    }
    return
  }

  const resolved = await getFileDownload(fileObjectId)
  const downloadUrl = resolved.downloadUrl?.trim()
  if (!downloadUrl) {
    throw new Error('첨부파일 다운로드 URL을 받지 못했습니다.')
  }
  const requiredHeaders = resolved.requiredHeaders ?? {}
  const extraHeaders = Object.entries(requiredHeaders).filter(([, value]) => Boolean(value))
  if (extraHeaders.length === 0) {
    await downloadFile(fileName, downloadUrl)
    return
  }
  const headers = new Headers()
  for (const [key, value] of extraHeaders) {
    headers.set(key, value)
  }
  const response = await fetch(downloadUrl, {
    method: 'GET',
    headers,
    credentials: 'omit',
    mode: 'cors',
  })
  if (!response.ok) {
    throw new Error(`첨부파일 다운로드에 실패했습니다. (${response.status})`)
  }
  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  try {
    await downloadFile(fileName, objectUrl)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
