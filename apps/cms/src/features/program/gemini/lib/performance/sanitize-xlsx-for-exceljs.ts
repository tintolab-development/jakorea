import JSZip from 'jszip'

const COMMENT_REL_TYPE = 'relationships/comments'
const VML_DRAWING_REL_TYPE = 'relationships/vmlDrawing'

function isWorksheetRelsPath(path: string): boolean {
  return path.includes('worksheets/_rels/') && path.endsWith('.rels')
}

function isDisposableCommentPart(path: string): boolean {
  const normalized = path.replace(/\\/g, '/')
  return (
    normalized.includes('/comments/') ||
    normalized.includes('commentsDrawing') ||
    /\/drawings\/.*comment/i.test(normalized)
  )
}

function stripCommentRelationships(relsXml: string): string {
  return relsXml
    .replace(/<Relationship\b[^>]*\/>/g, tag => {
      if (tag.includes(COMMENT_REL_TYPE) || tag.includes(VML_DRAWING_REL_TYPE)) return ''
      return tag
    })
    .replace(/<Relationship\b[^>]*>[\s\S]*?<\/Relationship>/g, tag => {
      if (tag.includes(COMMENT_REL_TYPE) || tag.includes(VML_DRAWING_REL_TYPE)) return ''
      return tag
    })
}

/**
 * 일부 양식 xlsx는 sheet rels에 `/xl/comments/...` 절대 Target을 넣어
 * ExcelJS reconcile 단계에서 `Cannot read properties of undefined (reading 'comments')`로 깨진다.
 * 업로드 파싱에는 셀 메모가 필요 없으므로 comments/vml 관계·파트를 제거한다.
 */
export async function sanitizeXlsxBufferForExcelJs(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  const zip = await JSZip.loadAsync(buffer)
  let changed = false

  for (const path of Object.keys(zip.files)) {
    if (!isWorksheetRelsPath(path)) continue
    const file = zip.file(path)
    if (file == null) continue
    const original = await file.async('string')
    const next = stripCommentRelationships(original)
    if (next !== original) {
      zip.file(path, next)
      changed = true
    }
  }

  for (const path of Object.keys(zip.files)) {
    if (!isDisposableCommentPart(path)) continue
    zip.remove(path)
    changed = true
  }

  if (!changed) return buffer
  return zip.generateAsync({ type: 'arraybuffer' })
}
