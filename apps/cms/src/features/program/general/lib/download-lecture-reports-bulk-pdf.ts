import JSZip from 'jszip'
import { downloadBlob, generateFilename } from '@/shared/utils/file-download'

export interface LectureReportPdfFile {
  fileName: string
  blob: Blob
}

export const LECTURE_REPORT_NO_SUBMITTED_PDF_CTA = '다운로드할 제출 완료 강의보고서가 없습니다.'

export function filterLectureReportBulkPdfRows<
  T extends { canViewReport?: boolean; reportId?: number | null },
>(rows: readonly T[]): T[] {
  return rows.filter(
    row => row.canViewReport === true && typeof row.reportId === 'number' && row.reportId > 0
  )
}

export function normalizeLectureReportPdfFileName(fileName: string): string {
  const sanitized = fileName.replace(/[\\/:*?"<>|]+/g, '_').trim() || '강의보고서'
  return sanitized.toLowerCase().endsWith('.pdf') ? sanitized : `${sanitized}.pdf`
}

export function uniqueLectureReportPdfFileName(fileName: string, used: Set<string>): string {
  const normalized = normalizeLectureReportPdfFileName(fileName)
  const stem = normalized.slice(0, -4)
  let candidate = normalized
  let suffix = 2
  while (used.has(candidate.toLowerCase())) {
    candidate = `${stem}_${suffix}.pdf`
    suffix += 1
  }
  used.add(candidate.toLowerCase())
  return candidate
}

/** 제출 완료 강의보고서 PDF를 내려받는다. 2건 이상은 ZIP. */
export async function downloadLectureReportPdfFiles(files: LectureReportPdfFile[]): Promise<void> {
  if (files.length === 0) return
  if (files.length === 1) {
    const file = files[0]
    await downloadBlob(file.blob, normalizeLectureReportPdfFileName(file.fileName))
    return
  }

  const zip = new JSZip()
  const used = new Set<string>()
  for (const file of files) {
    zip.file(uniqueLectureReportPdfFileName(file.fileName, used), file.blob)
  }
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  await downloadBlob(zipBlob, generateFilename('강의보고서_일괄', 'zip'))
}
