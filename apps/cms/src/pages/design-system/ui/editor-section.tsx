/**
 * CMS Design System — Rich Text Editor / Viewer (Current)
 * `@/shared/rich-text` → CmsRichTextEditor(Ant 툴바) + RichTextViewer
 */

import { useState } from 'react'
import {
  RichTextEditor,
  RichTextViewer,
  useRichTextEditor,
} from '@/shared/rich-text'
import { CmsButton } from '@/shared/ui'
import { DsDemo, DsSection } from './section'

const DEMO_MARKDOWN = `**CMS Rich Text** 에디터입니다.

- 굵게 / _기울임_ / ~~취소선~~
- [링크](https://example.com) · 목록 · 인용

> shared/rich-text 어댑터로 Ant 툴바가 기본 포함됩니다.`

export function EditorSection() {
  const [previewMarkdown, setPreviewMarkdown] = useState(DEMO_MARKDOWN)

  const { editor, api } = useRichTextEditor({
    enabled: true,
    initialContent: DEMO_MARKDOWN,
    contentFormat: 'markdown',
    placeholder: '내용을 입력해 주세요.',
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
      </p>

      <DsDemo label="RichTextEditor (편집)">
        <div className="ds-editor-demo">
          {editor ? (
            <RichTextEditor editor={editor} minHeight="220px" />
          ) : (
            <p className="ds-note">에디터 로딩 중…</p>
          )}
        </div>
      </DsDemo>

      <DsDemo label="RichTextViewer (미리보기)">
        <div className="ds-demo__stack">
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

      <DsDemo label="Import">
        <pre className="ds-code">
          {`import { RichTextEditor, RichTextViewer, useRichTextEditor } from '@/shared/rich-text'

const { editor } = useRichTextEditor({
  enabled: true,
  initialContent: '',
  contentFormat: 'markdown',
})

<RichTextEditor editor={editor} minHeight="220px" />
<RichTextViewer content={md} contentFormat="markdown" />`}
        </pre>
      </DsDemo>
    </DsSection>
  )
}
