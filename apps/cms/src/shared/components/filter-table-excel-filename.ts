import { isValidElement, type ReactNode } from 'react'

/** ReactNode(문자열·JSX)에서 표시 텍스트 추출 */
export function resolveReactNodeText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(resolveReactNodeText).join('')
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return resolveReactNodeText(node.props.children)
  }
  return ''
}

/** 엑셀 파일명 prefix — `title` 텍스트 기반, 파일시스템 금지 문자만 제거 */
export function resolveFilterTableExcelFilename(title: ReactNode | undefined): string {
  const text = sanitizeExcelFilenamePrefix(resolveReactNodeText(title))
  return text || 'export'
}

function sanitizeExcelFilenamePrefix(text: string): string {
  return text.trim().replace(/[\\/:*?"<>|]/g, '')
}
