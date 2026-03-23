/**
 * 첨부파일 다운로드 트리거
 * - fileUrl이 실제 리소스이면 링크로 시도, 아니면 placeholder blob으로 파일명만 맞춰 다운로드
 */

/**
 * 파일 다운로드 실행 (파일명으로 저장)
 * @param fileName 저장할 파일명
 * @param fileUrl 다운로드 URL (없거나 mock이면 placeholder 내용으로 저장)
 */
export function downloadFile(fileName: string, fileUrl?: string): void {
  const isRealUrl =
    fileUrl &&
    (fileUrl.startsWith('http://') || fileUrl.startsWith('https://'))

  if (isRealUrl) {
    const a = document.createElement('a')
    a.href = fileUrl
    a.download = fileName
    a.rel = 'noopener noreferrer'
    a.target = '_blank'
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
