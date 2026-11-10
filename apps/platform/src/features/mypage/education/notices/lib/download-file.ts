import { downloadAttachment } from '@/shared/lib/download-attachment'
import { resolveApplicationNoticeAttachmentUrl } from '../../applications/api/activity-client'
import type { EducationInProgressFile } from '../model/types'
import { toRuleDownloadFileName } from '@/shared/lib/download-file-name'

/** Mock 첨부 다운로드. API 연동 시 실제 파일 URL로 교체 */
export function downloadEducationNoticeFile(file: EducationInProgressFile) {
  const fileName = file.fileName.trim() || '첨부파일'
  const blob = new Blob([`${fileName}\n`], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = toRuleDownloadFileName(fileName.includes('.') ? fileName : `${fileName}.txt`)
  link.click()
  URL.revokeObjectURL(url)
}

/** 원격 첨부: 회원 Bearer 로 서명 URL 을 받은 뒤 파일을 저장한다. */
export async function downloadRemoteEducationNoticeFile(
  file: EducationInProgressFile & { downloadPath: string },
): Promise<void> {
  const url = await resolveApplicationNoticeAttachmentUrl(file.downloadPath)
  await downloadAttachment(file.fileName, url)
}

export function hasRemoteDownloadPath(
  file: EducationInProgressFile,
): file is EducationInProgressFile & { downloadPath: string } {
  return Boolean(file.downloadPath)
}
