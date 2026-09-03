import { AnnotationMode, getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import type { PDFDocumentLoadingTask, PDFPageProxy } from 'pdfjs-dist'
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

/** 성범죄 동의서 A4 미리보기 슬롯 폭 — `.crime-consent-doc-modal__a4-img` 와 동일 */
export const CRIME_CONSENT_A4_PREVIEW_WIDTH_PX = 1146
const RENDER_PIXEL_RATIO = 2

let workerConfigured = false

function ensurePdfWorker() {
  if (workerConfigured) return
  GlobalWorkerOptions.workerSrc = pdfWorkerSrc
  workerConfigured = true
}

async function renderPdfPageToObjectUrl(page: PDFPageProxy): Promise<string> {
  const baseViewport = page.getViewport({ scale: 1 })
  const scale = (CRIME_CONSENT_A4_PREVIEW_WIDTH_PX / baseViewport.width) * RENDER_PIXEL_RATIO
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.floor(viewport.width))
  canvas.height = Math.max(1, Math.floor(viewport.height))
  const context = canvas.getContext('2d')
  if (context == null) {
    throw new Error('canvas context unavailable')
  }
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  await page.render({
    canvas,
    canvasContext: context,
    viewport,
    intent: 'print',
    annotationMode: AnnotationMode.ENABLE,
  }).promise
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(result => {
      if (result) {
        resolve(result)
        return
      }
      reject(new Error('pdf page encode failed'))
    }, 'image/png')
  })
  return URL.createObjectURL(blob)
}

async function renderPdfBytesToPageObjectUrls(bytes: Uint8Array): Promise<string[]> {
  ensurePdfWorker()
  // pdf.js가 TypedArray를 worker로 transfer하므로 복사본을 넘긴다.
  const loadingTask: PDFDocumentLoadingTask = getDocument({
    data: bytes.slice(),
    enableXfa: true,
  })
  const pdf = await loadingTask.promise
  const urls: string[] = []
  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber)
      urls.push(await renderPdfPageToObjectUrl(page))
    }
    return urls
  } catch (error) {
    urls.forEach(url => URL.revokeObjectURL(url))
    throw error
  } finally {
    await pdf.cleanup()
    await loadingTask.destroy()
  }
}

export async function renderPdfFileToPageObjectUrls(file: File): Promise<string[]> {
  return renderPdfBytesToPageObjectUrls(new Uint8Array(await file.arrayBuffer()))
}

/** PDF를 브라우저 뷰어 없이 페이지별 PNG object URL로 렌더한다. */
export async function renderPdfSrcToPageObjectUrls(src: string): Promise<string[]> {
  const response = await fetch(src)
  if (!response.ok) throw new Error('pdf fetch failed')
  return renderPdfBytesToPageObjectUrls(new Uint8Array(await response.arrayBuffer()))
}
