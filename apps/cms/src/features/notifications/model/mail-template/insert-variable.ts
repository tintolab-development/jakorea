import type { Editor } from '@/shared/rich-text'
import { formatMailVariableToken } from './variables'
import { MAIL_VARIABLE_NODE_NAME } from './variable-node'

export const MAIL_VARIABLE_COLOR = '#01A1AF'
export const MAIL_VARIABLE_FONT_SIZE = '15px'

/** `#{회원명}`처럼 중괄호 안에 `{` `}`가 없는 정상 토큰 */
const MAIL_VARIABLE_TOKEN_RE = /#\{[^{}]+\}/g

type TextRange = { from: number; to: number }
type EditorDoc = Editor['state']['doc']

export function findMailVariableRanges(text: string): TextRange[] {
  const ranges: TextRange[] = []
  const pattern = new RegExp(MAIL_VARIABLE_TOKEN_RE.source, 'g')
  let match = pattern.exec(text)
  while (match) {
    const from = match.index
    ranges.push({ from, to: from + match[0].length })
    match = pattern.exec(text)
  }
  return ranges
}

/**
 * 커서가 기존 `#{변수}` 안이면 토큰 뒤로 보낸다.
 * 토큰 전체를 선택한 경우에는 교체를 허용한다.
 */
export function resolveInsertOutsideMailVariable(
  text: string,
  start: number,
  end: number
): TextRange {
  return snapRangeOutsideTokens(findMailVariableRanges(text), start, end)
}

function snapRangeOutsideTokens(tokens: TextRange[], start: number, end: number): TextRange {
  let from = start
  let to = end
  let changed = true
  while (changed) {
    changed = false
    for (const token of tokens) {
      const selectsWholeToken = from === token.from && to === token.to
      if (selectsWholeToken) continue
      const startInside = from > token.from && from < token.to
      const endInside = to > token.from && to < token.to
      if (startInside || endInside) {
        from = token.to
        to = token.to
        changed = true
      }
    }
  }
  return { from, to }
}

function collectEditorMailVariableRanges(doc: EditorDoc): TextRange[] {
  const ranges: TextRange[] = []
  doc.descendants((node, pos) => {
    if (node.type.name === MAIL_VARIABLE_NODE_NAME) {
      ranges.push({ from: pos, to: pos + node.nodeSize })
      return false
    }
    if (!node.isTextblock) return
    const { text, map } = textblockCharMap(node, pos)
    const pattern = new RegExp(MAIL_VARIABLE_TOKEN_RE.source, 'g')
    let match = pattern.exec(text)
    while (match) {
      const startIndex = match.index
      const endIndex = startIndex + match[0].length
      const from = map[startIndex]
      const last = map[endIndex - 1]
      if (from != null && last != null) {
        ranges.push({ from, to: last + 1 })
      }
      match = pattern.exec(text)
    }
    return false
  })
  return ranges
}

function textblockCharMap(block: EditorDoc, blockPos: number): { text: string; map: number[] } {
  let text = ''
  const map: number[] = []
  block.forEach((child, offset) => {
    if (!child.isText || !child.text) return
    const abs = blockPos + 1 + offset
    for (let i = 0; i < child.text.length; i += 1) {
      text += child.text[i]
      map.push(abs + i)
    }
  })
  return { text, map }
}

export function insertMailVariableInText(
  value: string,
  label: string,
  start: number,
  end: number,
  maxLength?: number
): { next: string; caret: number } {
  const safe = resolveInsertOutsideMailVariable(value, start, end)
  const token = formatMailVariableToken(label)
  const nextRaw = `${value.slice(0, safe.from)}${token}${value.slice(safe.to)}`
  const next = maxLength != null ? nextRaw.slice(0, maxLength) : nextRaw
  return { next, caret: Math.min(safe.from + token.length, next.length) }
}

export function insertMailVariableInEditor(
  editor: Editor,
  label: string,
  range?: { from: number; to: number }
): void {
  const token = formatMailVariableToken(label)
  const raw = range ?? {
    from: editor.state.doc.content.size,
    to: editor.state.doc.content.size,
  }
  const tokens = collectEditorMailVariableRanges(editor.state.doc)
  const selection = snapRangeOutsideTokens(tokens, raw.from, raw.to)
  const chain = editor.chain().setTextSelection(selection).focus()
  if (editor.schema.nodes[MAIL_VARIABLE_NODE_NAME]) {
    chain.insertContent({ type: MAIL_VARIABLE_NODE_NAME, attrs: { label } }).run()
    return
  }
  chain
    .insertContent({
      type: 'text',
      text: token,
      marks: [
        { type: 'bold' },
        {
          type: 'textStyle',
          attrs: { color: MAIL_VARIABLE_COLOR, fontSize: MAIL_VARIABLE_FONT_SIZE },
        },
      ],
    })
    .run()
}

export function isMailEditorEmpty(html: string, plainText?: string): boolean {
  if (plainText != null) return plainText.trim().length === 0
  return html.replace(/<[^>]*>/g, '').trim().length === 0
}
