import type { InternalAxiosRequestConfig } from 'axios'
import { axiosClient } from '@/shared/api/axios-instance'
import {
  fetchBlobOnce,
  readDownloadUrlFromJsonBlob,
  toProxiedApiPath,
} from './download-attachment'
import {
  portalPublicFileContentUrl,
  portalPublicFileDownloadUrl,
} from './portal-public-file-url'

type SkipAuthConfig = InternalAxiosRequestConfig & {
  skipAuth?: boolean
  skipRefresh?: boolean
}

async function fetchPublicFileBlob(url: string): Promise<Blob> {
  const proxied = toProxiedApiPath(url)
  if (proxied) {
    const { data } = await axiosClient.get<Blob>(proxied, {
      responseType: 'blob',
      skipAuth: true,
      skipRefresh: true,
      headers: { Accept: 'image/*,*/*' },
    } as SkipAuthConfig)
    return data
  }
  return fetchBlobOnce(url)
}

/**
 * 공개 content/download 는 JSON `{ downloadUrl }` 이거나 바이트다.
 * `<img src="/api/portal/public/files/{id}/content">` 만으로는 alt만 남는 경우가 있어
 * 서명 URL 또는 blob URL 로 풀어 준다.
 */
export async function resolvePortalPublicImageSrc(fileObjectId: number): Promise<string> {
  const candidates = [
    `${portalPublicFileContentUrl(fileObjectId)}?inline=1`,
    portalPublicFileContentUrl(fileObjectId),
    portalPublicFileDownloadUrl(fileObjectId),
  ]
  let lastError: unknown
  for (const url of candidates) {
    try {
      const blob = await fetchPublicFileBlob(url)
      const signed = await readDownloadUrlFromJsonBlob(blob)
      if (signed) return signed
      if (blob.size > 0 && !/\bjson\b/i.test(blob.type)) {
        return URL.createObjectURL(blob)
      }
    } catch (error) {
      lastError = error
    }
  }
  throw lastError instanceof Error ? lastError : new Error('이미지를 열 수 없습니다.')
}
