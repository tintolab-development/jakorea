export type PdfAnnotationPreview = {
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

export function getPdfAnnotationPreviewText(annotation: PdfAnnotationPreview): string {
  const fromContents = readPreviewString(annotation.contents)
  if (fromContents !== '') return fromContents
  const fromObj = readPreviewString(annotation.contentsObj)
  if (fromObj !== '') return fromObj
  const value = annotation.fieldValue
  if (Array.isArray(value)) return value.filter(item => item.trim() !== '').join(', ')
  return readPreviewString(value)
}
