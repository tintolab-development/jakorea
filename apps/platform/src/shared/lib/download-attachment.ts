/**
 * 첨부 파일 다운로드.
 * mock 등 실파일이 없을 때도 파일명의 확장자와 MIME을 유지한 빈 파일로 저장한다.
 * 실 URL은 앵커로 열지 않고 blob으로 받아 저장한다.
 */

import type { InternalAxiosRequestConfig } from 'axios'
import { axiosClient } from '@/shared/api/axios-instance'
import { getApiBaseUrl } from '@/shared/lib/api-remote-env'

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
 * API base가 비어 있으면 `http(s)://host/api/...`를 페이지와 같은 `/api` 경로로 되돌린다.
 * 다른 출처 `<a download>`는 속성이 무시되고 이미지가 새 창에 열린다.
 */
function toSameOriginApiPath(downloadUrl: string, apiBaseUrl: string): string | null {
  if (apiBaseUrl.trim() || !/^https?:\/\//i.test(downloadUrl)) return null
  try {
    const url = new URL(downloadUrl)
    if (!url.pathname.startsWith('/api/')) return null
    return `${url.pathname}${url.search}`
  } catch {
    return null
  }
}

function saveBlob(fileName: string, blob: Blob) {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
}

async function fetchAttachmentBlob(url: string): Promise<Blob> {
  const sameOriginPath = toSameOriginApiPath(url, getApiBaseUrl())
  const apiPath = sameOriginPath ?? (url.startsWith('/api/') ? url : null)
  if (apiPath) {
    const { data } = await axiosClient.get<Blob>(apiPath, {
      responseType: 'blob',
      skipAuth: true,
      skipRefresh: true,
    } as SkipAuthConfig)
    return data
  }

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'omit',
    mode: 'cors',
  })
  if (!response.ok) {
    throw new Error(`첨부파일 다운로드에 실패했습니다. (${response.status})`)
  }
  return response.blob()
}

/**
 * 첨부 다운로드. 실 URL은 blob으로 받아 파일명으로 저장한다.
 * 없거나 `#`이면 확장자에 맞는 MIME의 빈 Blob을 저장한다.
 * 실패해도 페이지를 이동하거나 새 창을 열지 않는다.
 */
export async function downloadAttachment(fileName: string, url?: string): Promise<void> {
  const name = fileName.trim() || 'attachment'
  if (typeof document === 'undefined') return

  try {
    if (needsEmptyAttachmentFallback(url)) {
      saveBlob(name, new Blob([], { type: getEmptyAttachmentMimeType(name) }))
      return
    }
    const blob = await fetchAttachmentBlob(url!.trim())
    saveBlob(name, blob)
  } catch (error) {
    console.error('[attachment] download failed', error)
  }
}
