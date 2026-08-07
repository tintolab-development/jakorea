/**
 * 첨부파일 다운로드 (mock URL / data URL / placeholder blob)
 */
export function downloadFile(fileName: string, fileUrl?: string): void {
  const isNavigable =
    fileUrl &&
    (fileUrl.startsWith('http://') ||
      fileUrl.startsWith('https://') ||
      fileUrl.startsWith('data:') ||
      fileUrl.startsWith('blob:'))

  if (isNavigable && fileUrl) {
    const a = document.createElement('a')
    a.href = fileUrl
    a.download = fileName
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    a.remove()
    return
  }

  const blob = new Blob([`첨부파일: ${fileName}\n(다운로드 가능한 파일입니다.)`], {
    type: 'text/plain;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
