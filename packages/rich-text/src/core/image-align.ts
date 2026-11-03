import type { Editor } from '@tiptap/react'
import { NodeSelection } from '@tiptap/pm/state'

export type ImageHorizontalAlign = 'left' | 'center' | 'right'

const ALIGN_CSS_KEYS = new Set(['float', 'margin-left', 'margin-right', 'display', 'text-align'])

const ALIGN_CSS: Record<ImageHorizontalAlign, Record<string, string>> = {
  left: {
    display: 'block',
    float: 'none',
    'margin-left': '0',
    'margin-right': 'auto',
  },
  center: {
    display: 'block',
    float: 'none',
    'margin-left': 'auto',
    'margin-right': 'auto',
  },
  right: {
    display: 'block',
    float: 'none',
    'margin-left': 'auto',
    'margin-right': '0',
  },
}

export function parseCssDeclarations(style: string | null | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  if (!style?.trim()) return out
  for (const part of style.split(';')) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const colon = trimmed.indexOf(':')
    if (colon <= 0) continue
    const key = trimmed.slice(0, colon).trim().toLowerCase()
    const value = trimmed.slice(colon + 1).trim()
    if (key && value) out[key] = value
  }
  return out
}

export function serializeCssDeclarations(map: Record<string, string>): string {
  return Object.entries(map)
    .filter(([, value]) => value.trim() !== '')
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ')
}

function normalizeMargin(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase()
}

export function readImageAlignFromDeclarations(
  decls: Record<string, string>
): ImageHorizontalAlign | null {
  const float = normalizeMargin(decls.float)
  if (float === 'left') return 'left'
  if (float === 'right') return 'right'
  const textAlign = normalizeMargin(decls['text-align'])
  if (textAlign === 'center') return 'center'
  if (textAlign === 'right') return 'right'
  if (textAlign === 'left') return 'left'
  const ml = normalizeMargin(decls['margin-left'])
  const mr = normalizeMargin(decls['margin-right'])
  if (ml === 'auto' && mr === 'auto') return 'center'
  if (ml === 'auto' && (mr === '0' || mr === '0px')) return 'right'
  if ((ml === '0' || ml === '0px') && mr === 'auto') return 'left'
  return null
}

export function applyImageAlignToContainerStyle(
  style: string | null | undefined,
  align: ImageHorizontalAlign
): string {
  const decls = parseCssDeclarations(style)
  for (const key of ALIGN_CSS_KEYS) delete decls[key]
  Object.assign(decls, ALIGN_CSS[align])
  return serializeCssDeclarations(decls)
}

export function mergeImageContainerStyle(
  inherited: string | null | undefined,
  alignCss: string | null | undefined
): string | null {
  const decls = parseCssDeclarations(inherited)
  const alignDecls = parseCssDeclarations(alignCss)
  Object.assign(decls, alignDecls)
  const serialized = serializeCssDeclarations(decls)
  return serialized || null
}

export function containerStyleHasPersistentLayout(style: string | null | undefined): boolean {
  if (!style?.trim()) return false
  const decls = parseCssDeclarations(style)
  if (decls.width) return true
  return readImageAlignFromDeclarations(decls) != null
}

function cssValue(style: CSSStyleDeclaration | undefined, name: string): string {
  if (!style) return ''
  return (style.getPropertyValue(name) || '').trim().toLowerCase()
}

export function parseImageAlignFromElement(element: HTMLElement): ImageHorizontalAlign | null {
  const attrAlign = (element.getAttribute('align') ?? '').trim().toLowerCase()
  if (attrAlign === 'left' || attrAlign === 'right' || attrAlign === 'center') return attrAlign
  if (attrAlign === 'middle') return 'center'

  const fromStyle = readImageAlignFromDeclarations(parseCssDeclarations(element.getAttribute('style')))
  if (fromStyle) return fromStyle

  const computedFloat = cssValue(element.style, 'float')
  if (computedFloat === 'left' || computedFloat === 'right') return computedFloat

  const parent = element.parentElement
  if (parent) {
    const parentAlign = (parent.style.textAlign || parent.getAttribute('align') || '').trim().toLowerCase()
    if (parentAlign === 'center' || parentAlign === 'right' || parentAlign === 'left') {
      return parentAlign
    }
    const parentStyleAlign = readImageAlignFromDeclarations(
      parseCssDeclarations(parent.getAttribute('style'))
    )
    if (parentStyleAlign) return parentStyleAlign
  }
  return null
}

export function parseImageContainerStyleFromElement(
  element: HTMLElement,
  inheritedStyle?: string | null
): string | null {
  const align = parseImageAlignFromElement(element)
  const alignCss = align ? serializeCssDeclarations(ALIGN_CSS[align]) : null
  const baseStyle =
    typeof inheritedStyle === 'string' && inheritedStyle.trim()
      ? inheritedStyle
      : element.getAttribute('style')
  return mergeImageContainerStyle(baseStyle, alignCss)
}

export function isImageNodeSelection(editor: Editor): boolean {
  if (editor.isDestroyed) return false
  const selection = editor.state.selection
  return selection instanceof NodeSelection && selection.node.type.name === 'image'
}

export type VisualAlignValue = ImageHorizontalAlign | 'justify'

export function setVisualAlign(editor: Editor, align: VisualAlignValue): boolean {
  if (editor.isDestroyed) return false
  if (!isImageNodeSelection(editor)) {
    return editor.chain().focus().setTextAlign(align).run()
  }
  if (align === 'justify') return true
  const current = (editor.getAttributes('image').containerStyle as string | null | undefined) ?? ''
  const next = applyImageAlignToContainerStyle(current, align)
  return editor.chain().focus().updateAttributes('image', { containerStyle: next }).run()
}

/** 선택된 이미지 블록을 형제 노드 기준으로 한 칸 이동한다. */
export function moveSelectedImageBlock(editor: Editor, direction: -1 | 1): boolean {
  if (editor.isDestroyed) return false
  const { state } = editor
  const selection = state.selection
  if (!(selection instanceof NodeSelection) || selection.node.type.name !== 'image') return false
  const from = selection.from
  const node = selection.node
  const $from = state.doc.resolve(from)
  const index = $from.index()
  const parent = $from.parent
  const targetIndex = index + direction
  if (targetIndex < 0 || targetIndex >= parent.childCount) return false

  let insertPos: number
  if (direction < 0) {
    insertPos = $from.posAtIndex(targetIndex)
  } else {
    insertPos = from + node.nodeSize + parent.child(index + 1).nodeSize
  }

  const tr = state.tr.delete(from, from + node.nodeSize)
  const mapped = tr.mapping.map(insertPos, direction < 0 ? -1 : 1)
  tr.insert(mapped, node)
  tr.setSelection(NodeSelection.create(tr.doc, mapped))
  editor.view.dispatch(tr)
  return true
}
