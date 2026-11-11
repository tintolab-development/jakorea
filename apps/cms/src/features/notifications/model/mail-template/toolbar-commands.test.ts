/**
 * @vitest-environment jsdom
 *
 * 메일 템플릿 에디터와 동일한 extension으로 툴바 커맨드가 실제로 적용되는지 검증한다.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  Editor,
  createRichTextEditorApi,
  createRichTextExtensions,
  EMOJI_QUICK_PICK_NAMES,
  getEmojiQuickPickItems,
  insertEmoji,
  insertHorizontalRule,
  insertImageFromFile,
  insertImageFromUrl,
  insertTable,
  insertYoutubeFromUrl,
  canRunRichTextTableCommand,
  listRichTextTableToolbarItems,
  runRichTextTableCommand,
  NodeSelection,
  promptLinkUrl,
  RICH_TEXT_IMAGE_MAX_COUNT,
  RICH_TEXT_IMAGE_MAX_TOTAL_BYTES,
  RICH_TEXT_INLINE_IMAGE_COUNT_MESSAGE,
  RICH_TEXT_INLINE_IMAGE_MAX_BYTES,
  RICH_TEXT_INLINE_IMAGE_SIZE_MESSAGE,
  RICH_TEXT_INLINE_IMAGE_TOTAL_MESSAGE,
  RICH_TEXT_MAX_TEXT_CHARACTERS,
  setLinkFromUrl,
  stripTrailingEmptyMarkdown,
  stripTrailingEmptyParagraphs,
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

function countBlockEmptyParagraphs(instance: Editor): number {
  let count = 0
  instance.state.doc.forEach(node => {
    if (node.type.name === 'paragraph' && node.content.size === 0) count += 1
  })
  return count
}

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

  it('adds table rows and columns then deletes the table', () => {
    const instance = createEditor('<p></p>')
    instance.commands.focus()
    insertTable(instance)
    expect(instance.isActive('table')).toBe(true)
    expect(canRunRichTextTableCommand(instance, 'addRowAfter')).toBe(true)
    expect(canRunRichTextTableCommand(instance, 'addColumnAfter')).toBe(true)
    expect(canRunRichTextTableCommand(instance, 'mergeCells')).toBe(false)

    const countRows = () => {
      let rows = 0
      instance.state.doc.descendants(node => {
        if (node.type.name === 'tableRow') rows += 1
      })
      return rows
    }
    const countCellsInFirstRow = () => {
      let cells = 0
      instance.state.doc.descendants(node => {
        if (node.type.name !== 'tableRow') return
        if (cells > 0) return false
        node.forEach(child => {
          if (child.type.name === 'tableHeader' || child.type.name === 'tableCell') cells += 1
        })
        return false
      })
      return cells
    }

    const rowsBefore = countRows()
    const colsBefore = countCellsInFirstRow()
    runRichTextTableCommand(instance, 'addRowAfter')
    runRichTextTableCommand(instance, 'addColumnAfter')
    expect(countRows()).toBe(rowsBefore + 1)
    expect(countCellsInFirstRow()).toBe(colsBefore + 1)

    runRichTextTableCommand(instance, 'deleteTable')
    expect(instance.isActive('table')).toBe(false)
    expect(canRunRichTextTableCommand(instance, 'addRowAfter')).toBe(false)
  })

  it('lists table edit commands even when the cursor is outside a table', () => {
    const items = listRichTextTableToolbarItems({ inTable: false })
    expect(items.some(item => item.kind === 'insert')).toBe(true)
    expect(
      items.some(item => item.kind === 'command' && item.command === 'addRowAfter' && item.disabled)
    ).toBe(true)
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

  it('inserts an image from URL into the document', () => {
    const instance = createEditor('<p>본문</p>')
    instance.commands.focus()
    insertImageFromUrl(instance, 'https://example.com/photo.png')
    const names: string[] = []
    instance.state.doc.descendants(node => {
      names.push(node.type.name)
    })
    expect(names.some(name => name === 'image' || name === 'imageResize')).toBe(true)
    expect(instance.getHTML()).toMatch(/<img\b[^>]*src="https:\/\/example\.com\/photo\.png"/i)
  })

  it('inserts an image from a local file as a data URL', async () => {
    const instance = createEditor('<p>본문</p>')
    const file = new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], 'pic.png', {
      type: 'image/png',
    })
    insertImageFromFile(instance, file)
    await vi.waitFor(() => {
      expect(instance.getHTML()).toMatch(/<img\b[^>]*src="data:image\/png/i)
    })
  })

  // 본문 5만 자 입력 제한은 해제됨(에디터에 글자 수 제한 확장을 등록하지 않음 — 기획 확인).
  it('does not block visible text above 50,000 characters', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    const instance = createEditor('')

    expect(
      instance.chain().focus().insertContent('가'.repeat(RICH_TEXT_MAX_TEXT_CHARACTERS)).run()
    ).toBe(true)
    instance.chain().focus().insertContent('나').run()
    expect(createRichTextEditorApi(instance).getCharacterCount()).toBe(
      RICH_TEXT_MAX_TEXT_CHARACTERS + 1
    )
    expect(alertSpy).not.toHaveBeenCalled()
    alertSpy.mockRestore()
  })

  it('blocks an editor image larger than 20MB', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    const instance = createEditor('<p>본문</p>')
    const resolveSrc = vi.fn(async () => 'https://example.com/huge.png')
    insertImageFromFile(
      instance,
      { name: 'huge.png', type: 'image/png', size: RICH_TEXT_INLINE_IMAGE_MAX_BYTES + 1 } as File,
      resolveSrc
    )
    expect(alertSpy).toHaveBeenCalledWith(RICH_TEXT_INLINE_IMAGE_SIZE_MESSAGE)
    expect(resolveSrc).not.toHaveBeenCalled()
    expect(instance.getHTML()).not.toContain('huge.png')
    alertSpy.mockRestore()
  })

  it('allows editor images up to 100MB in total and blocks the next byte', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    const instance = createEditor('<p>본문</p>')
    const resolveSrc = vi.fn(async (file: File) => ({
      src: `https://example.com/${file.name}`,
      persistSrc: '/api/admin/files/1/content',
    }))
    const fileCount = RICH_TEXT_IMAGE_MAX_TOTAL_BYTES / RICH_TEXT_INLINE_IMAGE_MAX_BYTES

    for (let index = 0; index < fileCount; index += 1) {
      const file = {
        name: `big-${index}.png`,
        type: 'image/png',
        size: RICH_TEXT_INLINE_IMAGE_MAX_BYTES,
      } as File
      insertImageFromFile(instance, file, resolveSrc)
      await vi.waitFor(() => {
        expect(instance.getHTML()).toContain(`big-${index}.png`)
      })
    }
    expect(createRichTextEditorApi(instance).getImageTotalBytes()).toBe(RICH_TEXT_IMAGE_MAX_TOTAL_BYTES)

    insertImageFromFile(
      instance,
      { name: 'too-much.png', type: 'image/png', size: 1 } as File,
      resolveSrc
    )
    await vi.waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(RICH_TEXT_INLINE_IMAGE_TOTAL_MESSAGE)
    })
    expect(instance.getHTML()).not.toContain('too-much.png')
    alertSpy.mockRestore()
  })

  it('blocks the 11th editor image', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    const instance = createEditor('<p>본문</p>')
    const resolveSrc = vi.fn(async (file: File) => `https://example.com/${file.name}`)

    for (let index = 0; index < RICH_TEXT_IMAGE_MAX_COUNT; index += 1) {
      insertImageFromFile(
        instance,
        { name: `pic-${index}.png`, type: 'image/png', size: 8 } as File,
        resolveSrc
      )
      await vi.waitFor(() => {
        expect(instance.getHTML()).toContain(`pic-${index}.png`)
      })
    }

    insertImageFromFile(
      instance,
      { name: 'pic-extra.png', type: 'image/png', size: 8 } as File,
      resolveSrc
    )
    await vi.waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(RICH_TEXT_INLINE_IMAGE_COUNT_MESSAGE)
    })
    expect(instance.getHTML()).not.toContain('pic-extra.png')
    alertSpy.mockRestore()
  })

  it('inserts a YouTube video from a watch URL', () => {
    const instance = createEditor('<p>본문</p>')
    instance.commands.focus()
    insertYoutubeFromUrl(instance, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    let hasYoutube = false
    instance.state.doc.descendants(node => {
      if (node.type.name === 'youtube') hasYoutube = true
    })
    expect(hasYoutube).toBe(true)
    expect(instance.getHTML()).toMatch(/youtube|iframe/i)
  })

  it('round-trips inserted image and youtube through markdown', () => {
    const instance = createEditor('<p>본문</p>')
    instance.commands.focus()
    insertImageFromUrl(instance, 'https://example.com/photo.png')
    insertYoutubeFromUrl(instance, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    const markdown = (instance as Editor & { getMarkdown?: () => string }).getMarkdown?.() ?? ''
    expect(markdown, markdown).toMatch(/photo\.png/)
    expect(markdown, markdown).toMatch(/youtube|iframe|dQw4w9WgXcQ/i)
    instance.destroy()

    const reloaded = createEditor('')
    reloaded.commands.setContent(markdown, { contentType: 'markdown' })
    const names: string[] = []
    reloaded.state.doc.descendants(node => {
      names.push(node.type.name)
    })
    expect(
      names.some(name => name === 'image' || name === 'imageResize'),
      `markdown:\n${markdown}\nnodes: ${names.join(',')}`
    ).toBe(true)
    expect(names.includes('youtube'), `markdown:\n${markdown}\nnodes: ${names.join(',')}`).toBe(true)
  })

  it('round-trips inserted image and youtube through HTML', () => {
    const instance = createEditor('<p>본문</p>')
    instance.commands.focus()
    insertImageFromUrl(instance, 'https://example.com/photo.png')
    insertYoutubeFromUrl(instance, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    const html = instance.getHTML()
    instance.destroy()

    const reloaded = createEditor('')
    reloaded.commands.setContent(html, { contentType: 'html' })
    const names: string[] = []
    reloaded.state.doc.descendants(node => {
      names.push(node.type.name)
    })
    expect(names.some(name => name === 'image' || name === 'imageResize'), names.join(',')).toBe(true)
    expect(names.includes('youtube'), names.join(',')).toBe(true)
  })

  it('inserts a link when no text is selected', () => {
    const instance = createEditor('<p>본문</p>')
    instance.commands.setTextSelection(1)
    expect(setLinkFromUrl(instance, 'https://example.com')).toBe(true)
    expect(instance.getHTML()).toMatch(/<a\b[^>]*href="https:\/\/example\.com"/i)
  })

  it('applies a link to the selected text', () => {
    const instance = createEditor('<p>본문링크</p>')
    instance.commands.setTextSelection({ from: 1, to: 5 })
    expect(setLinkFromUrl(instance, 'https://example.com')).toBe(true)
    expect(instance.getHTML()).toMatch(/<a\b[^>]*href="https:\/\/example\.com"/i)
    expect(instance.getHTML()).toContain('본문')
  })

  it('inserts a link from the prompt helper when the caret is empty', () => {
    vi.stubGlobal(
      'prompt',
      vi.fn(() => 'https://example.com')
    )
    const instance = createEditor('<p>본문</p>')
    instance.commands.setTextSelection(1)
    promptLinkUrl(instance)
    expect(instance.getHTML()).toMatch(/<a\b[^>]*href="https:\/\/example\.com"/i)
    vi.unstubAllGlobals()
  })

  it('serializes two paragraphs with a single blank line', () => {
    const instance = createEditor('<p>문단1</p><p>문단2</p>')
    const api = createRichTextEditorApi(instance)
    expect(api.getText()).toBe('문단1\n\n문단2')
    const markdown = api.getMarkdown()
    expect(markdown).toBe('문단1\n\n문단2')
    expect(markdown).not.toMatch(/\n{3,}/)
  })

  it('returns an empty text value after the editor is destroyed', () => {
    const instance = createEditor('<p>본문</p>')
    const api = createRichTextEditorApi(instance)

    instance.destroy()

    expect(api.getText()).toBe('')
  })

  it('does not grow empty paragraphs after markdown save and reopen', () => {
    const instance = createEditor('<p>문단1</p><p>문단2</p>')
    const markdown = createRichTextEditorApi(instance).getMarkdown()
    const emptyBefore = countBlockEmptyParagraphs(instance)
    instance.destroy()

    const reloaded = createEditor('')
    reloaded.commands.setContent(markdown, { contentType: 'markdown' })
    expect(countBlockEmptyParagraphs(reloaded)).toBe(emptyBefore)
    expect(createRichTextEditorApi(reloaded).getMarkdown()).toBe(markdown)
  })

  it('omits trailing empty paragraphs from saved HTML after image and youtube insert', () => {
    const instance = createEditor('<p>본문</p>')
    instance.commands.focus()
    insertImageFromUrl(instance, 'https://example.com/photo.png')
    insertYoutubeFromUrl(instance, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    const html = createRichTextEditorApi(instance).getHTML()
    expect(html).toMatch(/<img\b[^>]*src="https:\/\/example\.com\/photo\.png"/i)
    expect(html).toMatch(/youtube|iframe/i)
    expect(html).not.toMatch(/<p(?:\s[^>]*)?>(?:\s|&nbsp;|<br\b[^>]*>)*<\/p>\s*$/i)
  })
})

describe('trailing empty paragraph stripping', () => {
  it('removes only trailing empty HTML paragraphs', () => {
    expect(stripTrailingEmptyParagraphs('<p>본문</p><p></p>')).toBe('<p>본문</p>')
    expect(stripTrailingEmptyParagraphs('<p>본문</p><p><br></p>')).toBe('<p>본문</p>')
    expect(
      stripTrailingEmptyParagraphs('<p>본문</p><p><br class="ProseMirror-trailingBreak"></p>')
    ).toBe('<p>본문</p>')
    expect(stripTrailingEmptyParagraphs('<p>문단1</p><p></p><p>문단2</p>')).toBe(
      '<p>문단1</p><p></p><p>문단2</p>'
    )
  })

  it('removes only trailing empty markdown paragraphs', () => {
    expect(stripTrailingEmptyMarkdown('문단1\n\n문단2\n\n')).toBe('문단1\n\n문단2')
    expect(stripTrailingEmptyMarkdown('문단1\n\n문단2\n\n&nbsp;')).toBe('문단1\n\n문단2')
    expect(stripTrailingEmptyMarkdown('문단1\n\n\n\n문단2')).toBe('문단1\n\n\n\n문단2')
  })
})
