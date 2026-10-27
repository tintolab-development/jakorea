/**
 * @vitest-environment jsdom
 *
 * 평문 템플릿 → 에디터 로드 → getHTML 이 "손대지 않음"으로 판정되는지 실제 TipTap으로 검증.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { Editor, createRichTextExtensions } from '@jakorea/rich-text'
import { MAIL_VARIABLE_NODE_NAME, MailVariable } from '../mail-template/variable-node'
import {
  isMailEditorBodyUntouchedFromPlainTemplate,
  mailBodyToEditorHtml,
} from './mail-body-display-html'

let editor: Editor | null = null

function load(plain: string): Editor {
  editor = new Editor({
    element: document.createElement('div'),
    extensions: createRichTextExtensions({ extraExtensions: [MailVariable] }),
    content: mailBodyToEditorHtml(plain),
    editable: true,
  })
  return editor
}

afterEach(() => {
  editor?.destroy()
  editor = null
})

const STORED = '안녕하세요? #{회원명}님,\nJA Korea입니다.\n\n■ 프로그램명: #{프로그램명} <A&B>\n■ 교육 진행일: #{교육 진행일}'

describe('plain template in mail editor', () => {
  it('keeps line breaks as paragraphs and parses #{변수} as variable nodes', () => {
    const e = load(STORED)
    const html = e.getHTML()
    expect(html.match(/<p/g)?.length).toBe(5)
    let variables = 0
    e.state.doc.descendants(node => {
      if (node.type.name === MAIL_VARIABLE_NODE_NAME) variables += 1
    })
    expect(variables).toBe(3)
  })

  it('untouched editor output is not a user change (no override, baseline stays original)', () => {
    const e = load(STORED)
    expect(isMailEditorBodyUntouchedFromPlainTemplate(e.getHTML(), STORED)).toBe(true)
  })

  it('a real edit is detected', () => {
    const e = load(STORED)
    e.commands.insertContentAt(1, '추가 ')
    expect(isMailEditorBodyUntouchedFromPlainTemplate(e.getHTML(), STORED)).toBe(false)
  })
})
