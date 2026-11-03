/**
 * Run:
 *   node --experimental-strip-types --experimental-transform-types \
 *     src/shared/rich-text/admin-html-editor.selfcheck.ts
 */
import assert from 'node:assert/strict'
import {
  createInitialAdminHtmlEditorState,
  extractAdminRawHtmlBlock,
  isEmptyAdminHtml,
  resolveAdminHtmlForSave,
  toAdminHtmlSource,
  toAdminVisualHtml,
} from './admin-html-editor.ts'
import { getRemoteRichTextBodyError } from './lib/remote-body.ts'

const originalHtml = '<p><strong>기존 HTML</strong></p>'
const initialHtmlState = createInitialAdminHtmlEditorState(originalHtml)
assert.equal(initialHtmlState.mode, 'visual')
assert.equal(initialHtmlState.draftHtml, originalHtml)
assert.equal(
  resolveAdminHtmlForSave(initialHtmlState, originalHtml, '<p>변환 결과</p>'),
  originalHtml
)

assert.equal(
  resolveAdminHtmlForSave(
    { ...initialHtmlState, visualDirty: true },
    originalHtml,
    '<p>시각 편집 결과</p>'
  ),
  '<p>시각 편집 결과</p>'
)

assert.equal(
  resolveAdminHtmlForSave(
    {
      ...initialHtmlState,
      mode: 'html',
      draftHtml: '<section>직접 작성</section>',
      visualDirty: false,
      preserveRawHtmlBlock: false,
    },
    originalHtml,
    '<p>변환 결과</p>'
  ),
  '<section>직접 작성</section>'
)

const markdownState = createInitialAdminHtmlEditorState('## 기존 Markdown')
assert.equal(markdownState.draftHtml, '')
assert.equal(
  resolveAdminHtmlForSave(markdownState, '## 기존 Markdown', '<h2>기존 Markdown</h2>'),
  '<h2>기존 Markdown</h2>'
)

assert.equal(isEmptyAdminHtml('  <p>\n  </p>  '), true)
assert.equal(isEmptyAdminHtml('<p>&nbsp;</p>'), true)
assert.equal(isEmptyAdminHtml('<p>본문</p>'), false)
assert.equal(isEmptyAdminHtml('<img src="https://example.test/a.png" alt="">'), false)
assert.equal(getRemoteRichTextBodyError('<p><img src="data:image/png;base64,abc"></p>') != null, true)
assert.equal(getRemoteRichTextBodyError('a'.repeat(100_001)) != null, true)
assert.equal(getRemoteRichTextBodyError('<p>정상 본문</p>'), null)

const pastedNewsletterHtml =
  '<meta charset="UTF-8"><style>@media only screen and (max-width:640px){.stb-block{width:100%!important}}</style><table><tr><td>원본</td></tr></table>'
const rawStoredHtml = toAdminVisualHtml(pastedNewsletterHtml)
const rawState = createInitialAdminHtmlEditorState(rawStoredHtml)
assert.equal(rawState.preserveRawHtmlBlock, true)
assert.equal(toAdminHtmlSource(rawStoredHtml), pastedNewsletterHtml)
assert.equal(extractAdminRawHtmlBlock(rawStoredHtml), pastedNewsletterHtml)
assert.equal(isEmptyAdminHtml(rawStoredHtml), false)
assert.equal(isEmptyAdminHtml(toAdminVisualHtml('<p></p>')), true)
assert.equal(resolveAdminHtmlForSave(rawState, rawStoredHtml, '<p>파싱 결과</p>'), rawStoredHtml)
assert.equal(
  extractAdminRawHtmlBlock(
    resolveAdminHtmlForSave(
      { ...rawState, mode: 'html', draftHtml: `${pastedNewsletterHtml}<p>추가</p>` },
      rawStoredHtml,
      '<p>파싱 결과</p>'
    )
  ),
  `${pastedNewsletterHtml}<p>추가</p>`
)

console.log('admin html editor selfcheck: ok')
