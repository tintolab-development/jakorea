/** mock 첨부 다운로드 — 실 API 연동 전 placeholder blob */
export async function downloadMailAttachmentMock(fileName: string): Promise<void> {
  const name = fileName.trim() || 'attachment.bin'
  const blob = new Blob(
    [`[JA Korea CMS] 메일 첨부 mock 파일입니다.\n파일명: ${name}\n`],
    { type: 'application/octet-stream' }
  )
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = name
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(objectUrl)
}
