import { Input } from 'antd'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import type { AgreementTableConsentParagraph } from '@/features/template/model/writing-form-draft.schema'
import '@/features/template/ui/form-editor/form-editor.css'

const HEADER_PH = '항목명을 입력해 주세요'
const CELL_PH = '텍스트를 입력해 주세요'

export function AgreementTableConsentBody({
  paragraph,
  onChange,
  isEditMode,
}: {
  paragraph: AgreementTableConsentParagraph
  onChange: (next: AgreementTableConsentParagraph) => void
  isEditMode: boolean
}) {
  const setHeader = (index: 0 | 1 | 2, value: string) => {
    const nextHeaders: [string, string, string] = [...paragraph.headerValues]
    nextHeaders[index] = value
    onChange({ ...paragraph, headerValues: nextHeaders })
  }

  const setCell = (index: 0 | 1 | 2, value: string) => {
    const nextCells: [string, string, string] = [...paragraph.cellValues]
    nextCells[index] = value
    onChange({ ...paragraph, cellValues: nextCells })
  }

  return (
    <div className="form-editor-body">
      <div className="form-editor-agreement-table">
        <div className="form-editor-agreement-table__row form-editor-agreement-table__row--header">
          {([0, 1, 2] as const).map(i => (
            <Input
              key={`h-${i}`}
              className="form-editor-agreement-table__cell"
              readOnly={!isEditMode}
              value={paragraph.headerValues[i]}
              placeholder={HEADER_PH}
              onChange={e => setHeader(i, e.target.value)}
            />
          ))}
        </div>
        <div className="form-editor-agreement-table__row">
          {([0, 1, 2] as const).map(i => (
            <Input
              key={`c-${i}`}
              className="form-editor-agreement-table__cell"
              readOnly={!isEditMode}
              value={paragraph.cellValues[i]}
              placeholder={CELL_PH}
              onChange={e => setCell(i, e.target.value)}
            />
          ))}
        </div>
      </div>

      <Input.TextArea
        className="form-editor-agreement-table__footer"
        readOnly={!isEditMode}
        value={paragraph.footerDescription}
        onChange={e => onChange({ ...paragraph, footerDescription: e.target.value })}
        rows={2}
        placeholder="설명을 입력해 주세요"
      />

      <CmsRadioGroup
        className="form-editor-agreement-consent-radios"
        disabled={!isEditMode}
        value={paragraph.selectedPreviewConsent}
        onChange={e => {
          onChange({
            ...paragraph,
            selectedPreviewConsent: e.target.value as 'agree' | 'disagree',
          })
        }}
      >
        <CmsRadio value="agree">동의</CmsRadio>
        <CmsRadio value="disagree">동의하지 않음</CmsRadio>
      </CmsRadioGroup>
    </div>
  )
}
