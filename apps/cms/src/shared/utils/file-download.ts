/**
 * 파일 다운로드 유틸리티
 */

import { saveAs } from 'file-saver'

/**
 * Blob 파일 다운로드
 */
export function downloadBlob(blob: Blob, filename: string): void {
  saveAs(blob, filename)
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

