/**
 * CMS Design System — Rich Text Editor / Viewer (Current)
 * `@/shared/rich-text` → CmsRichTextEditor(Ant 툴바) + RichTextViewer
 * 메일 변수 atom은 `extraExtensions` + `MailVariable`
 */

import { useState } from 'react'
import {
  RichTextEditor,
  RichTextViewer,
  useRichTextEditor,
} from '@/shared/rich-text'
import { CmsButton } from '@/shared/ui'
import { insertMailVariableInEditor } from '@/features/notifications/model/mail-template/insert-variable'
import { MAIL_VARIABLE_EXTENSIONS } from '@/features/notifications/model/mail-template/variable-node'
import { DsDemo, DsSection } from './section'

const DEMO_MARKDOWN = `**CMS Rich Text** 에디터입니다.

- 굵게 / _기울임_ / ~~취소선~~
- [링크](https://example.com) · 목록 · 인용

> shared/rich-text 어댑터로 Ant 툴바가 기본 포함됩니다.`

const MAIL_VARIABLE_DEMO_HTML =
  '<p>안녕하세요, <span class="mail-template-variable" data-mail-variable="회원명">#{회원명}</span>님 <span class="mail-template-variable" data-mail-variable="서비스명">#{서비스명}</span>입니다.</p><p>본문 빈 곳을 클릭하면 커서가 텍스트 위치로 이동합니다. 변수 칩은 통째로만 지울 수 있습니다.</p>'

const MAIL_VARIABLE_INSERT_SAMPLES = ['회원명', '서비스명', '프로그램명'] as const

export function EditorSection() {
  const [previewMarkdown, setPreviewMarkdown] = useState(DEMO_MARKDOWN)
  const [previewHtml, setPreviewHtml] = useState(MAIL_VARIABLE_DEMO_HTML)

  const { editor, api } = useRichTextEditor({
    enabled: true,
    initialContent: DEMO_MARKDOWN,
    contentFormat: 'markdown',
    placeholder: '내용을 입력해 주세요.',
    autofocus: false,
  })

  const { editor: mailEditor, api: mailApi } = useRichTextEditor({
    enabled: true,
    initialContent: MAIL_VARIABLE_DEMO_HTML,
    contentFormat: 'html',
    extraExtensions: MAIL_VARIABLE_EXTENSIONS,
    placeholder: '내용을 작성하세요',
    autofocus: false,
  })

  return (
    <DsSection
      id="editor"
      title="Rich text editor"
      description="Current: @/shared/rich-text 의 RichTextEditor(CmsRichTextEditor + Ant 툴바)와 RichTextViewer. Toast UI는 사용하지 않습니다."
    >
      <p className="ds-note">
        패키지 코어는 <code>@jakorea/rich-text</code>, CMS는 Ant Design 툴바 어댑터입니다. Platform은 별도
        PF 툴바를 쓰며 CMS DS와 무관합니다.
        <br />
        툴바 간격 SSOT: <code>--rt-toolbar-gap: 8px</code> (
        <code>packages/rich-text/src/styles/toolbar.css</code>). 본문 영역을 클릭하면 커서가 텍스트
        위치로 갑니다.
        <br />
        메일 템플릿 변수는 <code>extraExtensions</code>에 <code>MailVariable</code> atom을 넣습니다.{' '}
        <code>#{'{변수}'}</code> 안으로는 커서가 들어가지 않고, 클릭 시 칩 앞/뒤에 커서가 섭니다.
      </p>

      <DsDemo label="RichTextEditor (편집)">
        <p className="ds-demo__hint">
          툴바가 에디터 너비에 맞춰 줄바꿈되며 가로 스크롤이 없습니다.
        </p>
        <div className="ds-editor-demo">
          {editor ? (
            <RichTextEditor editor={editor} minHeight="220px" />
          ) : (
            <p className="ds-note">에디터 로딩 중…</p>
          )}
        </div>
      </DsDemo>

      <DsDemo label="RichTextViewer (미리보기)">
        <div className="ds-demo__stack ds-editor-demo__stack">
          <CmsButton
            variant="secondary"
            size="medium"
            width="auto"
            className="cms-button--no-label-ellipsis"
            onClick={() => setPreviewMarkdown(api?.getMarkdown() ?? DEMO_MARKDOWN)}
          >
            에디터 내용으로 미리보기 갱신
          </CmsButton>
          <div className="ds-editor-demo__viewer">
            <RichTextViewer content={previewMarkdown} contentFormat="markdown" />
          </div>
        </div>
      </DsDemo>

      <DsDemo label="MailVariable extraExtensions (메일 템플릿 본문)">
        <p className="ds-demo__hint">
          SSOT: <code>features/notifications/model/mail-template/variable-node</code>. 변수 버튼을
          누르면 커서 위치에 <code>#{'{회원명}'}</code> 칩이 들어갑니다.
        </p>
        <div className="ds-editor-demo__insert">
          {MAIL_VARIABLE_INSERT_SAMPLES.map(label => (
            <CmsButton
              key={label}
              variant="secondary"
              size="small"
              width="auto"
              type="button"
              className="cms-button--no-label-ellipsis"
              onMouseDown={event => event.preventDefault()}
              onClick={() => {
                if (!mailEditor) return
                insertMailVariableInEditor(mailEditor, label)
              }}
            >
              {`#{${label}}`}
            </CmsButton>
          ))}
        </div>
        <div className="ds-editor-demo">
          {mailEditor ? (
            <RichTextEditor editor={mailEditor} minHeight="220px" />
          ) : (
            <p className="ds-note">에디터 로딩 중…</p>
          )}
        </div>
        <div className="ds-demo__stack ds-editor-demo__stack" style={{ marginTop: 12 }}>
          <CmsButton
            variant="secondary"
            size="medium"
            width="auto"
            className="cms-button--no-label-ellipsis"
            onClick={() => setPreviewHtml(mailApi?.getHTML() ?? MAIL_VARIABLE_DEMO_HTML)}
          >
            변수 본문으로 미리보기 갱신
          </CmsButton>
          <div className="ds-editor-demo__viewer">
            <RichTextViewer
              content={previewHtml}
              contentFormat="html"
              extraExtensions={MAIL_VARIABLE_EXTENSIONS}
            />
          </div>
        </div>
      </DsDemo>

      <DsDemo label="Import">
        <pre className="ds-code">
          {`import { RichTextEditor, RichTextViewer, useRichTextEditor } from '@/shared/rich-text'
import { MAIL_VARIABLE_EXTENSIONS } from '@/features/notifications/model/mail-template/variable-node'

const { editor } = useRichTextEditor({
  enabled: true,
  initialContent: '',
  contentFormat: 'html',
  extraExtensions: MAIL_VARIABLE_EXTENSIONS,
})

<RichTextEditor editor={editor} minHeight="220px" />
<RichTextViewer content={html} contentFormat="html" extraExtensions={MAIL_VARIABLE_EXTENSIONS} />`}
        </pre>
      </DsDemo>
    </DsSection>
  )
}
