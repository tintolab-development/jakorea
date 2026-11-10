/**
 * 첨부파일 다운로드 트리거
 * - fileUrl이 실제 리소스이면 링크로 시도, 아니면 placeholder blob으로 파일명만 맞춰 다운로드
 * - 이력 기록 성공 후에만 저장
 */
import { recordFileDownload } from '@/entities/download-log/api/download-log-service'
import {
  downloadAdminFile,
  fileObjectIdFromAdminFileUrl,
  toSameOriginApiPath,
} from '@/shared/lib/admin-file-upload/attachments'
import { getApiBaseUrl } from '@/shared/lib/api-remote-env'
import { customInstance } from '@/shared/api/orval-mutator'
import { downloadBlob, sanitizeDownloadFileName } from '@/shared/utils/file-download'
import { guardAdminDownload } from '@/shared/lib/session-admin-role'

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

async function trackDownload(fileName: string): Promise<void> {
  const user = readRuntimeAuthUser()
  // ipAddress 생략 — 서버가 요청 IP를 기록
  await recordFileDownload({
    fileName,
    userId: user?.id ?? 'unknown-user',
    userName: user?.name ?? '알 수 없음',
  })
}

/**
 * 파일 다운로드 실행 (파일명으로 저장)
 * @param fileName 저장할 파일명
 * @param fileUrl 다운로드 URL (없거나 mock이면 placeholder 내용으로 저장)
 */
export async function downloadFile(rawFileName: string, fileUrl?: string): Promise<void> {
  if (!guardAdminDownload()) return
  const fileName = sanitizeDownloadFileName(rawFileName)

  const storedFileId = fileUrl ? fileObjectIdFromAdminFileUrl(fileUrl) : null
  if (storedFileId != null) {
    await downloadAdminFile({ fileObjectId: storedFileId, fileName })
    return
  }

  await trackDownload(fileName)

  if (fileUrl?.startsWith('blob:')) {
    const response = await fetch(fileUrl)
    if (!response.ok) {
      throw new Error('첨부파일 다운로드에 실패했습니다.')
    }
    await downloadBlob(await response.blob(), fileName, { skipAccessLog: true })
    return
  }

  const sameOriginPath = fileUrl ? toSameOriginApiPath(fileUrl, getApiBaseUrl()) : null
  if (sameOriginPath) {
    const blob = await customInstance<Blob>(
      { url: sameOriginPath, method: 'GET', responseType: 'blob' },
      { skipGlobalErrorAlert: true, skipAuth: true }
    )
    await downloadBlob(blob, fileName, { skipAccessLog: true })
    return
  }

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
