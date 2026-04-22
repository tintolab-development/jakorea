import { Input } from 'antd'
import type { AgreementPrivacyRowsParagraph } from '@/features/template/model/writing-form-draft.schema'
import '@/features/template/ui/form-editor/form-editor.css'

export function AgreementPrivacyRowsBody({
  paragraph,
  onChange: _onChange,
  isEditMode: _isEditMode,
}: {
  paragraph: AgreementPrivacyRowsParagraph
  onChange: (next: AgreementPrivacyRowsParagraph) => void
  isEditMode: boolean
}) {
  return (
    <div className="form-editor-body">
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
