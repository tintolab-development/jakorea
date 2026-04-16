/**
 * 파일 다운로드 유틸리티
 */

import { saveAs } from 'file-saver'
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

function trackDownload(filename: string) {
  const user = readRuntimeAuthUser()
  void recordFileDownload({
    fileName: filename,
    userId: user?.id ?? 'unknown-user',
    userName: user?.name ?? '알 수 없음',
    ipAddress: '14.128.xxx.xxx',
  })
}

/**
 * Blob 파일 다운로드
 */
export function downloadBlob(blob: Blob, filename: string): void {
  saveAs(blob, filename)
  trackDownload(filename)
}

/**
 * Excel 파일 다운로드
 */
export function downloadExcel(buffer: ArrayBuffer, filename: string): void {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  downloadBlob(blob, filename)
}

/**
 * PDF 파일 다운로드
 */
export function downloadPDF(buffer: ArrayBuffer, filename: string): void {
  const blob = new Blob([buffer], {
    type: 'application/pdf',
  })
  downloadBlob(blob, filename)
}

/**
 * 파일명 생성 헬퍼
 */
export function generateFilename(prefix: string, extension: string, date?: Date): string {
  const now = date || new Date()
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '')
  return `${prefix}_${dateStr}.${extension}`
}





