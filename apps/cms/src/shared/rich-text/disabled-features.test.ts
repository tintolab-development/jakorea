/**
 * @vitest-environment jsdom
 *
 * createRichTextExtensions({ disabledFeatures }) — 끈 기능은 확장 자체가 빠져야 하고,
 * 옵션을 주지 않으면 기존 구성과 완전히 같아야 한다 (CMS·Platform 무영향).
 */
import { afterEach, describe, expect, it } from 'vitest'
import {
  Editor,
  createRichTextExtensions,
  type RichTextDisabledFeature,
} from '@jakorea/rich-text'

let editors: Editor[] = []

function create(disabledFeatures?: readonly RichTextDisabledFeature[], content = '<p>본문</p>') {
  const e = new Editor({
    element: document.createElement('div'),
    extensions: createRichTextExtensions({ disabledFeatures }),
    content,
  })
  editors.push(e)
  return e
}

const names = (disabled?: readonly RichTextDisabledFeature[]) =>
  createRichTextExtensions({ disabledFeatures: disabled }).map(e => e.name)

afterEach(() => {
  editors.forEach(e => e.destroy())
  editors = []
})

const ALL: RichTextDisabledFeature[] = [
  'textColor',
  'fontFamily',
  'fontSize',
  'lineHeight',
  'highlight',
  'textAlign',
  'superscript',
  'horizontalRule',
  'table',
  'heading1',
]

describe('disabledFeatures: 기본값 무영향', () => {
  it('옵션 없음·빈 배열은 기존 확장 구성과 같다', () => {
    expect(names([])).toEqual(names(undefined))
  })

  it('옵션 없이 만든 에디터는 모든 서식 명령을 가진다', () => {
    const e = create()
    for (const cmd of [
      'setColor',
      'setFontFamily',
      'setFontSize',
      'setLineHeight',
      'setHighlight',
      'setTextAlign',
      'toggleSuperscript',
      'setHorizontalRule',
      'insertTable',
    ]) {
      expect(typeof (e.commands as Record<string, unknown>)[cmd], cmd).toBe('function')
    }
  })
})

describe('disabledFeatures: 끈 기능은 확장이 빠진다', () => {
  const cases: Array<[RichTextDisabledFeature, string[]]> = [
    ['textColor', ['color']],
    ['fontFamily', ['fontFamily']],
    ['fontSize', ['fontSize']],
    ['lineHeight', ['lineHeight']],
    ['highlight', ['highlight']],
    ['textAlign', ['textAlign']],
    ['superscript', ['superscript']],
    ['table', ['table', 'tableRow', 'tableHeader', 'tableCell']],
  ]
  for (const [feature, removed] of cases) {
    it(feature, () => {
      const all = names()
      const without = names([feature])
      for (const name of removed) {
        expect(all, `${name} 는 기본 구성에 있어야 함`).toContain(name)
        expect(without, `${name} 가 빠져야 함`).not.toContain(name)
      }
    })
  }

  it('horizontalRule (StarterKit 내장)', () => {
    const e = create(['horizontalRule'])
    expect(e.schema.nodes.horizontalRule).toBeUndefined()
    expect(typeof (e.commands as Record<string, unknown>).setHorizontalRule).not.toBe('function')
  })

  it('heading1: 제목 1만 막고 2·3은 유지한다', () => {
    const e = create(['heading1'])
    expect(e.commands.setHeading({ level: 1 })).toBe(false)
    expect(e.commands.setHeading({ level: 2 })).toBe(true)
    expect(e.commands.setHeading({ level: 3 })).toBe(true)
  })

  it('끈 기능의 서식·태그는 붙여넣기·HTML 로드로도 들어오지 않는다', () => {
    const e = create(
      ALL,
      '<h1>제목1</h1><h2>제목2</h2>' +
        '<p style="text-align: center; line-height: 200%"><span style="color: #E53935; font-size: 24px; font-family: Georgia, serif">서식</span> ' +
        '<mark data-color="#FFF9C4" style="background-color: #FFF9C4">강조</mark> x<sup>2</sup></p><hr>' +
        '<table><tbody><tr><td><p>셀</p></td></tr></tbody></table>'
    )
    const html = e.getHTML()
    expect(html).not.toMatch(/<h1|<hr|<table|<mark|<sup/)
    expect(html).not.toMatch(/text-align|line-height|color:|font-size|font-family/)
    expect(html).toContain('<h2>제목2</h2>')
    expect(html).toContain('서식')
  })

  it('남겨 둔 서식(굵게·기울임·밑줄·취소선·목록·인용·링크)은 그대로 동작한다', () => {
    const e = create(ALL)
    e.chain()
      .focus()
      .selectAll()
      .toggleBold()
      .toggleItalic()
      .toggleUnderline()
      .toggleStrike()
      .run()
    expect(e.getHTML()).toMatch(/<strong>.*<\/strong>/)
    expect(e.getHTML()).toContain('<em>')
    expect(e.getHTML()).toContain('<u>')
    expect(e.getHTML()).toContain('<s>')
    expect(e.chain().focus().selectAll().toggleBulletList().run()).toBe(true)
    expect(e.chain().focus().toggleOrderedList().run()).toBe(true)
  })

  it('툴바가 호출하는 상태 조회가 끈 기능에도 예외 없이 동작한다', () => {
    const e = create(ALL)
    expect(() => {
      e.isActive('highlight')
      e.isActive('superscript')
      e.isActive('table')
      e.getAttributes('textStyle')
      e.getAttributes('paragraph')
      e.getAttributes('heading')
    }).not.toThrow()
  })

  it('마크다운 저장·재로드는 끈 상태에서도 굵게 등을 보존한다', () => {
    const e = create(ALL)
    e.chain().focus().selectAll().toggleBold().run()
    const md = e.getMarkdown()
    expect(md.trim()).toBe('**본문**')
    const reloaded = new Editor({
      element: document.createElement('div'),
      extensions: createRichTextExtensions({ disabledFeatures: ALL }),
      content: md,
      contentType: 'markdown',
    })
    editors.push(reloaded)
    expect(reloaded.getHTML()).toBe('<p><strong>본문</strong></p>')
  })
})
