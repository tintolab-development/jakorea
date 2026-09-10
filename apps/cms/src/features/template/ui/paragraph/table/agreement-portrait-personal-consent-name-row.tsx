import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { CmsInput } from '@/shared/ui/cms-input'
import { DividerVertical } from '@/shared/components/divider-vertical'
import {
  portraitPersonalConsentAffiliationState,
  PORTRAIT_NO_AFFILIATION,
} from '@jakorea/form-schema/consent'
import '@/features/template/ui/paragraph/table/agreement-portrait-personal-consent-name-row.css'

const AFFILIATION_PLACEHOLDER = '소속'

type PortraitAffiliationBodyProps = {
  cell: string
  placeholder?: string
  interactive: boolean
  onChange: (value: string) => void
  onFocus?: () => void
}

/** 초상권 1번 표 소속 칸 — 텍스트 인풋 + 소속 없음 */
export function PortraitAffiliationBody({
  cell,
  placeholder = AFFILIATION_PLACEHOLDER,
  interactive,
  onChange,
  onFocus,
}: PortraitAffiliationBodyProps) {
  const { noAffiliation, affiliation } = portraitPersonalConsentAffiliationState(cell)
  const inputPlaceholder =
    !placeholder.trim() || placeholder.trim() === '소속 기관명'
      ? AFFILIATION_PLACEHOLDER
      : placeholder.trim()

  return (
    <div className="agreement-portrait-personal-consent-name-row__affiliation">
      <div className="agreement-portrait-personal-consent-name-row__affiliation-input-shell">
        <CmsInput
          inputSize="medium"
          width="100%"
          placeholder={inputPlaceholder}
          value={noAffiliation ? '' : affiliation}
          disabled={!interactive || noAffiliation}
          onChange={e => {
            if (!interactive || noAffiliation) return
            onChange(e.target.value)
          }}
          onFocus={() => onFocus?.()}
          aria-label="소속"
        />
      </div>
      <DividerVertical />
      <CmsCheckbox
        checkboxSize="large"
        checked={noAffiliation}
        disabled={!interactive}
        onChange={e => {
          if (!interactive) return
          onFocus?.()
          onChange(e.target.checked ? PORTRAIT_NO_AFFILIATION : '')
        }}
      >
        {PORTRAIT_NO_AFFILIATION}
      </CmsCheckbox>
    </div>
  )
}
