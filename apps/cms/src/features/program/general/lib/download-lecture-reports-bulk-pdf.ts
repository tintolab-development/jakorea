import { downloadBlob } from '@/shared/utils/file-download'

export interface LectureReportPdfFile {
  fileName: string
  blob: Blob
}

const BULK_PDF_DOWNLOAD_GAP_MS = 400

function normalizePdfFileName(fileName: string): string {
  return fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`
}

function wait(ms: number): Promise<void> {
  return new Promise(resolve => {
    window.setTimeout(resolve, ms)
  })
}

/** 제출 완료 강의보고서 PDF를 순차 다운로드한다. */
export async function downloadLectureReportPdfFiles(files: LectureReportPdfFile[]): Promise<void> {
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index]
    await downloadBlob(file.blob, normalizePdfFileName(file.fileName))
    if (index < files.length - 1) {
      await wait(BULK_PDF_DOWNLOAD_GAP_MS)
    }
  }
}
