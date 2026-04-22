import { Input } from 'antd'
import type { SubjectiveParagraph } from '@/features/template/model/writing-form-draft.schema'
import '@/features/template/ui/form-editor/form-editor.css'

export function SubjectiveParagraphBody({
  paragraph,
  isEditMode: _isEditMode,
}: {
  paragraph: SubjectiveParagraph
  isEditMode: boolean
}) {
  const ph = paragraph.items[0]?.placeholder ?? '답변을 입력해 주세요'
  return (
    <div className="form-editor-body">
      <Input.TextArea className="form-editor-subjective" readOnly placeholder={ph} rows={5} />
    </div>
  )
}
