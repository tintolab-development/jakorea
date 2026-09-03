import { AnnotationMode, getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import type { PDFDocumentLoadingTask, PDFPageProxy } from 'pdfjs-dist'
import type { PageViewport } from 'pdfjs-dist'
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import {
  getPdfAnnotationPreviewText,
  type PdfAnnotationPreview,
} from '@/features/template/lib/pdf-annotation-preview-text'

/** 성범죄 동의서 A4 미리보기 슬롯 폭 — `.crime-consent-doc-modal__a4-img` 와 동일 */
export const CRIME_CONSENT_A4_PREVIEW_WIDTH_PX = 1146
const RENDER_PIXEL_RATIO = 2

let workerConfigured = false

function ensurePdfWorker() {
  if (workerConfigured) return
  GlobalWorkerOptions.workerSrc = pdfWorkerSrc
  workerConfigured = true
}

function toRgb(color: ArrayLike<number> | undefined): string {
  if (color == null || color.length < 3) return '#111111'
  const r = Math.round(Number(color[0]) <= 1 ? Number(color[0]) * 255 : Number(color[0]))
  const g = Math.round(Number(color[1]) <= 1 ? Number(color[1]) * 255 : Number(color[1]))
  const b = Math.round(Number(color[2]) <= 1 ? Number(color[2]) * 255 : Number(color[2]))
  return `rgb(${r}, ${g}, ${b})`
}

function paintInk(
  context: CanvasRenderingContext2D,
  viewport: PageViewport,
  annotation: PdfAnnotationPreview
) {
  if (annotation.inkLists == null) return
  context.save()
  context.strokeStyle = toRgb(annotation.color)
  context.lineWidth = 2 * viewport.scale
  context.lineJoin = 'round'
  context.lineCap = 'round'
  for (const stroke of annotation.inkLists) {
    context.beginPath()
    stroke.forEach((point, index) => {
      const x = Array.isArray(point) ? Number(point[0]) : point.x
      const y = Array.isArray(point) ? Number(point[1]) : point.y
      const [vx, vy] = viewport.convertToViewportPoint(x, y)
      if (index === 0) context.moveTo(vx, vy)
      else context.lineTo(vx, vy)
    })
    context.stroke()
  }
  context.restore()
}

function paintTextInRect(
  context: CanvasRenderingContext2D,
  viewport: PageViewport,
  rect: number[],
  text: string,
  fontSize?: number
) {
  const [x1, y1, x2, y2] = rect
  const [vx1, vy1] = viewport.convertToViewportPoint(x1, y1)
  const [vx2, vy2] = viewport.convertToViewportPoint(x2, y2)
  const left = Math.min(vx1, vx2)
  const top = Math.min(vy1, vy2)
  const width = Math.max(8, Math.abs(vx2 - vx1))
  const height = Math.max(8, Math.abs(vy2 - vy1))
  const size = Math.max(12, Math.min(fontSize ? fontSize * viewport.scale : height * 0.62, height))
  context.save()
  context.fillStyle = '#111111'
  context.font = `600 ${size}px sans-serif`
  context.textBaseline = 'middle'
  context.fillText(text, left + 4, top + height / 2, Math.max(8, width - 8))
  context.restore()
}

async function paintAnnotationOverlays(
  page: PDFPageProxy,
  context: CanvasRenderingContext2D,
  viewport: PageViewport
) {
  const annotations = (await page.getAnnotations({ intent: 'display' })) as PdfAnnotationPreview[]
  for (const annotation of annotations) {
    const subtype = annotation.subtype ?? ''
    if (subtype === 'Link' || subtype === 'Popup') continue
    if (subtype === 'Ink') {
      paintInk(context, viewport, annotation)
      continue
    }
    const text = getPdfAnnotationPreviewText(annotation)
    if (text === '' || annotation.rect == null || annotation.rect.length < 4) continue
    paintTextInRect(context, viewport, annotation.rect, text, annotation.fontSize)
  }
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
  // display + ENABLE: Preview/Acrobat 작성 주석 모양을 그린다.
  // print intent는 인쇄 플래그 없는 작성 주석을 빼서 공란으로 보인다.
  await page.render({
    canvas,
    canvasContext: context,
    viewport,
    intent: 'display',
    annotationMode: AnnotationMode.ENABLE,
  }).promise
  await paintAnnotationOverlays(page, context, viewport)
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
