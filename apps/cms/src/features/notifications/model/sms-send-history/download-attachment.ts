import { downloadAdminFile } from '@/shared/lib/admin-file-upload'
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

  await downloadAdminFile({ fileObjectId, fileName })
}
