/**
 * 첨부 파일 다운로드.
 * mock 등 실파일이 없을 때도 파일명의 확장자와 MIME을 유지한 빈 파일로 저장한다.
 * 실 URL은 앵커로 열지 않고 blob으로 받아 저장한다.
 *
 * Portal `GET /api/portal/public/files/{id}/download` 는 파일 바이트가 아니라
 * `{ downloadUrl }` JSON(signed raw URL)을 주는 경우가 있다. 그 URL로 한 번 더 받는다.
 */

import type { InternalAxiosRequestConfig } from 'axios'
import { axiosClient } from '@/shared/api/axios-instance'
import { getApiBaseUrl } from '@/shared/lib/api-remote-env'
import { toRuleDownloadFileName } from '@/shared/lib/download-file-name'

type SkipAuthConfig = InternalAxiosRequestConfig & {
  skipAuth?: boolean
  skipRefresh?: boolean
}

const EXT_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  hwp: 'application/x-hwp',
  hwpx: 'application/hwp+zip',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip',
  rar: 'application/vnd.rar',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  txt: 'text/plain;charset=utf-8',
}

export function getAttachmentFileExtension(fileName: string): string {
  const base = fileName.trim().split(/[/\\]/).pop() ?? fileName
  const dot = base.lastIndexOf('.')
  if (dot <= 0 || dot === base.length - 1) return ''
  return base.slice(dot + 1).toLowerCase()
}

export function getEmptyAttachmentMimeType(fileName: string): string {
  const ext = getAttachmentFileExtension(fileName)
  return EXT_MIME[ext] ?? 'application/octet-stream'
}

/** `#` / 빈 값이면 빈 파일 폴백이 필요 */
export function needsEmptyAttachmentFallback(url: string | undefined): boolean {
  const value = url?.trim() ?? ''
  return !value || value === '#' || value.startsWith('#')
}

/**
 * absolute `http(s)://…/api/…` 또는 `/api/…` 를 Vite 프록시 경로로 맞춘다.
 * `VITE_API_BASE_URL` 유무와 관계없이 same-origin `/api` 로 받는다.
 */
export function toProxiedApiPath(downloadUrl: string): string | null {
  const trimmed = downloadUrl.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('/api/')) return trimmed
  try {
    const url = new URL(trimmed)
    if (!url.pathname.startsWith('/api/')) return null
    return `${url.pathname}${url.search}`
  } catch {
    return null
  }
}

/**
 * @deprecated Prefer `toProxiedApiPath`. API base 비어 있을 때만 absolute→relative 변환하던 구버전.
 */
function toSameOriginApiPath(downloadUrl: string, apiBaseUrl: string): string | null {
  if (apiBaseUrl.trim() || !/^https?:\/\//i.test(downloadUrl)) return null
  return toProxiedApiPath(downloadUrl)
}

function saveBlob(fileName: string, blob: Blob) {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = toRuleDownloadFileName(fileName)
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
}

export function readDownloadUrlFromJsonBlob(blob: Blob): Promise<string | null> {
  if (!/\bjson\b/i.test(blob.type) && blob.size > 8_192) return Promise.resolve(null)
  return blob.text().then(text => {
    const trimmed = text.trim()
    if (!trimmed.startsWith('{')) return null
    try {
      const parsed = JSON.parse(trimmed) as { downloadUrl?: unknown; data?: { downloadUrl?: unknown } }
      const nested =
        parsed.data && typeof parsed.data === 'object'
          ? (parsed.data as { downloadUrl?: unknown }).downloadUrl
          : undefined
      const raw = parsed.downloadUrl ?? nested
      return typeof raw === 'string' && raw.trim() ? raw.trim() : null
    } catch {
      return null
    }
  })
}

export async function fetchBlobOnce(
  url: string,
  requiredHeaders?: Record<string, string>,
): Promise<Blob> {
  const proxied = toProxiedApiPath(url) ?? toSameOriginApiPath(url, getApiBaseUrl())
  if (proxied) {
    const { data } = await axiosClient.get<Blob>(proxied, {
      responseType: 'blob',
      headers: requiredHeaders,
      skipAuth: true,
      skipRefresh: true,
    } as SkipAuthConfig)
    return data
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: requiredHeaders,
    credentials: 'omit',
    mode: 'cors',
  })
  if (!response.ok) {
    throw new Error(`첨부파일 다운로드에 실패했습니다. (${response.status})`)
  }
  return response.blob()
}

