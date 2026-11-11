import { generateFilename } from '@/shared/utils/file-download'
import {
  collectFormDocumentPdfPageElements,
  downloadFormDocumentPdfFromPageElements,
} from '@/features/template/lib/generate-form-document-pdf'

function waitForChartsToRender(root: HTMLElement): Promise<void> {
  const pageCount = root.querySelectorAll('[data-form-document-pdf-page]').length
  const delayMs = Math.min(1500, 300 + Math.max(0, pageCount - 1) * 120)
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.setTimeout(resolve, delayMs)
      })
    })
  })
}

export async function exportLectureEvalResultsPdf(
  root: HTMLElement,
  fileName: string
): Promise<void> {
  await waitForChartsToRender(root)
  const pageElements = collectFormDocumentPdfPageElements(root)
  if (pageElements.length === 0) {
    throw new Error('PDF로 내보낼 결과 영역을 찾을 수 없습니다.')
  }
  await downloadFormDocumentPdfFromPageElements(pageElements, fileName)
}

export function buildLectureEvalResultsPdfFileName(programTitle: string): string {
  const safeTitle = programTitle.trim().replace(/[\\/:*?"<>|]/g, '_') || '프로그램'
  return generateFilename(`${safeTitle}_강의평가결과`, 'pdf')
}
