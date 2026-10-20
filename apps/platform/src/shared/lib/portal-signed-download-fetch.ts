const PORTAL_RAW_DOWNLOAD_PATH_PREFIX = '/api/portal/files/downloads/raw/'

export type LocalNgrokPortalRawDownloadOptions = {
  /** Node selfcheck 등에서 `import.meta.env.DEV` 대체 */
  dev?: boolean
}

/**
 * 로컬 Vite DEV + ngrok 무료 도메인으로 발급된 portal raw Signed URL일 때만 true.
 * AWS DEV/QA/PROD Signed URL에는 false.
 */
export function isLocalNgrokPortalRawDownload(
  url: string,
  options?: LocalNgrokPortalRawDownloadOptions,
): boolean {
  const dev = options?.dev ?? import.meta.env.DEV
  if (!dev) return false

  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname.toLowerCase()
    const isNgrokHost =
      hostname.endsWith('.ngrok-free.app') || hostname.endsWith('.ngrok.app')
    const isPortalRawDownload = parsed.pathname.startsWith(PORTAL_RAW_DOWNLOAD_PATH_PREFIX)

    return parsed.protocol === 'https:' && isNgrokHost && isPortalRawDownload
  } catch {
    return false
  }
}

function buildSignedDownloadRequestHeaders(
  url: string,
  requiredHeaders?: Record<string, string>,
): Headers {
  const headers = new Headers()
  if (requiredHeaders) {
    for (const [key, value] of Object.entries(requiredHeaders)) {
      headers.set(key, value)
    }
  }
  if (isLocalNgrokPortalRawDownload(url)) {
    headers.set('ngrok-skip-browser-warning', 'true')
  }
  return headers
}

function assertNgrokSignedDownloadContentType(contentType: string): void {
  const normalized = contentType.toLowerCase()
  if (normalized.includes('text/html')) {
    throw new Error('PDF가 아닌 응답을 받았습니다. ngrok 또는 파일 응답을 확인해 주세요.')
  }
  if (!normalized.includes('application/pdf')) {
    throw new Error('PDF가 아닌 응답을 받았습니다. ngrok 또는 파일 응답을 확인해 주세요.')
  }
}

/**
 * 서버가 발급한 Signed downloadUrl을 그대로 GET한다.
 * ngrok 개발 환경에서만 `ngrok-skip-browser-warning`을 추가한다.
 */
export async function fetchPortalSignedDownloadBlob(
  downloadUrl: string,
  requiredHeaders?: Record<string, string>,
): Promise<Blob> {
  const url = downloadUrl.trim()
  if (!url) throw new Error('download url missing')

  const headers = buildSignedDownloadRequestHeaders(url, requiredHeaders)
  const response = await fetch(url, {
    method: 'GET',
    headers,
    credentials: 'omit',
    mode: 'cors',
  })

  if (!response.ok) {
    throw new Error(`fetch failed (${response.status})`)
  }

  if (isLocalNgrokPortalRawDownload(url)) {
    assertNgrokSignedDownloadContentType(response.headers.get('Content-Type') ?? '')
  }

  return response.blob()
}
