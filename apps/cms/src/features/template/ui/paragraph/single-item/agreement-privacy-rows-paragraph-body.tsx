import { Input } from 'antd'
import type { AgreementPrivacyRowsParagraph } from '@/features/template/model/writing-form-draft.schema'
import { ParagraphInput } from '@/features/template/ui/paragraph/shared/paragraph-input'
import '@/features/template/ui/form-editor/form-editor.css'

export function AgreementPrivacyRowsBody({
  paragraph,
  onChange,
  isEditMode,
}: {
  paragraph: AgreementPrivacyRowsParagraph
  onChange: (next: AgreementPrivacyRowsParagraph) => void
  isEditMode: boolean
}) {
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
      <div className="form-editor-agreement-privacy-rows">
        {paragraph.rows.map(row => (
          <div key={row.id} className="form-editor-agreement-privacy-rows__row">
            <span className="form-editor-agreement-privacy-rows__bullet" aria-hidden>
              •
            </span>
            <span className="form-editor-agreement-privacy-rows__label">{row.label}</span>
            <Input className="form-editor-agreement-privacy-rows__input" readOnly placeholder={row.placeholder} />
          </div>
        ))}
      </div>
    </div>
  )
}
