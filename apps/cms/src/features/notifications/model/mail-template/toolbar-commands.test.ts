/**
 * @vitest-environment jsdom
 *
 * 메일 템플릿 에디터와 동일한 extension으로 툴바 커맨드가 실제로 적용되는지 검증한다.
 */
import { afterEach, describe, expect, it } from 'vitest'
import {
  Editor,
  createRichTextExtensions,
  EMOJI_QUICK_PICK_NAMES,
  getEmojiQuickPickItems,
  insertEmoji,
  insertHorizontalRule,
  insertTable,
  NodeSelection,
} from '@jakorea/rich-text'
import { MAIL_VARIABLE_NODE_NAME, MailVariable } from './variable-node'

let editor: Editor | null = null

function createEditor(html: string): Editor {
  editor = new Editor({
    element: document.createElement('div'),
    extensions: createRichTextExtensions({ extraExtensions: [MailVariable] }),
    content: html,
    editable: true,
  })
  return editor
}

afterEach(() => {
  editor?.destroy()
  editor = null
})

describe('mail template editor toolbar commands', () => {
  it('applies line-height to the current paragraph', () => {
    const instance = createEditor('<p>본문 줄간격</p>')
    instance.commands.focus()
    expect(instance.commands.setLineHeight('200%')).toBe(true)
    expect(instance.getAttributes('paragraph').lineHeight).toBe('200%')
  })

  it('writes visible HTML for each toolbar format', () => {
    const cases: { name: string; run: (ed: Editor) => boolean; html: RegExp }[] = [
      { name: 'bold', run: ed => ed.chain().focus().toggleBold().run(), html: /<(strong|b)[>\s]/i },
      { name: 'italic', run: ed => ed.chain().focus().toggleItalic().run(), html: /<(em|i)[>\s]/i },
      { name: 'underline', run: ed => ed.chain().focus().toggleUnderline().run(), html: /<u[>\s]/i },
      { name: 'strike', run: ed => ed.chain().focus().toggleStrike().run(), html: /<(s|strike|del)[>\s]/i },
      {
        name: 'superscript',
        run: ed => ed.chain().focus().toggleSuperscript().run(),
        html: /<sup[>\s]/i,
      },
      {
        name: 'fontFamily',
        run: ed => ed.chain().focus().setFontFamily('Georgia, serif').run(),
        html: /font-family:\s*Georgia/i,
      },
      {
        name: 'fontSize',
        run: ed => ed.chain().focus().setFontSize('20px').run(),
        html: /font-size:\s*20px/i,
      },
      {
        name: 'color',
        run: ed => ed.chain().focus().setColor('#E53935').run(),
        html: /(?:color:\s*#E53935|color:\s*rgb\(229,\s*57,\s*53\))/i,
      },
      {
        name: 'highlight',
        run: ed => ed.chain().focus().setHighlight({ color: '#FFF9C4' }).run(),
        html: /<mark[\s>]|background-color:\s*#FFF9C4/i,
      },
      {
        name: 'heading',
        run: ed => ed.chain().focus().setHeading({ level: 2 }).run(),
        html: /<h2[>\s]/i,
      },
      {
        name: 'align',
        run: ed => ed.chain().focus().setTextAlign('center').run(),
        html: /text-align:\s*center/i,
      },
      {
        name: 'bulletList',
        run: ed => ed.chain().focus().toggleBulletList().run(),
        html: /<ul[>\s]/i,
      },
      {
        name: 'orderedList',
        run: ed => ed.chain().focus().toggleOrderedList().run(),
        html: /<ol[>\s]/i,
      },
      {
        name: 'blockquote',
        run: ed => ed.chain().focus().toggleBlockquote().run(),
        html: /<blockquote[>\s]/i,
      },
      {
        name: 'lineHeight',
        run: ed => ed.chain().focus().setLineHeight('200%').run(),
        html: /line-height:\s*200%/i,
      },
      {
        name: 'link',
        run: ed => ed.chain().focus().setLink({ href: 'https://example.com' }).run(),
        html: /<a\b[^>]*href="https:\/\/example\.com"/i,
      },
    ]

    for (const testCase of cases) {
      const instance = createEditor('<p>서식적용텍스트</p>')
      instance.commands.setTextSelection({ from: 1, to: 8 })
      expect(testCase.run(instance), testCase.name).toBe(true)
      expect(instance.getHTML(), testCase.name).toMatch(testCase.html)
      instance.destroy()
      editor = null
    }
  })

  it('inserts a table and a horizontal rule', () => {
    const instance = createEditor('<p>삽입 위치</p>')
    instance.commands.focus()
    insertTable(instance)
    expect(instance.isActive('table')).toBe(true)
    instance.commands.setTextSelection(instance.state.doc.content.size)
    insertHorizontalRule(instance)
    let hasRule = false
    instance.state.doc.descendants(node => {
      if (node.type.name === 'horizontalRule') hasRule = true
    })
    expect(hasRule).toBe(true)
  })

  it('keeps mail variable atoms intact when toggling bold on the chip', () => {
    const instance = createEditor(
      '<p>안녕 <span data-mail-variable="회원명">#{회원명}</span>님</p>'
    )
    let atomPos: number | null = null
    instance.state.doc.descendants((node, pos) => {
      if (node.type.name === MAIL_VARIABLE_NODE_NAME) {
        atomPos = pos
        return false
      }
    })
    expect(atomPos).not.toBeNull()
    const nodeSelection = NodeSelection.create(instance.state.doc, atomPos ?? 0)
    instance.view.dispatch(instance.state.tr.setSelection(nodeSelection))
    instance.chain().focus().toggleBold().run()
    let stillAtom = false
    instance.state.doc.descendants(node => {
      if (node.type.name === MAIL_VARIABLE_NODE_NAME) stillAtom = true
    })
    expect(stillAtom).toBe(true)
  })

  it('resolves every toolbar quick-pick emoji name', () => {
    const items = getEmojiQuickPickItems()
    expect(items).toHaveLength(EMOJI_QUICK_PICK_NAMES.length)
    expect(items.every(item => Boolean(item.emoji))).toBe(true)
  })

  it('inserts an emoji node from the toolbar helper', () => {
    const instance = createEditor('<p>본문</p>')
    instance.commands.focus()
    expect(insertEmoji(instance, 'grinning')).toBe(true)
    const html = instance.getHTML()
    expect(html).toMatch(/data-type="emoji"|data-name="grinning"|😀/)
    let hasEmoji = false
    instance.state.doc.descendants(node => {
      if (node.type.name === 'emoji') hasEmoji = true
    })
    expect(hasEmoji).toBe(true)
  })
})
