/**
 * 첨부파일 다운로드.
 * 실 URL은 새 탭/미리보기로 열지 않고 blob으로 받아 파일명으로 저장한다.
 */

function saveObjectUrl(href: string, fileName: string): void {
  const a = document.createElement('a')
  a.href = href
  a.download = fileName
  a.rel = 'noopener noreferrer'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

async function saveRemoteUrl(fileUrl: string, fileName: string): Promise<void> {
  const response = await fetch(fileUrl, {
    method: 'GET',
    credentials: 'omit',
    mode: 'cors',
  })
  if (!response.ok) {
    throw new Error(`첨부파일 다운로드에 실패했습니다. (${response.status})`)
  }
  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  saveObjectUrl(objectUrl, fileName)
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
}

export async function downloadFile(fileName: string, fileUrl?: string): Promise<void> {
  const name = fileName.trim() || 'download'
  const url = fileUrl?.trim()

  if (url && (url.startsWith('data:') || url.startsWith('blob:'))) {
    saveObjectUrl(url, name)
    return
  }

  if (url && /^https?:\/\//i.test(url)) {
    await saveRemoteUrl(url, name)
    return
  }

  const blob = new Blob([`첨부파일: ${name}\n(다운로드 가능한 파일입니다.)`], {
    type: 'text/plain;charset=utf-8',
  })
  const objectUrl = URL.createObjectURL(blob)
  saveObjectUrl(objectUrl, name)
  URL.revokeObjectURL(objectUrl)
}