/** 첫 요청이 응답 없이(CORS 차단·연결 실패) 끝났음을 표시 — 브라우저 기본 다운로드로 넘길 수 있다 */
class FirstHopNetworkError extends Error {
  constructor(cause: unknown) {
    super('첨부파일 다운로드 요청이 네트워크 단계에서 막혔습니다.')
    this.name = 'FirstHopNetworkError'
    this.cause = cause
  }
}

/** 응답 자체를 받지 못한 실패인지 (fetch TypeError · axios 응답 없음) */
function isNetworkLevelFailure(error: unknown): boolean {
  if (error instanceof TypeError) return true
  const e = error as { isAxiosError?: boolean; response?: unknown } | null
  return Boolean(e?.isAxiosError && !e.response)
}

async function fetchAttachmentBlob(
  url: string,
  requiredHeaders?: Record<string, string>,
): Promise<Blob> {
  let first: Blob
  try {
    first = await fetchBlobOnce(url, requiredHeaders)
  } catch (error) {
    throw isNetworkLevelFailure(error) ? new FirstHopNetworkError(error) : error
  }
  const signedUrl = await readDownloadUrlFromJsonBlob(first)
  if (!signedUrl) return first
  return fetchBlobOnce(signedUrl, requiredHeaders)
}

/** Portal public file download 등 JSON `{ downloadUrl }` 래퍼를 한 번 더 따라간다. */
export async function fetchResolvedAttachmentBlob(
  url: string,
  requiredHeaders?: Record<string, string>,
): Promise<Blob> {
  return fetchAttachmentBlob(url.trim(), requiredHeaders)
}

/**
 * 브라우저 기본 다운로드 — 서버가 `Content-Disposition: attachment`로 주면 페이지 이동 없이 저장된다.
 * 다른 출처로 리다이렉트되면 `download` 이름은 무시되고 서버 파일명으로 저장된다.
 */
function triggerBrowserDownload(url: string, fileName: string) {
  const anchor = document.createElement('a')
  anchor.href = toProxiedApiPath(url) ?? url
  anchor.download = toRuleDownloadFileName(fileName)
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

/**
 * 첨부 다운로드. 실 URL은 blob으로 받아 파일명으로 저장한다.
 * 없거나 `#`이면 확장자에 맞는 MIME의 빈 Blob을 저장한다.
 * 실패해도 페이지를 이동하거나 새 창을 열지 않는다.
 *
 * 첫 요청이 네트워크 단계에서 막히면(예: 다운로드 API가 CORS 헤더 없는 CloudFront 파일로 302 리다이렉트)
 * 브라우저 기본 다운로드로 넘긴다. 이때 파일명 규칙 대신 서버 파일명이 쓰인다 —
 * 파일 저장소에 CORS가 붙으면 blob 경로로 돌아가 규칙 파일명이 적용된다.
 */
export async function downloadAttachment(
  fileName: string,
  url?: string,
  requiredHeaders?: Record<string, string>,
): Promise<void> {
  const name = fileName.trim() || 'attachment'
  if (typeof document === 'undefined') return

  try {
    if (needsEmptyAttachmentFallback(url)) {
      saveBlob(name, new Blob([], { type: getEmptyAttachmentMimeType(name) }))
      return
    }
    const blob = await fetchAttachmentBlob(url!.trim(), requiredHeaders)
    // JSON 메타만 남은 경우(서명 URL 해석 실패)는 빈 파일로 속이지 않는다.
    if (/\bjson\b/i.test(blob.type)) {
      throw new Error('첨부파일 다운로드에 실패했습니다.')
    }
    saveBlob(name, blob)
  } catch (error) {
    if (error instanceof FirstHopNetworkError && url) {
      console.warn('[attachment] blob download blocked, falling back to browser download', error.cause)
      triggerBrowserDownload(url.trim(), name)
      return
    }
    console.error('[attachment] download failed', error)
    throw error instanceof Error
      ? error
      : new Error('첨부파일을 내려받지 못했습니다.')
  }
}
