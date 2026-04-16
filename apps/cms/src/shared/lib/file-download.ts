/**
 * 첨부파일 다운로드 트리거
 * - fileUrl이 실제 리소스이면 링크로 시도, 아니면 placeholder blob으로 파일명만 맞춰 다운로드
 */
import { recordFileDownload } from '@/entities/download-log/api/download-log-service'

type RuntimeAuthUser = {
  id?: string
  name?: string
}

function readRuntimeAuthUser(): RuntimeAuthUser | null {
  if (typeof window === 'undefined' || !window.localStorage) return null
  const raw = window.localStorage.getItem('auth_user')
  if (!raw) return null
  try {
    return JSON.parse(raw) as RuntimeAuthUser
  } catch {
    return null
  }
}

function trackDownload(fileName: string) {
  const user = readRuntimeAuthUser()
  void recordFileDownload({
    fileName,
    userId: user?.id ?? 'unknown-user',
    userName: user?.name ?? '알 수 없음',
    ipAddress: '14.128.xxx.xxx',
  })
}

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
    trackDownload(fileName)
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

  trackDownload(fileName)
}
