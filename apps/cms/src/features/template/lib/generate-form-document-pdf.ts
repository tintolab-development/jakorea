import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { downloadBlob } from '@/shared/utils/file-download'
import { countPdfImageSlices } from './count-pdf-image-slices'

async function waitForDocumentImages(root: HTMLElement): Promise<void> {
  const deadline = Date.now() + 12_000
  while (Date.now() < deadline) {
    if (root.querySelector('[data-photo-state="loading"]') == null) break
    await new Promise(resolve => {
      window.setTimeout(resolve, 40)
    })
  }
  const images = Array.from(root.querySelectorAll('img'))
  await Promise.all(
    images.map(img => {
      if (img.complete) return Promise.resolve()
      return new Promise<void>(resolve => {
        img.addEventListener('load', () => resolve(), { once: true })
        img.addEventListener('error', () => resolve(), { once: true })
      })
    })
  )
}

/**
 * 미리보기와 동일한 A4 DOM 노드(권장: `data-form-document-pdf-page`가 붙은 루트)를 순서대로 캡처해 PDF Blob을 반환한다.
 * 캡처가 A4보다 길면 이어지는 페이지로 자른다. 한 노드를 A4 높이에 강제로 맞추면 내용이 잘리거나 찌그러진다.
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
  let hasContentPage = false

  for (const el of pageElements) {
    await waitForDocumentImages(el)
    const captureWidth = Math.max(el.scrollWidth, el.offsetWidth, 1)
    const captureHeight = Math.max(el.scrollHeight, el.offsetHeight, 1)
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: captureWidth,
      height: captureHeight,
      windowWidth: Math.max(captureWidth, 794),
      windowHeight: Math.max(captureHeight, 1123),
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
    })
    const imgData = canvas.toDataURL('image/jpeg', 0.92)
    const imgHeightMm =
      canvas.width > 0 ? (canvas.height * pageWidthMm) / canvas.width : pageHeightMm
    const sliceCount = countPdfImageSlices(imgHeightMm, pageHeightMm)

    for (let slice = 0; slice < sliceCount; slice += 1) {
      if (hasContentPage) {
        pdf.addPage()
      }
      hasContentPage = true
      if (sliceCount === 1) {
        pdf.addImage(imgData, 'JPEG', 0, 0, pageWidthMm, imgHeightMm, undefined, 'FAST')
      } else {
        pdf.addImage(
          imgData,
          'JPEG',
          0,
          -slice * pageHeightMm,
          pageWidthMm,
          imgHeightMm,
          undefined,
          'FAST'
        )
      }
    }
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
