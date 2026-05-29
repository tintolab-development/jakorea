import {
  collectFormDocumentPdfPageElements,
  downloadFormDocumentPdfFromPageElements,
} from '@/features/template/lib/generate-form-document-pdf'

function waitForChartsToRender(): Promise<void> {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.setTimeout(resolve, 300)
      })
    })
  })
}

export async function exportLectureEvalResultsPdf(
  root: HTMLElement,
  fileName: string
): Promise<void> {
  await waitForChartsToRender()
  const pageElements = collectFormDocumentPdfPageElements(root)
  if (pageElements.length === 0) {
    throw new Error('PDF로 내보낼 결과 영역을 찾을 수 없습니다.')
  }
  await downloadFormDocumentPdfFromPageElements(pageElements, fileName)
}

export function buildLectureEvalResultsPdfFileName(programTitle: string): string {
  const safeTitle = programTitle.trim().replace(/[\\/:*?"<>|]/g, '_') || '프로그램'
  return `${safeTitle}_강의평가결과.pdf`
}
