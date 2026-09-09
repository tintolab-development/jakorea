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

function findEnclosingMailVariable(
  tokens: TextRange[],
  pos: number
): TextRange | null {
  for (const token of tokens) {
    if (pos > token.from && pos < token.to) return token
  }
  return null
}

/** 부분 선택된 토큰이 있으면 토큰 전체로 selection을 확장한다. */
export function expandSelectionToMailVariableAtoms(
  text: string,
  start: number,
  end: number
): TextRange {
  const from0 = Math.min(start, end)
  const to0 = Math.max(start, end)
  const tokens = findMailVariableRanges(text)
  let from = from0
  let to = to0
  let changed = true
  while (changed) {
    changed = false
    for (const token of tokens) {
      const overlaps = from < token.to && to > token.from
      if (!overlaps) continue
      const coversWhole = from <= token.from && to >= token.to
      if (coversWhole) continue
      from = Math.min(from, token.from)
      to = Math.max(to, token.to)
      changed = true
    }
  }
  return { from, to }
}

/**
 * 네이티브 input/textarea용: 토큰 중간 커서를 가장자리로 스냅.
 * (메일 TipTap atom 클릭과 동일하게 가까운 쪽 경계로)
 */
export function snapCaretOutsideMailVariableAtom(
  text: string,
  pos: number
): number {
  const token = findEnclosingMailVariable(findMailVariableRanges(text), pos)
  if (!token) return pos
  return pos - token.from <= token.to - pos ? token.from : token.to
}

export function snapSelectionOutsideMailVariableAtoms(
  text: string,
  start: number,
  end: number
): TextRange {
  if (start === end) {
    const caret = snapCaretOutsideMailVariableAtom(text, start)
    return { from: caret, to: caret }
  }
  return expandSelectionToMailVariableAtoms(text, start, end)
}

/**
 * Backspace/Delete 시 변수 토큰을 한 덩어리로 지운다.
 * 브라우저 기본 동작으로 두면 null.
 */
export function applyAtomicMailVariableDeletion(
  text: string,
  start: number,
  end: number,
  direction: 'backward' | 'forward'
): { next: string; caret: number } | null {
  const tokens = findMailVariableRanges(text)
  if (tokens.length === 0) return null

  if (start !== end) {
    const touches = tokens.some(token => start < token.to && end > token.from)
    if (!touches) return null
    const expanded = expandSelectionToMailVariableAtoms(text, start, end)
    return {
      next: `${text.slice(0, expanded.from)}${text.slice(expanded.to)}`,
      caret: expanded.from,
    }
  }

  const caret = start
  const enclosing = findEnclosingMailVariable(tokens, caret)
  if (enclosing) {
    return {
      next: `${text.slice(0, enclosing.from)}${text.slice(enclosing.to)}`,
      caret: enclosing.from,
    }
  }

  if (direction === 'backward') {
    const ending = tokens.find(token => token.to === caret)
    if (!ending) return null
    return {
      next: `${text.slice(0, ending.from)}${text.slice(ending.to)}`,
      caret: ending.from,
    }
  }

  const starting = tokens.find(token => token.from === caret)
  if (!starting) return null
  return {
    next: `${text.slice(0, starting.from)}${text.slice(starting.to)}`,
    caret: starting.from,
  }
}

/**
 * 화살표로 토큰을 “한 칸”처럼 건너뛴다. 처리하면 새 caret, 아니면 null.
 */
export function jumpCaretAcrossMailVariableAtom(
  text: string,
  caret: number,
  direction: 'left' | 'right'
): number | null {
  const tokens = findMailVariableRanges(text)
  if (direction === 'left') {
    const enclosing = findEnclosingMailVariable(tokens, caret)
    if (enclosing) return enclosing.from
    const ending = tokens.find(token => token.to === caret)
    return ending ? ending.from : null
  }
  const enclosing = findEnclosingMailVariable(tokens, caret)
  if (enclosing) return enclosing.to
  const starting = tokens.find(token => token.from === caret)
  return starting ? starting.to : null
}

/** 토큰 중간 삽입을 막고, 토큰 뒤에서 이어 붙일 위치로 스냅한 결과 */
export function resolveTypingOutsideMailVariableAtom(
  text: string,
  start: number,
  end: number
): TextRange {
  if (start !== end) {
    return expandSelectionToMailVariableAtoms(text, start, end)
  }
  const enclosing = findEnclosingMailVariable(findMailVariableRanges(text), start)
  if (!enclosing) return { from: start, to: end }
  return { from: enclosing.to, to: enclosing.to }
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
