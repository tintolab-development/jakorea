import type { PDFPageProxy, PageViewport } from 'pdfjs-dist'

/**
 * 제출한 성범죄 동의서 원본 PDF를 브라우저 PDF 뷰어 없이 페이지별 PNG object URL로 그린다.
 * CMS `features/template/lib/render-pdf-preview-pages.ts`와 같은 방식(작성 주석 표시 포함).
 * pdfjs는 미리보기를 열 때만 불러온다.
 */
const PREVIEW_WIDTH_PX = 1146
const RENDER_PIXEL_RATIO = 2

type PdfAnnotationPreview = {
  subtype?: string
  rect?: number[]
  contents?: unknown
  contentsObj?: { str?: string }
  fieldValue?: string | string[]
  fontSize?: number
  color?: ArrayLike<number>
  inkLists?: Array<Array<{ x: number; y: number } | number[]>>
}

function readPreviewString(value: unknown): string {
  if (typeof value === 'string' && value.trim() !== '') return value
  if (value != null && typeof value === 'object' && 'str' in value) {
    const inner = (value as { str?: unknown }).str
    if (typeof inner === 'string' && inner.trim() !== '') return inner
  }
  return ''
}

function getAnnotationPreviewText(annotation: PdfAnnotationPreview): string {
  const fromContents = readPreviewString(annotation.contents)
  if (fromContents !== '') return fromContents
  const fromObj = readPreviewString(annotation.contentsObj)
  if (fromObj !== '') return fromObj
  const value = annotation.fieldValue
  if (Array.isArray(value)) return value.filter(item => item.trim() !== '').join(', ')
  return readPreviewString(value)
}

function toRgb(color: ArrayLike<number> | undefined): string {
  if (color == null || color.length < 3) return '#111111'
  const channel = (value: number) => Math.round(value <= 1 ? value * 255 : value)
  return `rgb(${channel(Number(color[0]))}, ${channel(Number(color[1]))}, ${channel(Number(color[2]))})`
}

function paintInk(
  context: CanvasRenderingContext2D,
  viewport: PageViewport,
  annotation: PdfAnnotationPreview,
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
  fontSize?: number,
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
  viewport: PageViewport,
) {
  const annotations = (await page.getAnnotations({ intent: 'display' })) as PdfAnnotationPreview[]
  for (const annotation of annotations) {
    const subtype = annotation.subtype ?? ''
    if (subtype === 'Link' || subtype === 'Popup') continue
    if (subtype === 'Ink') {
      paintInk(context, viewport, annotation)
      continue
    }
    const text = getAnnotationPreviewText(annotation)
    if (text === '' || annotation.rect == null || annotation.rect.length < 4) continue
    paintTextInRect(context, viewport, annotation.rect, text, annotation.fontSize)
  }
}

async function renderPageToObjectUrl(page: PDFPageProxy, annotationModeEnable: number): Promise<string> {
  const baseViewport = page.getViewport({ scale: 1 })
  const scale = (PREVIEW_WIDTH_PX / baseViewport.width) * RENDER_PIXEL_RATIO
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.floor(viewport.width))
  canvas.height = Math.max(1, Math.floor(viewport.height))
  const context = canvas.getContext('2d')
  if (context == null) throw new Error('canvas context unavailable')
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  await page.render({
    canvas,
    canvasContext: context,
    viewport,
    intent: 'display',
    annotationMode: annotationModeEnable,
  }).promise
  await paintAnnotationOverlays(page, context, viewport)
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(result => (result ? resolve(result) : reject(new Error('pdf page encode failed'))), 'image/png')
  })
  return URL.createObjectURL(blob)
}

export async function renderCrimeConsentPdfToPageObjectUrls(pdfBlob: Blob): Promise<string[]> {
  const [{ AnnotationMode, getDocument, GlobalWorkerOptions }, { default: workerSrc }] =
    await Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')])
  if (!GlobalWorkerOptions.workerSrc) GlobalWorkerOptions.workerSrc = workerSrc
  const loadingTask = getDocument({ data: new Uint8Array(await pdfBlob.arrayBuffer()), enableXfa: true })
  const pdf = await loadingTask.promise
  const urls: string[] = []
  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber)
      urls.push(await renderPageToObjectUrl(page, AnnotationMode.ENABLE))
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
