import { Input } from 'antd'
import type { AgreementRichTextParagraph } from '@/features/template/model/writing-form-draft.schema'
import { ParagraphInput } from '@/features/template/ui/paragraph/shared/paragraph-input'
import '@/features/template/ui/form-editor/form-editor.css'

export function AgreementRichTextBody({
  paragraph,
  onChange,
  isEditMode,
}: {
  paragraph: AgreementRichTextParagraph
  onChange: (next: AgreementRichTextParagraph) => void
  isEditMode: boolean
}) {
  const ph = paragraph.bodyPlaceholder || '텍스트를 작성해 주세요'

  return (
    <div className="form-editor-body">
      <ParagraphInput
        type="title"
        isEditMode={isEditMode}
        value={paragraph.paragraphTitle}
        onChange={next => onChange({ ...paragraph, paragraphTitle: next })}
        placeholder="타이틀을 입력해 주세요"
      />
      <ParagraphInput
        type="description"
        isEditMode={isEditMode}
        value={paragraph.paragraphDescription}
        onChange={next => onChange({ ...paragraph, paragraphDescription: next })}
        placeholder="설명 입력"
      />
      <Input.TextArea
        className="form-editor-subjective"
        readOnly={!isEditMode}
        value={paragraph.bodyText}
        placeholder={ph}
        rows={5}
        onChange={isEditMode ? e => onChange({ ...paragraph, bodyText: e.target.value }) : undefined}
      />
    </div>
  )
}
