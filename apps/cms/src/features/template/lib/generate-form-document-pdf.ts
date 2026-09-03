import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { downloadBlob } from '@/shared/utils/file-download'

/**
 * 미리보기와 동일한 A4 DOM 노드(권장: `data-form-document-pdf-page`가 붙은 루트)를 순서대로 캡처해 PDF Blob을 반환한다.
 */
export async function generateFormDocumentPdfBlobFromPageElements(
  pageElements: HTMLElement[]
): Promise<Blob> {
  if (pageElements.length === 0) {
    throw new Error('PDF로보낼 페이지가 없습니다')
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  })
  const pageWidthMm = pdf.internal.pageSize.getWidth()
  const pageHeightMm = pdf.internal.pageSize.getHeight()

  for (let i = 0; i < pageElements.length; i += 1) {
    if (i > 0) {
      pdf.addPage()
    }
    const el = pageElements[i]
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    })
    const imgData = canvas.toDataURL('image/jpeg', 0.92)
    pdf.addImage(imgData, 'JPEG', 0, 0, pageWidthMm, pageHeightMm, undefined, 'FAST')
  }

  return pdf.output('blob')
}

/**
 * 미리보기와 동일한 A4 DOM 노드(권장: `data-form-document-pdf-page`가 붙은 루트)를 순서대로 캡처해 단일 PDF로 저장한다.
 */
export async function downloadFormDocumentPdfFromPageElements(
  pageElements: HTMLElement[],
  fileName: string
): Promise<void> {
  const blob = await generateFormDocumentPdfBlobFromPageElements(pageElements)
  const normalizedFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`
  await downloadBlob(blob, normalizedFileName)
}

/** 컨테이너 하위의 `[data-form-document-pdf-page]` 노드를 위에서 아래 순으로 모은다 */
export function collectFormDocumentPdfPageElements(root: HTMLElement): HTMLElement[] {
  const nodes = root.querySelectorAll<HTMLElement>('[data-form-document-pdf-page]')
  return Array.from(nodes)
}
