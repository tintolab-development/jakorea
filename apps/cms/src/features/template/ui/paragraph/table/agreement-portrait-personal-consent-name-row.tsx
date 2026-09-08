import { Input } from 'antd'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { DividerVertical } from '@/shared/components/divider-vertical'
import { portraitPersonalConsentAffiliationState } from '@jakorea/form-schema/consent'

const NO_AFFILIATION = '소속 없음'
import '@/features/template/ui/paragraph/table/agreement-portrait-personal-consent-name-row.css'

type PortraitAffiliationBodyProps = {
  cell: string
  placeholder: string
  interactive: boolean
  onChange: (value: string) => void
  onFocus?: () => void
}

/** 초상권 1번 표 소속 칸 — 주관식형 인풋 + 소속 없음 */
export function PortraitAffiliationBody({
  cell,
  placeholder,
  interactive,
  onChange,
  onFocus,
}: PortraitAffiliationBodyProps) {
  const { noAffiliation, affiliation } = portraitPersonalConsentAffiliationState(cell)
  const affiliationDisplay = noAffiliation ? NO_AFFILIATION : affiliation

  if (!interactive) {
    return (
      <div className="form-editor-vertical-table__cell-input-shell form-editor-vertical-table__cell-input-shell--body form-editor-vertical-table__cell-input-shell--body-subjective">
        <span className="form-editor-vertical-table__cell-text form-editor-vertical-table__cell-text--body">
          {affiliationDisplay}
        </span>
      </div>
    )
  }

  return (
    <div className="agreement-portrait-personal-consent-name-row__affiliation">
      <div className="form-editor-vertical-table__cell-input-shell form-editor-vertical-table__cell-input-shell--body form-editor-vertical-table__cell-input-shell--body-subjective agreement-portrait-personal-consent-name-row__affiliation-input-shell">
        <Input
          variant="borderless"
          value={noAffiliation ? '' : affiliation}
          placeholder={placeholder}
          disabled={noAffiliation}
          onChange={e => {
            if (noAffiliation) return
            onChange(e.target.value)
          }}
          onFocus={() => onFocus?.()}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') e.stopPropagation()
          }}
        />
      </div>
      <DividerVertical />
      <CmsCheckbox
        checkboxSize="large"
        checked={noAffiliation}
        onChange={e => {
          onFocus?.()
          onChange(e.target.checked ? NO_AFFILIATION : '')
        }}
      >
        {NO_AFFILIATION}
      </CmsCheckbox>
    </div>
  )
}
