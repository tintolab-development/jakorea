/**
 * @vitest-environment jsdom
 *
 * 메일 버튼 노드 — 에디터에서 열고 다시 저장해도 CMS primary 버튼 HTML이 그대로 남아야 한다.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { Editor, createRichTextExtensions } from '@jakorea/rich-text'
import { isPlainTextMailBody } from '@/features/notifications/model/shared/mail-body-display-html'
import { MAIL_BUTTON_NODE_NAME, MailButton } from './button-node'
import { mailPrimaryButton } from './layout-html'
import { MailVariable } from './variable-node'

const MEMBER_HREF = 'https://#{홈페이지 도메인}#{알림 링크 경로}'

let editor: Editor | null = null

afterEach(() => {
  editor?.destroy()
  editor = null
})

function openInMailEditor(content: string): Editor {
  editor = new Editor({
    element: document.createElement('div'),
    extensions: createRichTextExtensions({ extraExtensions: [MailVariable, MailButton] }),
    content,
    editable: true,
  })
  return editor
}

describe('MailButton', () => {
  it('버튼 표를 버튼 노드 하나로 읽는다', () => {
    const instance = openInMailEditor(`<p>본문</p>${mailPrimaryButton('문의 내역 보기', 'MEMBER')}`)
    const nodes: { type: string; attrs: Record<string, unknown> }[] = []
    instance.state.doc.forEach(node => nodes.push({ type: node.type.name, attrs: node.attrs }))
    expect(nodes.map(node => node.type)).toEqual(['paragraph', MAIL_BUTTON_NODE_NAME])
    expect(nodes[1].attrs).toMatchObject({ label: '문의 내역 보기', href: MEMBER_HREF })
  })

  // jsdom은 style 속성을 자체 CSS 파서로 다시 써서 원문 비교가 안 된다(브라우저는 setAttribute 문자열을 그대로 둔다).
  // 여기서는 버튼 구조만 보고, style 원문 유지는 브라우저에서 확인한다.
  it('열고 다시 저장해도 버튼 구조(표식·배경·높이·href·라벨)가 남는다', () => {
    const saved = openInMailEditor(
      `<p>본문</p>${mailPrimaryButton('문의 내역 보기', 'MEMBER')}`
    ).getHTML()
    expect(saved).toMatch(/^<p>본문<\/p><table data-mail-button="" role="presentation"/)
    expect(saved).toContain('<td height="40" bgcolor="#00a0af"')
    expect(saved).toContain(`<a href="${MEMBER_HREF}" target="_blank" rel="noopener noreferrer"`)
    expect(saved).toContain('>문의 내역 보기</a></td></tr></table>')
    expect(saved).not.toContain('<colgroup')
    expect(saved).not.toContain('<strong>')
  })

  it('두 번 열고 저장해도 같은 HTML이다', () => {
    const once = openInMailEditor(mailPrimaryButton('교육 일정 보기', 'MEMBER')).getHTML()
    editor?.destroy()
    const twice = openInMailEditor(once).getHTML()
    expect(twice).toBe(once)
  })

  it('href의 변수 토큰을 변수 노드로 바꾸지 않는다', () => {
    const saved = openInMailEditor(mailPrimaryButton('문의 내역 보기', 'MEMBER')).getHTML()
    expect(saved).toContain(`href="${MEMBER_HREF}"`)
    expect(saved).not.toContain('data-mail-variable')
  })

  it('저장 본문은 평문으로 판정되지 않는다', () => {
    const saved = openInMailEditor(mailPrimaryButton('문의 내역 보기', 'MEMBER')).getHTML()
    expect(isPlainTextMailBody(saved)).toBe(false)
  })

  it('표식이 없는 일반 표는 버튼 노드로 읽지 않는다', () => {
    const instance = openInMailEditor('<table><tr><td><a href="https://example.com">링크</a></td></tr></table>')
    let hasButton = false
    instance.state.doc.descendants(node => {
      if (node.type.name === MAIL_BUTTON_NODE_NAME) hasButton = true
    })
    expect(hasButton).toBe(false)
  })
})
