import { Input } from 'antd'
import type { AgreementRichTextParagraph } from '@/features/template/model/writing-form-draft.schema'
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
