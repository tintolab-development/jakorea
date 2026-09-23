import { downloadAdminFile } from '@/shared/lib/admin-file-upload'
import { downloadFile } from '@/shared/lib/file-download'
import type { MailSendHistoryAttachment } from '@/features/notifications/model/mail-send-history/types'

function parseFileObjectIdFromDownloadHint(hint?: string): number | null {
  const match = /\/files\/(\d+)\/download(?:\?|$)/.exec(hint?.trim() ?? '')
  if (!match) return null
  const id = Number(match[1])
  return Number.isFinite(id) && id >= 1 ? id : null
}

/** 메일 발송 상세 첨부 다운로드 — downloadHint/fileObjectId → files download API */
export async function downloadMailSendHistoryAttachment(
  attachment: MailSendHistoryAttachment
): Promise<void> {
  const fileName = attachment.fileName.trim() || 'attachment.bin'
  const fileObjectId =
    attachment.fileObjectId ?? parseFileObjectIdFromDownloadHint(attachment.downloadHint)

  if (fileObjectId == null) {
    // remote id 없으면 mock placeholder (로컬 mock 행)
    const blob = new Blob(
      [`[JA Korea CMS] 메일 첨부 mock 파일입니다.\n파일명: ${fileName}\n`],
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

/** @deprecated use downloadMailSendHistoryAttachment */
export async function downloadMailAttachmentMock(fileName: string): Promise<void> {
  await downloadMailSendHistoryAttachment({ fileName })
}
