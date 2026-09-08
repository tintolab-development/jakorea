import type { EducationInProgressFile } from '../model/types'

/** Mock 첨부 다운로드. API 연동 시 실제 파일 URL로 교체 */
export function downloadEducationNoticeFile(file: EducationInProgressFile) {
  const fileName = file.fileName.trim() || '첨부파일'
  const blob = new Blob([`${fileName}\n`], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName.includes('.') ? fileName : `${fileName}.txt`
  link.click()
  URL.revokeObjectURL(url)
}
